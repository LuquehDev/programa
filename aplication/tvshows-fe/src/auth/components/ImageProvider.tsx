import React, { createContext, useContext, useRef } from "react";

export type MediaKind = "movie" | "series" | "episode" | "game" | "any";

export type ImageClientOptions = {
  omdbKey?: string;             
  enableLocalStorage?: boolean; 
  defaultPoster?: string;       
  defaultPerson?: string;       
};

type PosterQuery = { title: string; year?: number; kind?: MediaKind };
type PersonQuery = { name: string };

export type ImageClient = {
  getPoster(q: PosterQuery): Promise<string | null>;
  getPersonPhoto(q: PersonQuery): Promise<string | null>;
  getPosterOrFallback(q: PosterQuery): Promise<string>;
  getPersonOrFallback(q: PersonQuery): Promise<string>;
};

const ImageContext = createContext<ImageClient | null>(null);

const DEFAULTS = {
  poster: "",
  person: "",
};

function makeKey(prefix: string, parts: Record<string, string | number | undefined>) {
  const data = Object.entries(parts)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${k}=${String(v)}`)
    .join("&");
  return `${prefix}:${data}`;
}

function readCache(key: string, ram: Map<string, string | null>, useLocal: boolean) {
  if (ram.has(key)) return ram.get(key)!;
  if (useLocal && typeof localStorage !== "undefined") {
    const v = localStorage.getItem(key);
    if (v === "null") return null;
    if (v) return v;
  }
  return undefined;
}

function writeCache(
  key: string,
  value: string | null,
  ram: Map<string, string | null>,
  useLocal: boolean
) {
  ram.set(key, value);
  if (useLocal && typeof localStorage !== "undefined") {
    localStorage.setItem(key, value ?? "null");
  }
}

async function fetchJson(url: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ---------- Provider ----------
export const ImageProvider: React.FC<
  React.PropsWithChildren<{ options?: ImageClientOptions }>
> = ({ options, children }) => {
  const ramCache = useRef<Map<string, string | null>>(new Map()).current;

  const omdbKey = options?.omdbKey ?? "2d300440";
  const useLocal = options?.enableLocalStorage ?? true;
  const defaultPoster = options?.defaultPoster ?? DEFAULTS.poster;
  const defaultPerson = options?.defaultPerson ?? DEFAULTS.person;
  const OMDB_BASE = "https://www.omdbapi.com/";

  // ---- Poster OMDb ----
  async function getPoster(q: PosterQuery): Promise<string | null> {
    const kind = q.kind && q.kind !== "any" ? q.kind : undefined;
    const key = makeKey("poster", { t: q.title.trim(), y: q.year, type: kind });
    const cached = readCache(key, ramCache, useLocal);
    if (cached !== undefined) return cached;

    const typeParam = kind ? `&type=${encodeURIComponent(kind)}` : "";
    const yearParam = q.year ? `&y=${encodeURIComponent(String(q.year))}` : "";
    const url = `${OMDB_BASE}?apikey=${omdbKey}&t=${encodeURIComponent(q.title)}${typeParam}${yearParam}`;

    const data = await fetchJson(url);
    const poster =
      data?.Response === "True" && data?.Poster && data.Poster !== "N/A"
        ? String(data.Poster)
        : null;

    writeCache(key, poster, ramCache, useLocal);
    return poster;
  }

  // ---- Foto do ator ----
  async function getPersonPhoto(q: PersonQuery): Promise<string | null> {
    const key = makeKey("person", { name: q.name.trim() });
    const cached = readCache(key, ramCache, useLocal);
    if (cached !== undefined) return cached;

    const title = q.name.trim().replace(/\s+/g, "_");
    const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const wiki = await fetchJson(wikiUrl);

    const photo: string | null =
      wiki?.thumbnail?.source || wiki?.originalimage?.source || null;

    writeCache(key, photo, ramCache, useLocal);
    return photo;
  }

  async function getPosterOrFallback(q: PosterQuery): Promise<string> {
    return (await getPoster(q)) ?? defaultPoster;
  }

  async function getPersonOrFallback(q: PersonQuery): Promise<string> {
    return (await getPersonPhoto(q)) ?? defaultPerson;
  }

  const client: ImageClient = {
    getPoster,
    getPersonPhoto,
    getPosterOrFallback,
    getPersonOrFallback,
  };

  return <ImageContext.Provider value={client}>{children}</ImageContext.Provider>;
};

// ---------- Hook ----------
export function useImages(): ImageClient {
  const ctx = useContext(ImageContext);
  if (!ctx) throw new Error("useImages() must be used within <ImageProvider>.");
  return ctx;
}
