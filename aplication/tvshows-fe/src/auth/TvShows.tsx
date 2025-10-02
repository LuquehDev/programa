import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  Play,
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
};

const PAGE_SIZE = 8;
const API_BASE = "http://localhost:30120";

export default function TVShowList() {
  const { isAuthenticated, user } = useAuth();
  const loc = useLocation();

  const [items, setItems] = useState<TVShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const [favBusy, setFavBusy] = useState<string | null>(null);

  // filtros
  const [search, setSearch] = useState("");
  const [genreFilter, setGenreFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  if (!isAuthenticated)
    return <Navigate to="/login" replace state={{ from: loc }} />;

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setErr(null);
        const res = await fetch(`${API_BASE}/tv-shows`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as TVShow[];
        setItems(Array.isArray(data) ? data : []);
      } catch (e: any) {
        setErr(e?.message ?? "Erro ao carregar TV shows");
        setItems([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    async function loadFavs() {
      try {
        const res = await fetch(`${API_BASE}/users/${user?.id}/favorites-ids`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const ids = (await res.json()) as string[];
        setFavIds(new Set(ids));
      } catch {
        setFavIds(new Set());
      }
    }
    loadFavs();
  }, [user?.id]);

  async function sendRecommendationsEmail(userId: string) {
    try {
      const res = await fetch(
        `${API_BASE}/users/${userId}/recommendations-email`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      console.log("Erro: ", e);
    }
  }

  async function addFavorite(tvShowId: string) {
    if (!user?.id) return setErr("Não foi possível identificar o utilizador.");
    try {
      setFavBusy(tvShowId);
      const res = await fetch(
        `${API_BASE}/users/${user.id}/favorites/${tvShowId}`,
        { method: "POST" }
      );
      if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);
      setFavIds((prev) => new Set(prev).add(tvShowId));
      sendRecommendationsEmail(user.id);
    } catch (e: any) {
      setErr(e?.message ?? "Não foi possível adicionar aos favoritos");
    } finally {
      setFavBusy(null);
    }
  }

  async function removeFavorite(tvShowId: string) {
    if (!user?.id) return setErr("Não foi possível identificar o utilizador.");
    try {
      setFavBusy(tvShowId);
      const res = await fetch(
        `${API_BASE}/users/${user.id}/favorites/${tvShowId}`,
        { method: "DELETE" }
      );
      if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);
      setFavIds((prev) => {
        const next = new Set(prev);
        next.delete(tvShowId);
        return next;
      });
    } catch (e: any) {
      setErr(e?.message ?? "Não foi possível remover dos favoritos");
    } finally {
      setFavBusy(null);
    }
  }

  // todos os géneros
  const allGenres = useMemo(() => {
    const set = new Set<string>();
    items.forEach((s) => s.genres?.forEach((g) => set.add(g.name)));
    return Array.from(set).sort();
  }, [items]);

  // todos os types
  const allTypes = useMemo(() => {
    const set = new Set<string>();
    items.forEach((s) => s.type && set.add(s.type));
    return Array.from(set).sort();
  }, [items]);

  // aplicar filtros + ordenar
  const filteredItems = useMemo(() => {
    let result = items;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((s) => s.title.toLowerCase().includes(q));
    }
    if (genreFilter) {
      result = result.filter((s) =>
        s.genres?.some((g) => g.name === genreFilter)
      );
    }
    if (typeFilter) {
      result = result.filter((s) => s.type === typeFilter);
    }
    return result.slice().sort((a, b) => a.title.localeCompare(b.title));
  }, [items, search, genreFilter, typeFilter]);

  const total = filteredItems.length;
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / PAGE_SIZE)),
    [total]
  );
  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [filteredItems, page]);

  useEffect(() => {
    setPage(1);
  }, [search, genreFilter, typeFilter]);

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  // -------- Export helpers --------
  function toCSV(rows: TVShow[]) {
    const esc = (v: unknown) => {
      const s = v == null ? "" : String(v);
      const needs = /[",\n]/.test(s);
      return needs ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = [
      "id",
      "title",
      "type",
      "releaseYear",
      "genres",
      "rating",
      "description",
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
    const csv = toCSV(filteredItems);
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    downloadBlob(csv, `STtv-shows-${ts}.csv`, "text/csv;charset=utf-8");
  }

  function handleExportPDF() {
    const win = window.open("", "_blank");
    if (!win) return;
    const rows = filteredItems
      .map(
        (s) => `
        <tr>
          <td>${s.id}</td>
          <td>${s.title}</td>
          <td>${s.type ?? ""}</td>
          <td>${s.releaseYear ?? ""}</td>
          <td>${s.genres?.map((g) => g.name).join(", ") ?? ""}</td>
          <td>${s.rating ?? ""}</td>
          <td>${s.description ? s.description.replace(/</g, "&lt;") : ""}</td>
        </tr>`
      )
      .join("");

    win.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>TV Shows</title>
<style>
  body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; padding: 24px; }
  h1 { font-size: 20px; margin: 0 0 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { border: 1px solid #ddd; padding: 8px; vertical-align: top; }
  th { background: #f3f4f6; text-align: left; }
</style>
</head>
<body>
  <h1>TV Shows — ${filteredItems.length} registos</h1>
  <table>
    <thead>
      <tr><th>ID</th><th>Title</th><th>Type</th><th>Year</th><th>Genres</th><th>Rating</th><th>Description</th></tr>
    </thead>
    <tbody>
      ${rows || `<tr><td colspan="7">Sem dados</td></tr>`}
    </tbody>
  </table>
  <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 300); };</script>
</body>
</html>`);
    win.document.close();
  }
  // ---------------------------------

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
              <Play className="text-white ml-1" size={32} />
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            TV Shows
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover amazing TV shows and their talented cast
          </p>
        </div>

        {/* filtros + export à direita */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex flex-col md:flex-row md:flex-wrap gap-4 items-start">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by name"
              className="px-3 py-2 border rounded-lg w-full md:w-64"
            />

            <select
              value={genreFilter}
              onChange={(e) => setGenreFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg w-full md:w-56"
            >
              <option value="">All genres</option>
              {allGenres.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg w-full md:w-40"
            >
              <option value="">All types</option>
              {allTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 self-start md:self-auto">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
              aria-label="Export filtered data as CSV"
            >
              <Download size={16} /> Export CSV
            </button>
            <button
              onClick={handleExportPDF}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
              aria-label="Export filtered data as PDF"
            >
              <FileText size={16} /> Export PDF
            </button>
          </div>
        </div>

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
          <div className="max-w-xl mx-auto p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
            {err}
          </div>
        )}

        {!loading && !err && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {pageItems.map((show) => {
                const isFav = favIds.has(show.id);
                const isBusy = favBusy === show.id;
                const kind =
                  show.type === "movie"
                    ? "movie"
                    : show.type === "series"
                    ? "series"
                    : "any";

                return (
                  <Card
                    key={show.id}
                    to={`/tv-shows/${show.id}`}
                    aspect="video"
                    title={show.title}
                    image={show.image}
                    poster={{ title: show.title, year: show.releaseYear, kind }}
                    description={
                      show.description ?? "No description available."
                    }
                    meta={[
                      {
                        icon: <Calendar size={16} className="text-blue-500" />,
                        text: String(show.releaseYear ?? "—"),
                      },
                      {
                        icon: <Tag size={16} className="text-purple-500" />,
                        text: show.genres?.length
                          ? show.genres.map((g) => g.name).join(", ")
                          : "—",
                      },
                      {
                        icon: (
                          <Star
                            size={16}
                            className="fill-current text-yellow-500"
                          />
                        ),
                        text: String(show.rating ?? "—"),
                        className: "bg-yellow-50 text-yellow-700",
                      },
                    ]}
                    favorite={{
                      isFav,
                      isBusy,
                      onToggle: () =>
                        isFav ? removeFavorite(show.id) : addFavorite(show.id),
                      ariaLabel: isFav
                        ? "Remover dos favoritos"
                        : "Adicionar aos favoritos",
                    }}
                  />
                );
              })}
            </div>

            {/* paginação */}
            <div className="mt-10 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 bg-white disabled:opacity-50"
              >
                <ChevronLeft size={16} /> Prev
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const p = i + 1;
                  const active = p === page;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-9 h-9 rounded-lg border text-sm ${
                        active
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent"
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
              >
                Next <ChevronRight size={16} />
              </button>
            </div>

            <p className="mt-3 text-center text-sm text-gray-600">
              Page <span className="font-semibold">{page}</span> of{" "}
              <span className="font-semibold">{totalPages}</span> — {total} item
              {total === 1 ? "" : "s"}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
