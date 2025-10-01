import { useEffect, useState, useMemo } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import {
  Star,
  Calendar,
  Tag,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

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

  const [payload, setPayload] = useState<TVShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: loc }} />;
  }

  // Carrega favoritos (ids) e filtra shows no front a partir de /tv-shows
  const load = async () => {
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
      const favSet = new Set(favIds);

      if (favSet.size === 0) {
        setPayload([]);
        return;
      }

      const resAll = await fetch(`${API_BASE}/tv-shows`);
      if (!resAll.ok) throw new Error(`HTTP ${resAll.status}`);
      const allShows = (await resAll.json()) as TVShow[];

      const onlyFavs = (Array.isArray(allShows) ? allShows : []).filter((s) =>
        favSet.has(s.id)
      );
      setPayload(onlyFavs);
    } catch (e: any) {
      setErr(e?.message ?? "Erro ao carregar favoritos");
      setPayload([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  const removeFavorite = async (tvShowId: string) => {
    if (!user?.id) {
      setErr("Não foi possível identificar o utilizador.");
      return;
    }
    try {
      setBusyId(tvShowId);
      const res = await fetch(
        `${API_BASE}/users/${user.id}/favorites/${tvShowId}`,
        { method: "DELETE" }
      );
      if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);
      setPayload((prev) => prev.filter((s) => s.id !== tvShowId));
    } catch (e: any) {
      setErr(e?.message ?? "Não foi possível remover dos favoritos");
    } finally {
      setBusyId(null);
    }
  };

  // Paginação (idêntica à do TVShowList)
  const total = payload.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return payload.slice(start, start + PAGE_SIZE);
  }, [payload, page]);

  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));
  const goTo = (p: number) => setPage(p);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          Meus Favoritos
        </h1>

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
            {pageItems.length === 0 ? (
              <p className="text-gray-600">Não tens favoritos ainda.</p>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {pageItems.map((show) => {
                    const isBusy = busyId === show.id;
                    return (
                      <Link
                        key={show.id}
                        to={`/tv-shows/${show.id}`}
                        className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:scale-105 hover:-translate-y-2 border border-gray-100/50"
                      >
                        <button
                          type="button"
                          aria-label="Remover dos favoritos"
                          title="Remover dos favoritos"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!isBusy) removeFavorite(show.id);
                          }}
                          className={`absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center shadow 
                        bg-yellow-400 text-white ${
                          isBusy
                            ? "opacity-60 cursor-wait"
                            : "hover:bg-yellow-500"
                        }`}
                        >
                          <Star
                            size={20}
                            className="fill-current drop-shadow"
                          />
                        </button>

                        <div className="aspect-video overflow-hidden relative">
                          <img
                            src={
                              show.image ||
                              "https://via.placeholder.com/640x360?text=TV+Show"
                            }
                            alt={show.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="absolute top-4 right-16 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                            <Eye className="text-white" size={18} />
                          </div>
                        </div>

                        <div className="p-6 relative">
                          <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                            {show.title}
                          </h3>

                          <div className="space-y-3 mb-4">
                            <div className="flex items-center text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                              <Calendar
                                size={16}
                                className="mr-2 text-blue-500"
                              />
                              <span>{show.releaseYear ?? "—"}</span>
                            </div>

                            <div className="flex items-center text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                              <Tag size={16} className="mr-2 text-purple-500" />
                              <span>
                                {show.genres && show.genres.length > 0
                                  ? show.genres.map((g) => g.name).join(", ")
                                  : "—"}
                              </span>
                            </div>
                          </div>

                          <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed">
                            {show.description ?? "No description available."}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Paginação idêntica à do TVShowList */}
                <div className="mt-10 flex items-center justify-center gap-2">
                  <button
                    onClick={goPrev}
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
                          onClick={() => goTo(p)}
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
                    onClick={goNext}
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
