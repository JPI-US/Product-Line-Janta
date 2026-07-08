import { useMemo, useState } from "react";
import type { ROOTS_COPY } from "./websiteRootsData";

type FilmCopy = (typeof ROOTS_COPY)["film"];

export function WebsiteRootsFilmSection({ film }: { film: FilmCopy }) {
  const sources = useMemo(
    () => [film.src, film.fallbackSrc].filter((url): url is string => Boolean(url)),
    [film.src, film.fallbackSrc],
  );
  const [sourceIndex, setSourceIndex] = useState(0);
  const activeSrc = sources[sourceIndex] ?? film.src;

  return (
    <section className="web-roots-film" aria-label="Tintinto field video">
      <div className="web-roots-film__stage">
        <video
          key={activeSrc}
          className="web-roots-film__video"
          src={activeSrc}
          controls
          playsInline
          preload="metadata"
          poster={film.poster}
          onError={() => {
            if (sourceIndex < sources.length - 1) {
              setSourceIndex((index) => index + 1);
            }
          }}
        />
      </div>
    </section>
  );
}
