import type { ROOTS_COPY } from "./websiteRootsData";

type FilmCopy = (typeof ROOTS_COPY)["film"];

export function WebsiteRootsFilmSection({ film }: { film: FilmCopy }) {
  return (
    <section className="web-roots-film" aria-label="Tintinto field video">
      <div className="web-roots-film__stage">
        <video
          className="web-roots-film__video"
          src={film.src}
          controls
          playsInline
          preload="metadata"
          poster={film.poster}
        />
      </div>
    </section>
  );
}
