import { useEffect, useState } from "react";
import { useParams, Link, Navigate, useLocation } from "react-router-dom";
import { ArrowLeft, Calendar, Users, Tag, Film } from "lucide-react";
import { useAuth } from "@/lib/auth";

type Genre = { id: string; name: string };

type ActorShowItem = {
  tvShowId: string;
  billing?: number | null;
  title: string;
  description?: string | null;
  type?: string | null;
  releaseYear?: number | null;
  genres?: Genre[];
};

type ApiActorDetails = {
  id: string;
  fullName: string;
  nationality?: string | null;
  birthDate?: string | null;
  introduction?: string | null;
  createdAt?: string;
  updatedAt?: string;
  tvShows: ActorShowItem[];
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

export default function ActorDetails() {
  const { isAuthenticated} = useAuth();
  const loc = useLocation();
  const { id } = useParams<{ id: string }>();

  const [data, setData] = useState<ApiActorDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: loc }} />;
  }

  useEffect(() => {
    let abort = false;
    const run = async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await fetch(`${API_BASE}/actor/${id}/details`);
        if (!res.ok) {
          if (res.status === 404) throw new Error("Actor não encontrado.");
          throw new Error(`HTTP ${res.status}`);
        }
        const payload = (await res.json()) as ApiActorDetails;
        if (!abort) setData(payload);
      } catch (e: any) {
        if (!abort) setErr(e?.message ?? "Erro ao carregar detalhes");
      } finally {
        if (!abort) setLoading(false);
      }
    };
    if (id) run();
    return () => { abort = true; };
  }, [id]);

  if (!loading && (err || !data)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {err ?? "Actor Not Found"}
          </h2>
          <Link to="/actors" className="text-blue-600 hover:text-blue-700">
            Voltar à lista
          </Link>
        </div>
      </div>
    );
  }

  const age = calcAge(data?.birthDate);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          to="/actors"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-8 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          Voltar aos Actors
        </Link>

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
            {/* Header do Actor */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="md:flex">
                <div className="md:w-1/3">
                  <img
                    src={"https://via.placeholder.com/640x800?text=Actor"}
                    alt={data.fullName}
                    className="w-full h-96 md:h-full object-cover"
                  />
                </div>

                <div className="p-8 md:w-2/3">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    {data.fullName}
                  </h1>

                  <div className="flex flex-wrap gap-6 mb-6">
                    <div className="flex items-center text-gray-600">
                      <Users size={20} className="mr-2" />
                      <span className="font-medium">
                        {data.nationality ?? "—"}
                        {age !== null ? ` • ${age} anos` : ""}
                      </span>
                    </div>

                    <div className="flex items-center text-gray-600">
                      <Calendar size={20} className="mr-2" />
                      <span className="font-medium">
                        {data.birthDate ? new Date(data.birthDate).toLocaleDateString() : "—"}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-700 text-lg leading-relaxed mb-8">
                    {data.introduction ?? "Sem biografia disponível."}
                  </p>
                </div>
              </div>
            </div>

            {/* TV Shows */}
            <div className="mt-12">
              <div className="flex items-center mb-8">
                <Film size={24} className="mr-3 text-gray-700" />
                <h2 className="text-2xl font-bold text-gray-900">Tv Shows participated</h2>
              </div>

              {data.tvShows.length === 0 ? (
                <div className="text-gray-600">No participation registered</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {data.tvShows.map(show => (
                    <Link
                      key={show.tvShowId}
                      to={`/tv-shows/${show.tvShowId}`}
                      className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group"
                    >
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={"https://via.placeholder.com/640x360?text=TV+Show"}
                          alt={show.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                          {show.title}
                          {typeof show.billing === "number" ? (
                            <span className="ml-2 text-xs text-gray-500 font-normal">
                              (billing #{show.billing})
                            </span>
                          ) : null}
                        </h3>

                        <div className="flex items-center text-gray-600 text-sm mb-2">
                          <Calendar size={16} className="mr-2" />
                          <span className="font-medium">{show.releaseYear ?? "—"}</span>
                        </div>

                        <div className="flex items-center text-gray-600 text-sm">
                          <Tag size={16} className="mr-2" />
                          <span>
                            {show.genres && show.genres.length > 0
                              ? show.genres.map(g => g.name).join(", ")
                              : "—"}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
