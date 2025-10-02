import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { useImages } from "@/auth/components/ImageProvider";

type MediaKind = "movie" | "series" | "any";
type PosterInfo = { title: string; year?: number; kind?: MediaKind };
type PersonInfo = { name: string };

export type CardMetaLine = {
  icon?: React.ReactNode;
  text: string;
  className?: string;
};

export type CardProps = {
  to?: string;
  aspect?: "video" | "square" | "portrait";
  image?: string;
  poster?: PosterInfo;
  person?: PersonInfo;
  placeholderSrc?: string;

  title: string;
  meta?: CardMetaLine[];
  description?: string;

  favorite?: {
    isFav: boolean;
    isBusy?: boolean;
    onToggle: () => void;
    ariaLabel?: string;
  };
  badge?: string;
  className?: string;
};

export default function Card({
  to,
  aspect = "video",
  image,
  poster,
  person,
  placeholderSrc = "https://via.placeholder.com/640x360?text=Image",
  title,
  meta,
  description,
  favorite,
  badge,
  className = "",
}: CardProps) {
  const { getPosterOrFallback, getPersonOrFallback } = useImages();
  const [resolvedSrc, setResolvedSrc] = useState<string>(image || "");

  useEffect(() => {
    let alive = true;
    (async () => {
      if (image) {
        setResolvedSrc(image);
        return;
      }
      if (poster) {
        const url = await getPosterOrFallback({
          title: poster.title,
          year: poster.year,
          kind: poster.kind ?? "any",
        });
        if (alive) setResolvedSrc(url);
        return;
      }
      if (person) {
        const url = await getPersonOrFallback({ name: person.name });
        if (alive) setResolvedSrc(url);
        return;
      }
      if (alive) setResolvedSrc(placeholderSrc);
    })();
    return () => {
      alive = false;
    };
  }, [image, poster?.title, poster?.year, poster?.kind, person?.name]);

  const Wrapper: React.ElementType = to ? Link : "div";
  const wrapperProps = to ? { to } : {};

  const aspectClass =
    aspect === "video"
      ? "aspect-video"
      : aspect === "square"
      ? "aspect-square"
      : "aspect-[2/3]";

  return (
    <Wrapper
      {...wrapperProps}
      className={`group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:scale-105 hover:-translate-y-2 border border-gray-100/50 ${className}`}
    >
      {/* Favorito */}
      {favorite && (
        <Star
          size={20}
          className={
            favorite.isFav
              ? "fill-current absolute top-4 right-4 z-10 text-yellow-500"
              : "absolute top-4 right-4 z-10 text-yellow-500"
          }
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!favorite.isBusy) favorite.onToggle();
          }}
        />
      )}

      {/* Imagem */}
      <div className={`${aspectClass} overflow-hidden relative`}>
        <img
          src={resolvedSrc || placeholderSrc}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Conteúdo */}
      <div className="p-6 relative">
        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
          {title}
          {badge ? (
            <span className="ml-2 text-xs text-gray-500 font-normal align-middle">
              ({badge})
            </span>
          ) : null}
        </h3>

        {meta && meta.length > 0 && (
          <div className="space-y-3 mb-4">
            {meta.map((m, i) => (
              <div
                key={i}
                className={`flex items-center text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 ${
                  m.className ?? ""
                }`}
              >
                {m.icon ? <span className="mr-2">{m.icon}</span> : null}
                <span>{m.text}</span>
              </div>
            ))}
          </div>
        )}

        {description && (
          <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </Wrapper>
  );
}
