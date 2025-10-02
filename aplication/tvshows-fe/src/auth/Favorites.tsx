import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import {
  Star,
  Calendar,
  Tag,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import Card from "@/auth/components/Card";

type Genre = { id: string; name: string };
type TVShow = {
  id: string;
  title: string;
  description: string | null;
  type: "series" | "movie" | string;
  releaseYear?: number;
  genres?: Genre[];
  image?: string;
  rating?: number | string;
  favoritedAt?: string;
};

const API_BASE = "http://localhost:30120";
const PAGE_SIZE = 8;

export default function FavoritesPage() {
  const { isAuthenticated, user } = useAuth();
  const loc = useLocation();

  const [items, setItems] = useState<TVShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);

  if (!isAuthenticated)
    return <Navigate to="/login" replace state={{ from: loc }} />;

  async function load() {
    if (!user?.id) {
      setErr("Não foi possível identificar o utilizador.");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setErr(null);

      const resIds = await fetch(`${API_BASE}/users/${user.id}/favorites-ids`);
      if (!resIds.ok) throw new Error(`HTTP ${resIds.status}`);
      const favIds = (await resIds.json()) as string[];
      const setIds = new Set(favIds);

      if (!setIds.size) {
        setItems([]);
        return;
      }

      const resAll = await fetch(`${API_BASE}/tv-shows`);
      if (!resAll.ok) throw new Error(`HTTP ${resAll.status}`);
      const all = (await resAll.json()) as TVShow[];

      setItems((Array.isArray(all) ? all : []).filter((s) => setIds.has(s.id)));
    } catch (e: any) {
      setErr(e?.message ?? "Erro ao carregar favoritos");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function removeFavorite(tvShowId: string) {
    if (!user?.id) return setErr("Não foi possível identificar o utilizador.");
    try {
      setBusyId(tvShowId);
      const res = await fetch(
        `${API_BASE}/users/${user.id}/favorites/${tvShowId}`,
        { method: "DELETE" }
      );
      if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);
      setItems((prev) => prev.filter((s) => s.id !== tvShowId));
    } catch (e: any) {
      setErr(e?.message ?? "Não foi possível remover dos favoritos");
    } finally {
      setBusyId(null);
    }
  }

  // ---- Export helpers ----
  function toCSV(rows: TVShow[]) {
    const esc = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = [
      "id",
      "title",
      "type",
      "releaseYear",
      "genres",
      "rating",
      "description",
      "favoritedAt",
    ];
    const lines = [
      header.join(","),
      ...rows.map((r) =>
        [
          r.id,
          r.title,
          r.type ?? "",
          r.releaseYear ?? "",
          r.genres?.map((g) => g.name).join("|") ?? "",
          r.rating ?? "",
          r.description ?? "",
          r.favoritedAt ?? "",
        ]
          .map(esc)
          .join(",")
      ),
    ];
    return lines.join("\n");
  }

  function downloadBlob(content: BlobPart, filename: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function handleExportCSV() {
    const csv = toCSV(items);
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    downloadBlob(csv, `STfavorites-${ts}.csv`, "text/csv;charset=utf-8");
  }

  function handleExportPDF() {
    const win = window.open("", "_blank");
    if (!win) return;
    const rows = items
      .map(
        (s) => `
        <tr>
          <td>${s.id}</td>
          <td>${s.title}</td>
          <td>${s.type ?? ""}</td>
          <td>${s.releaseYear ?? ""}</td>
          <td>${s.genres?.map((g) => g.name).join(", ") ?? ""}</td>
          <td>${s.rating ?? ""}</td>
          <td>${s.favoritedAt ?? ""}</td>
          <td>${s.description ? s.description.replace(/</g, "&lt;") : ""}</td>
        </tr>`
      )
      .join("");

    win.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Favorites</title>
<style>
  body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; padding: 24px; }
  h1 { font-size: 20px; margin: 0 0 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { border: 1px solid #ddd; padding: 8px; vertical-align: top; }
  th { background: #fff7ed; text-align: left; }
</style>
</head>
<body>
  <h1>Favorites — ${items.length} registos</h1>
  <table>
    <thead>
      <tr><th>ID</th><th>Título</th><th>Tipo</th><th>Ano</th><th>Géneros</th><th>Rating</th><th>Favoritado em</th><th>Descrição</th></tr>
    </thead>
    <tbody>
      ${rows || `<tr><td colspan="8">Sem dados</td></tr>`}
    </tbody>
  </table>
  <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 300); };</script>
</body>
</html>`);
    win.document.close();
  }
  // ------------------------

  const total = items.length;
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / PAGE_SIZE)),
    [total]
  );
  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, page]);

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-yellow-50 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-br from-yellow-400/10 to-amber-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-gradient-to-br from-amber-400/10 to-orange-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-2xl">
              <Star className="text-white fill-white" size={32} />
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-600 via-amber-600 to-orange-600 bg-clip-text text-transparent mb-2">
            Favorites
          </h1>
          <p className="text-xl text-gray-700">Your starred TV shows</p>
        </div>

        {/* nova barra de ações à esquerda */}
        <div className="mb-6">
          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
              aria-label="Export favorites as CSV"
            >
              <Download size={16} /> Export CSV
            </button>
            <button
              onClick={handleExportPDF}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
              aria-label="Export favorites as PDF"
            >
              <FileText size={16} /> Export PDF
            </button>
          </div>
        </div>

        {/* Loading / Error */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <div
                key={i}
                className="h-72 bg-white/60 backdrop-blur-sm rounded-2xl shadow animate-pulse border border-gray-100/50"
              />
            ))}
          </div>
        )}

        {!loading && err && (
          <div className="max-w-xl mx-auto p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl">
            {err}
          </div>
        )}

        {!loading && !err && (
          <>
            {pageItems.length === 0 ? (
              <p className="text-gray-700 text-center">
                Ainda não tens favoritos.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {pageItems.map((show) => {
                    const kind =
                      show.type === "movie"
                        ? "movie"
                        : show.type === "series"
                        ? "series"
                        : "any";
                    const busy = busyId === show.id;

                    return (
                      <Card
                        key={show.id}
                        to={`/tv-shows/${show.id}`}
                        aspect="video"
                        title={show.title}
                        image={show.image}
                        poster={{
                          title: show.title,
                          year: show.releaseYear,
                          kind,
                        }}
                        description={
                          show.description ?? "No description available."
                        }
                        meta={[
                          {
                            icon: (
                              <Calendar size={16} className="text-amber-600" />
                            ),
                            text: String(show.releaseYear ?? "—"),
                          },
                          {
                            icon: <Tag size={16} className="text-yellow-600" />,
                            text: show.genres?.length
                              ? show.genres.map((g) => g.name).join(", ")
                              : "—",
                          },
                        ]}
                        favorite={{
                          isFav: true,
                          isBusy: busy,
                          onToggle: () => removeFavorite(show.id),
                          ariaLabel: "Remover dos favoritos",
                        }}
                      />
                    );
                  })}
                </div>

                <div className="mt-10 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 bg-white disabled:opacity-50"
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={16} /> Prev
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }).map((_, i) => {
                      const p = i + 1;
                      const isEdge = p === 1 || p === totalPages;
                      const isNear = Math.abs(p - page) <= 1;
                      if (!(isEdge || isNear)) {
                        if (p === 2 && page > 3) return <span key={p}>…</span>;
                        if (p === totalPages - 1 && page < totalPages - 2)
                          return <span key={p}>…</span>;
                        return null;
                      }
                      const active = p === page;
                      return (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`w-9 h-9 rounded-lg border text-sm ${
                            active
                              ? "bg-gradient-to-r from-yellow-600 to-amber-600 text-white border-transparent"
                              : "border-gray-200"
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 disabled:opacity-50"
                    aria-label="Next page"
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>

                <p className="mt-3 text-center text-sm text-gray-600">
                  Page <span className="font-semibold">{page}</span> of{" "}
                  <span className="font-semibold">{totalPages}</span> — {total}{" "}
                  item{total === 1 ? "" : "s"}
                </p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
