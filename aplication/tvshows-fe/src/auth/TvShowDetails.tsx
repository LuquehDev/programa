import { useEffect, useState } from "react";
import { useParams, Link, Navigate, useLocation } from "react-router-dom";
import { ArrowLeft, Star, Calendar, Tag, Users } from "lucide-react";
import { useAuth } from "@/lib/auth";

type Genre = { id: string; name: string };
type CastItem = {
  actorId: string;
  billing?: number | null;
  fullName: string;
  nationality?: string | null;
  birthDate?: string | null;
  introduction?: string | null;
};

type ApiShowDetails = {
  id: string;
  title: string;
  description?: string | null;
  type?: string | null;
  releaseYear?: number | null;
  createdAt?: string;
  updatedAt?: string;
  genres?: Genre[];
  cast: CastItem[];
  // episodes?: { id: string; seasonNumber: number; episodeNumber: number; title: string; releaseDate?: string | null }[]; // se adicionares no backend
};

const API_BASE = "http://localhost:30120";

function calcAge(birthDate?: string | null): number | null {
  if (!birthDate) return null;
  const d = new Date(birthDate);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return Math.max(0, age);
}

export default function TVShowDetails() {
  const { isAuthenticated } = useAuth();
  const loc = useLocation();
  const { id } = useParams<{ id: string }>();

  const [data, setData] = useState<ApiShowDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: loc }} />;
  }

  useEffect(() => {
    console.log("ID DO TVSHOW: ", id);
  }, [id]);

  useEffect(() => {
    let abort = false;
    const run = async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await fetch(`${API_BASE}/tv-show/${id}/details`);
        if (!res.ok) {
          if (res.status === 404) throw new Error("TV Show não encontrado.");
          throw new Error(`HTTP ${res.status}`);
        }
        const payload = (await res.json()) as ApiShowDetails;
        if (!abort) setData(payload);
      } catch (e: any) {
        if (!abort) setErr(e?.message ?? "Erro ao carregar detalhes");
      } finally {
        if (!abort) setLoading(false);
      }
    };
    if (id) run();
    return () => {
      abort = true;
    };
  }, [id]);

  if (!loading && (err || !data)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {err ?? "Show Not Found"}
          </h2>
          <Link to="/tv-shows" className="text-blue-600 hover:text-blue-700">
            Voltar à lista
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          to="/tv-shows"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-8 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          Voltar aos TV Shows
        </Link>

        {/* Skeleton */}
        {loading && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
            <div className="md:flex">
              <div className="md:w-1/3 h-96 bg-gray-200" />
              <div className="p-8 md:w-2/3 space-y-4">
                <div className="h-8 bg-gray-200 w-1/2" />
                <div className="h-5 bg-gray-200 w-1/3" />
                <div className="h-5 bg-gray-200 w-1/4" />
                <div className="h-24 bg-gray-200 w-full" />
              </div>
            </div>
          </div>
        )}

        {!loading && data && (
          <>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="md:flex">
                <div className="md:w-1/3">
                  <img
                    src={"https://via.placeholder.com/640x960?text=Poster"}
                    alt={data.title}
                    className="w-full h-96 md:h-full object-cover"
                  />
                </div>

                <div className="p-8 md:w-2/3">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    {data.title}
                  </h1>

                  <div className="flex flex-wrap gap-6 mb-6">
                    <div className="flex items-center text-gray-600">
                      <Calendar size={20} className="mr-2" />
                      <span className="font-medium">
                        {data.releaseYear ?? "—"}
                      </span>
                    </div>

                    <div className="flex items-center text-gray-600">
                      <Tag size={20} className="mr-2" />
                      <span className="font-medium">
                        {data.genres && data.genres.length > 0
                          ? data.genres.map((g) => g.name).join(", ")
                          : "—"}
                      </span>
                    </div>

                    <div className="flex items-center text-yellow-600">
                      <Star size={20} className="mr-2 fill-current" />
                      <span className="font-medium">—</span>
                    </div>
                  </div>

                  <p className="text-gray-700 text-lg leading-relaxed mb-8">
                    {data.description ?? "Sem descrição disponível."}
                  </p>
                </div>
              </div>
            </div>

            {/* Cast */}
            <div className="mt-12">
              <div className="flex items-center mb-8">
                <Users size={24} className="mr-3 text-gray-700" />
                <h2 className="text-2xl font-bold text-gray-900">Casts</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {data.cast.map((actor) => {
                  const age = calcAge(actor.birthDate);
                  return (
                    <Link
                      key={actor.actorId}
                      to={`/actors/${actor.actorId}`}
                      className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group"
                    >
                      <div className="aspect-square overflow-hidden">
                        <img
                          src={"https://via.placeholder.com/640x640?text=Actor"}
                          alt={actor.fullName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                          {actor.fullName}
                          {typeof actor.billing === "number" ? (
                            <span className="ml-2 text-xs text-gray-500 font-normal">
                              (billing #{actor.billing})
                            </span>
                          ) : null}
                        </h3>

                        <p className="text-gray-600 text-sm">
                          {actor.nationality ?? "—"}
                          {age !== null ? ` • ${age} anos` : ""}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Episódios (opcional — ativa se o backend devolver) */}
            {/* {data.episodes && data.episodes.length > 0 && (
              <div className="mt-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Episódios</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.episodes.map(ep => (
                    <div key={ep.id} className="bg-white rounded-xl shadow p-4">
                      <div className="text-sm text-gray-500 mb-1">
                        T{ep.seasonNumber} • E{ep.episodeNumber}
                      </div>
                      <div className="font-semibold">{ep.title}</div>
                      <div className="text-xs text-gray-500">
                        {ep.releaseDate ? new Date(ep.releaseDate).toLocaleDateString() : "—"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )} */}
          </>
        )}
      </div>
    </div>
  );
}
