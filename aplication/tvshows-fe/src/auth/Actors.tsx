import { Link, Navigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { MapPin, Calendar, User, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/auth";

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

  const [payload, setPayload] = useState<Actor[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: loc }} />;
  }

  useEffect(() => {
    const fetchActors = async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await fetch("http://localhost:30120/actors");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as Actor[];
        setPayload(Array.isArray(data) ? data : []);
      } catch (e: any) {
        setErr(e?.message ?? "Erro ao carregar actors");
      } finally {
        setLoading(false);
      }
    };
    fetchActors();
  }, []);

  const total = payload.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return payload
      .map(a => ({
        id: a.id,
        image: "https://via.placeholder.com/600x600?text=Actor",
        name: a.fullName,
        nationality: a.nationality ?? "—",
        age: a.age ?? "—",
        biography: a.introduction ?? "No introduction available.",
      }))
      .slice(start, start + PAGE_SIZE);
  }, [payload, page]);

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

        {/* Loading / Error */}
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
            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {pageItems.map((actor) => (
                <Link
                  key={actor.id}
                  to={`/actors/${actor.id}`}
                  className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:scale-105 hover:-translate-y-2 border border-gray-100/50"
                >
                  <div className="aspect-square overflow-hidden relative">
                    <img
                      src={actor.image}
                      alt={actor.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                      <User className="text-white" size={18} />
                    </div>
                  </div>

                  <div className="p-6 relative">
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                      {actor.name}
                    </h3>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                        <MapPin size={16} className="mr-2 text-purple-500" />
                        <span>{actor.nationality}</span>
                      </div>

                      <div className="flex items-center text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                        <Calendar size={16} className="mr-2 text-pink-500" />
                        <span>Age {actor.age}</span>
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed">
                      {actor.biography}
                    </p>
                  </div>
                </Link>
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
                    if (p === totalPages - 1 && page < totalPages - 2) return <span key={p}>…</span>;
                    return null;
                  }
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
