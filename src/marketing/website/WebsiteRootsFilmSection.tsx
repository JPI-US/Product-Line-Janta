import type { ROOTS_COPY } from "./websiteRootsData";

type FilmCopy = (typeof ROOTS_COPY)["film"];

export function WebsiteRootsFilmSection({ film }: { film: FilmCopy }) {
  return (
    <section className="web-roots-film" aria-label="Tintinto field video">
      <div className="web-roots-film__stage">
        <video
          className="web-roots-film__video"
          controls
          playsInline
          preload="metadata"
          poster={film.poster}
        >
          <source src={film.src} type="video/mp4" />
        </video>
      </div>
    </section>
  );
}
