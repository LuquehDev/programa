import { useEffect, useState } from "react";
import { useImages } from "@/auth/components/ImageProvider";

type MediaKind = "movie" | "series" | "any";
type PosterInfo = { title: string; year?: number; kind?: MediaKind };
type PersonInfo = { name: string };

export type MainMeta = { icon?: React.ReactNode; text: string; className?: string };

export type MainCardProps = {
  image?: string; 
  poster?: PosterInfo;  
  person?: PersonInfo;
  placeholderSrc?: string;

  title: string;
  description?: string;

  meta?: MainMeta[];
  rightTopExtra?: React.ReactNode;

  imgHeightClass?: string;
  className?: string;
};

export default function MainCard({
  image,
  poster,
  person,
  placeholderSrc = "https://via.placeholder.com/640x960?text=Poster",
  title,
  description,
  meta,
  rightTopExtra,
  imgHeightClass = "h-96 md:h-full",
  className = "",
}: MainCardProps) {
  const { getPosterOrFallback, getPersonOrFallback } = useImages();
  const [resolvedSrc, setResolvedSrc] = useState<string>(image || "");

  useEffect(() => {
    let alive = true;
    (async () => {
      if (image) { setResolvedSrc(image); return; }
      if (poster) {
        const url = await getPosterOrFallback({
          title: poster.title, year: poster.year, kind: poster.kind ?? "any",
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
    return () => { alive = false; };
  }, [image, poster?.title, poster?.year, poster?.kind, person?.name]);

  return (
    <div className={`bg-white rounded-2xl shadow-sm overflow-hidden ${className}`}>
      <div className="md:flex">
        <div className="md:w-1/3">
          <img
            src={resolvedSrc || placeholderSrc}
            alt={title}
            className={`w-full object-cover ${imgHeightClass}`}
            loading="lazy"
          />
        </div>

        <div className="p-8 md:w-2/3">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{title}</h1>
            {rightTopExtra ? <div className="shrink-0">{rightTopExtra}</div> : null}
          </div>

          {meta && meta.length > 0 && (
            <div className="flex flex-wrap gap-6 mb-6">
              {meta.map((m, i) => (
                <div key={i} className={`flex items-center text-gray-600 ${m.className ?? ""}`}>
                  {m.icon ? <span className="mr-2">{m.icon}</span> : null}
                  <span className="font-medium">{m.text}</span>
                </div>
              ))}
            </div>
          )}

          {description && (
            <p className="text-gray-700 text-lg leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
