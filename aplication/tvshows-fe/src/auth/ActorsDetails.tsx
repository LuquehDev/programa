import { useEffect, useState } from "react";
import { useParams, Link, Navigate, useLocation } from "react-router-dom";
import { ArrowLeft, Calendar, Users, Tag, Film } from "lucide-react";
import { useAuth } from "@/lib/auth";
import Card from "@/auth/components/Card";
import MainCard from "@/auth/components/MainCard";

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
  const { isAuthenticated } = useAuth();
  const loc = useLocation();
  const { id } = useParams<{ id: string }>();

  const [data, setData] = useState<ApiActorDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: loc }} />;

  useEffect(() => {
    let abort = false;
    async function run() {
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
    }
    if (id) run();
    return () => { abort = true; };
  }, [id]);

  if (!loading && (err || !data)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{err ?? "Actor Not Found"}</h2>
          <Link to="/actors" className="text-blue-600 hover:text-blue-700">Voltar à lista</Link>
        </div>
      </div>
    );
  }

  const age = calcAge(data?.birthDate);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/actors" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-8 transition-colors">
          <ArrowLeft size={20} className="mr-2" />
          Voltar aos Actors
        </Link>

        {/* Skeleton */}
        {loading && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
            <div className="md:flex">
              <div className="md:w-1/3 h-96 bg-gray-200" />
              <div className="p-8 md:w-2/3 space-y-4">
                <div className="h-8 bg-gray-200 w-1/2" />
                <div className="h-5 bg-gray-200 w-1/3" />
                <div className="h-5 bg-gray-2 00 w-1/4" />
                <div className="h-24 bg-gray-200 w-full" />
              </div>
            </div>
          </div>
        )}

        {/* Conteúdo */}
        {!loading && data && (
          <>
            {/* Main header*/}
            <MainCard
              person={{ name: data.fullName }}
              title={data.fullName}
              description={data.introduction ?? "No biography available."}
              meta={[
                {
                  icon: <Users size={20} />,
                  text: `${data.nationality ?? "—"}${age !== null ? ` • ${age}yo` : ""}`,
                },
                {
                  icon: <Calendar size={20} />,
                  text: data.birthDate ? new Date(data.birthDate).toLocaleDateString() : "—",
                },
              ]}
              imgHeightClass="h-96 md:h-full"
            />

            {/* TV Shows do ator */}
            <div className="mt-12">
              <div className="flex items-center mb-8">
                <Film size={24} className="mr-3 text-gray-700" />
                <h2 className="text-2xl font-bold text-gray-900">Tv Shows</h2>
              </div>

              {data.tvShows.length === 0 ? (
                <div className="text-gray-600">No participation registered</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {data.tvShows.map((s) => {
                    const kind = s.type === "movie" ? "movie" : s.type === "series" ? "series" : "any";
                    return (
                      <Card
                        key={s.tvShowId}
                        to={`/tv-shows/${s.tvShowId}`}
                        aspect="video"
                        title={s.title}
                        poster={{ title: s.title, year: s.releaseYear ?? undefined, kind }}
                        description={s.description ?? ""}
                        meta={[
                          { icon: <Calendar size={16} />, text: String(s.releaseYear ?? "—") },
                          {
                            icon: <Tag size={16} />,
                            text: s.genres?.length ? s.genres.map((g) => g.name).join(", ") : "—",
                          },
                        ]}
                        badge={typeof s.billing === "number" ? `billing #${s.billing}` : undefined}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
