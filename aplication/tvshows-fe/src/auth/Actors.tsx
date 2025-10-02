import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  MapPin,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import Card from "@/auth/components/Card";

type Actor = {
  id: string;
  fullName: string;
  nationality?: string | null;
  age?: number | null;
  introduction?: string | null;
};

const PAGE_SIZE = 8;

export default function ActorList() {
  const { isAuthenticated } = useAuth();
  const loc = useLocation();
  const [items, setItems] = useState<Actor[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [nationalityFilter, setNationalityFilter] = useState("");

  if (!isAuthenticated)
    return <Navigate to="/login" replace state={{ from: loc }} />;

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setErr(null);
        const res = await fetch("http://localhost:30120/actors");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as Actor[];
        setItems(Array.isArray(data) ? data : []);
      } catch (e: any) {
        setErr(e?.message ?? "Erro ao carregar actors");
        setItems([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ---------- nacionalidades aqui ----------
  const allNationalities = useMemo(() => {
    const set = new Set<string>();
    items.forEach((a) => {
      if (a.nationality) set.add(a.nationality);
    });
    return Array.from(set).sort();
  }, [items]);

  // ---------- filtros e ordenação aqui ----------
  const filteredItems = useMemo(() => {
    let result = items;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((a) => a.fullName.toLowerCase().includes(q));
    }
    if (nationalityFilter) {
      result = result.filter((a) => a.nationality === nationalityFilter);
    }
    return result.slice().sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [items, search, nationalityFilter]);

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
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  // ---------- formatar pra CSV ----------
  function toCSV(rows: Actor[]) {
    const esc = (v: unknown) => {
      const s = v == null ? "" : String(v);
      const needs = /[",\n]/.test(s);
      return needs ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = ["id", "fullName", "nationality", "age", "introduction"];
    const lines = [
      header.join(","),
      ...rows.map((r) =>
        [
          r.id,
          r.fullName,
          r.nationality ?? "",
          r.age ?? "",
          r.introduction ?? "",
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
    downloadBlob(csv, `STactors-${ts}.csv`, "text/csv;charset=utf-8");
  }

  function handleExportPDF() {
    const win = window.open("", "_blank");
    if (!win) return;
    const rows = filteredItems
      .map(
        (a) => `
        <tr>
          <td>${a.id}</td>
          <td>${a.fullName}</td>
          <td>${a.nationality ?? ""}</td>
          <td>${a.age ?? ""}</td>
          <td>${a.introduction ? a.introduction.replace(/</g, "&lt;") : ""}</td>
        </tr>`
      )
      .join("");

    win.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Actors</title>
<style>
  body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; padding: 24px; }
  h1 { font-size: 20px; margin: 0 0 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { border: 1px solid #ddd; padding: 8px; vertical-align: top; }
  th { background: #f3f4f6; text-align: left; }
</style>
</head>
<body>
  <h1>Actors — ${filteredItems.length} registos</h1>
  <table>
    <thead>
      <tr><th>ID</th><th>Name</th><th>Nationality</th><th>Age</th><th>Indtroduction</th></tr>
    </thead>
    <tbody>
      ${rows || `<tr><td colspan="5">Sem dados</td></tr>`}
    </tbody>
  </table>
  <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 300); };</script>
</body>
</html>`);
    win.document.close();
  }
  // ------------------------------------

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 relative overflow-hidden">
      {/* background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-gradient-to-br from-pink-400/10 to-rose-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-2xl">
              <User className="text-white" size={32} />
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text text-transparent mb-2">
            Actors
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Meet the talented actors behind your favorite shows
          </p>
        </div>

        {/* filtros*/}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by name"
              className="px-3 py-2 border rounded-lg w-full md:w-64"
            />
            <select
              value={nationalityFilter}
              onChange={(e) => setNationalityFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg w-full md:w-64"
            >
              <option value="">All nationalities</option>
              {allNationalities.map((n) => (
                <option key={n} value={n}>
                  {n}
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

        {/* Loading ou Error */}
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
            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {pageItems.map((a) => (
                <Card
                  key={a.id}
                  to={`/actors/${a.id}`}
                  aspect="square"
                  title={a.fullName}
                  person={{ name: a.fullName }}
                  description={a.introduction ?? "No introduction available."}
                  meta={[
                    {
                      icon: <MapPin size={16} className="text-purple-500" />,
                      text: a.nationality ?? "—",
                    },
                    {
                      icon: <Calendar size={16} className="text-pink-500" />,
                      text: `Age ${a.age ?? "—"}`,
                    },
                  ]}
                />
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-10 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-white disabled:opacity-50"
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
                          ? "bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white border-transparent"
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
              <span className="font-semibold">{totalPages}</span> — {total} item
              {total === 1 ? "" : "s"}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
