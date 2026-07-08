import segments from "./rootsFilmSegments.json";

export type RootsFilmSegment = (typeof segments)[number];

export type RootsFilmChapter = {
  start: number;
  tag: string;
  title: string;
  caption: string;
};

export const ROOTS_FILM_SEGMENTS = segments;

export function buildRootsFilmChapters(
  filmSegments: readonly {
    start: number;
    end: number;
    tag: string;
    title: string;
    caption: string;
  }[],
): RootsFilmChapter[] {
  let offset = 0;
  return filmSegments.map((segment) => {
    const chapter = {
      start: offset,
      tag: segment.tag,
      title: segment.title,
      caption: segment.caption,
    };
    offset += Math.max(0, segment.end - segment.start);
    return chapter;
  });
}

export const ROOTS_FILM_CHAPTERS = buildRootsFilmChapters(ROOTS_FILM_SEGMENTS);

export function getRootsFilmChapterAtTime(
  time: number,
  chapters: readonly RootsFilmChapter[],
): number {
  let index = 0;
  for (let i = 0; i < chapters.length; i += 1) {
    if (time >= chapters[i].start) index = i;
  }
  return index;
}
