import { useEffect, useState } from "react";
import { useParams, Link, Navigate, useLocation } from "react-router-dom";
import { ArrowLeft, Star, Calendar, Tag, Users, Film } from "lucide-react";
import { useAuth } from "@/lib/auth";
import Card from "@/auth/components/Card";
import MainCard from "@/auth/components/MainCard";
import { useImages } from "@/auth/components/ImageProvider";

type Genre = { id: string; name: string };
type CastItem = {
  actorId: string;
  billing?: number | null;
  fullName: string;
  nationality?: string | null;
  birthDate?: string | null;
  introduction?: string | null;
};

type EpisodeDto = {
  id?: string;
  title: string;
  season?: number | null;
  number?: number | null;
  runtimeMin?: number | null;
  airDate?: string | null;
  overview?: string | null;
  EpisodeNumber?: number | null;
  SeasonNumber?: number | null;
  Title?: string | null;
  Synopsis?: string | null;
  ReleaseDate?: string | null;
};

type ApiShowDetails = {
  id: string;
  title: string;
  description?: string | null;
  type?: string | null;
  releaseYear?: number | null;
  genres?: Genre[];
  cast: CastItem[];
  episodes?: EpisodeDto[];
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

function normEp(x: EpisodeDto, idx: number) {
  const season = x.season ?? x.SeasonNumber ?? null;
  const number = x.number ?? x.EpisodeNumber ?? null;
  return {
    id: String(
      x.id ?? `${season ?? 0}-${number ?? idx}-${x.title ?? x.Title ?? "ep"}`
    ),
    title: String(x.title ?? x.Title ?? "Episode"),
    season,
    number,
    runtimeMin: x.runtimeMin ?? null,
    airDate: x.airDate ?? x.ReleaseDate ?? null,
    overview: x.overview ?? x.Synopsis ?? null,
  };
}

export default function TVShowDetails() {
  const { isAuthenticated } = useAuth();
  const loc = useLocation();
  const { id } = useParams<{ id: string }>();
  const { getPosterOrFallback } = useImages();
  const [data, setData] = useState<ApiShowDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [posterUrl, setPosterUrl] = useState<string>("");
  const [episodes, setEpisodes] = useState<ReturnType<typeof normEp>[]>([]);
  const [epsLoading, setEpsLoading] = useState(false);
  const [epsErr, setEpsErr] = useState<string | null>(null);

  useEffect(() => {
    let abort = false;
    async function run() {
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
    }
    if (id) run();
    return () => {
      abort = true;
    };
  }, [id]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!data) return;
      const kind =
        data.type === "movie"
          ? "movie"
          : data.type === "series"
          ? "series"
          : "any";
      const url = await getPosterOrFallback({
        title: data.title,
        year: data.releaseYear ?? undefined,
        kind,
      });
      if (alive) setPosterUrl(url);
    })();
    return () => {
      alive = false;
    };
  }, [data, getPosterOrFallback]);

  useEffect(() => {
    let alive = true;
    if (!data?.id) return;

    async function loadEpisodes() {
      try {
        setEpsLoading(true);
        setEpsErr(null);

        let list: EpisodeDto[] = Array.isArray(data?.episodes)
          ? data.episodes
          : [];
        if (!list.length) {
          const r = await fetch(`${API_BASE}/tv-show/${data?.id}/episodes`);
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          const raw = (await r.json()) as EpisodeDto[];
          list = Array.isArray(raw) ? raw : [];
        }

        const mapped = list.map((e, i) => normEp(e, i));
        mapped.sort((a, b) => {
          const sa = a.season ?? 0,
            sb = b.season ?? 0;
          if (sa !== sb) return sa - sb;
          const na = a.number ?? 0,
            nb = b.number ?? 0;
          return na - nb;
        });

        if (alive) setEpisodes(mapped);
      } catch (e: any) {
        if (alive) {
          setEpsErr(e?.message ?? "Falha ao obter episódios");
          setEpisodes([]);
        }
      } finally {
        if (alive) setEpsLoading(false);
      }
    }

    loadEpisodes();
    return () => {
      alive = false;
    };
  }, [data?.id, data?.episodes]);

  if (!isAuthenticated)
    return <Navigate to="/login" replace state={{ from: loc }} />;

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

  const kind =
    data?.type === "movie"
      ? "movie"
      : data?.type === "series"
      ? "series"
      : "any";

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

        {/* Loading */}
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

        {/* Conteúdo */}
        {!loading && data && (
          <>
            {/* Header*/}
            <MainCard
              image={posterUrl}
              poster={
                !posterUrl
                  ? {
                      title: data.title,
                      year: data.releaseYear ?? undefined,
                      kind,
                    }
                  : undefined
              }
              title={data.title}
              description={data.description ?? "Sem descrição disponível."}
              meta={[
                {
                  icon: <Calendar size={20} />,
                  text: String(data.releaseYear ?? "—"),
                },
                {
                  icon: <Tag size={20} />,
                  text: data.genres?.length
                    ? data.genres.map((g) => g.name).join(", ")
                    : "—",
                },
                {
                  icon: (
                    <Star size={20} className="fill-current text-yellow-500" />
                  ),
                  text: "—",
                  className: "text-yellow-700",
                },
              ]}
            />

            {/* Episodes */}
            <div className="mt-12">
              <div className="flex items-center mb-8">
                <Film size={24} className="mr-3 text-gray-700" />
                <h2 className="text-2xl font-bold text-gray-900">Episodes</h2>
              </div>

              {epsLoading && (
                <div className="text-gray-600 text-sm">
                  A carregar episódios…
                </div>
              )}
              {epsErr && !epsLoading && (
                <div className="text-red-600 text-sm">{epsErr}</div>
              )}

              {!epsLoading && !epsErr && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {episodes.map((e) => (
                    <Card
                      key={e.id}
                      image={posterUrl}
                      aspect="video"
                      title={e.title}
                      description={e.overview ?? "—"}
                      meta={[
                        {
                          icon: <Calendar size={16} />,
                          text: e.airDate ?? "—",
                        },
                        {
                          icon: <Tag size={16} />,
                          text: `${
                            e.season != null ? `S${e.season}` : "S–"
                          } · ${e.number != null ? `E${e.number}` : "E–"}`,
                        },
                        ...(e.runtimeMin != null
                          ? [
                              {
                                icon: <Tag size={16} />,
                                text: `${e.runtimeMin} min`,
                              },
                            ]
                          : []),
                      ]}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Cast */}
            <div className="mt-12">
              <div className="flex items-center mb-8">
                <Users size={24} className="mr-3 text-gray-700" />
                <h2 className="text-2xl font-bold text-gray-900">Cast</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {data.cast.map((a) => {
                  const age = calcAge(a.birthDate);
                  return (
                    <Card
                      key={a.actorId}
                      to={`/actors/${a.actorId}`}
                      aspect="square"
                      title={a.fullName}
                      person={{ name: a.fullName }}
                      description={a.introduction ?? "—"}
                      meta={[
                        {
                          icon: <Users size={16} />,
                          text: a.nationality ?? "—",
                        },
                        {
                          icon: <Calendar size={16} />,
                          text: age !== null ? `${age} anos` : "—",
                        },
                      ]}
                      badge={
                        typeof a.billing === "number"
                          ? `billing #${a.billing}`
                          : undefined
                      }
                    />
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
