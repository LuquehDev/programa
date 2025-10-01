import { Link, Navigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Play, Eye, Star, Calendar, Tag, ChevronLeft, ChevronRight } from "lucide-react";
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
};

const PAGE_SIZE = 8;
const API_BASE = "http://localhost:30120";

export default function TVShowList() {
  const { isAuthenticated, user } = useAuth();
  const loc = useLocation();

  const [payload, setPayload] = useState<TVShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const [favBusy, setFavBusy] = useState<string | null>(null);
  const [favIds, setFavIds] = useState<Set<string>>(new Set());

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: loc }} />;
  }

  // 1) Carrega TODOS os TV Shows
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await fetch(`${API_BASE}/tv-shows`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as TVShow[];
        setPayload(Array.isArray(data) ? data : []);
      } catch (e: any) {
        setErr(e?.message ?? "Erro ao carregar TV shows");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 2) Carrega SOMENTE os IDs favoritos do user
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/users/${user.id}/favorites-ids`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const ids = (await res.json()) as string[];
        setFavIds(new Set(ids));
      } catch (e) {
        console.log("Falhou carregar favoritos:", (e as any)?.message);
        setFavIds(new Set()); // sem quebrar UI
      }
    })();
  }, [user?.id]);

  // 3) POST pra marcar favorito (NÃO filtra a lista principal)
  const addFavorite = async (tvShowId: string) => {
    if (!user?.id) {
      setErr("Não foi possível identificar o utilizador.");
      return;
    }
    try {
      setFavBusy(tvShowId);
      const res = await fetch(`${API_BASE}/users/${user.id}/favorites/${tvShowId}`, {
        method: "POST",
      });
      if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);
      setFavIds(prev => new Set(prev).add(tvShowId)); // só pinta a estrela
    } catch (e: any) {
      setErr(e?.message ?? "Não foi possível adicionar aos favoritos");
    } finally {
      setFavBusy(null);
    }
  };

  // Paginação — SEM filtrar por favoritos
  const total = payload.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    setPage(p => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return payload.slice(start, start + PAGE_SIZE);
  }, [payload, page]);

  const goPrev = () => setPage(p => Math.max(1, p - 1));
  const goNext = () => setPage(p => Math.min(totalPages, p + 1));
  const goTo   = (p: number) => setPage(p);

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

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <div key={i} className="h-72 bg-white/60 backdrop-blur-sm rounded-2xl shadow animate-pulse border border-gray-100/50" />
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
              {pageItems.map(show => {
                const isFav = favIds.has(show.id);
                const isBusy = favBusy === show.id;

                return (
                  <Link
                    key={show.id}
                    to={`/tv-shows/${show.id}`}
                    className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:scale-105 hover:-translate-y-2 border border-gray-100/50"
                  >
                    {/* Estrela: pinta se estiver nos favoritos */}
                    <button
                      type="button"
                      aria-label={isFav ? "Nos favoritos" : "Adicionar aos favoritos"}
                      title={isFav ? "Nos favoritos" : "Adicionar aos favoritos"}
                      onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!isBusy && !isFav) addFavorite(show.id);
                      }}
                      className={`absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center shadow
                        bg-white/90 
                        ${isBusy ? "opacity-60 cursor-wait" : "cursor-pointer"}`}
                    >
                      <Star
                        size={20}
                        className={`drop-shadow transition-all duration-200 ${isFav ? "text-yellow-400" : "text-yellow-500"}`}
                        fill={isFav ? "currentColor" : "none"}
                      />
                    </button>

                    <div className="aspect-video overflow-hidden relative">
                      <img
                        src={show.image || "https://via.placeholder.com/640x360?text=TV+Show"}
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
                          <Calendar size={16} className="mr-2 text-blue-500" />
                          <span>{show.releaseYear ?? "—"}</span>
                        </div>

                        <div className="flex items-center text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                          <Tag size={16} className="mr-2 text-purple-500" />
                          <span>{show.genres && show.genres.length > 0 ? show.genres.map(g => g.name).join(", ") : "—"}</span>
                        </div>

                        <div className="flex items-center text-sm text-yellow-600 bg-yellow-50 rounded-lg px-3 py-2">
                          <Star size={16} className="mr-2 fill-current animate-pulse" />
                          <span className="font-semibold">{show.rating ?? "—"}</span>
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

            {/* Paginação certinha */}
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
                    if (p === totalPages - 1 && page < totalPages - 2) return <span key={p}>…</span>;
                    return null;
                  }
                  const active = p === page;
                  return (
                    <button
                      key={p}
                      onClick={() => goTo(p)}
                      className={`w-9 h-9 rounded-lg border text-sm ${active
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent"
                        : "border-gray-200"}`}
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
              <span className="font-semibold">{totalPages}</span> — {total} item{total === 1 ? "" : "s"}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
