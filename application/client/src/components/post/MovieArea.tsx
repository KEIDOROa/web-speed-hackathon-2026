import { PausableMovie } from "@web-speed-hackathon-2026/client/src/components/foundation/PausableMovie";
import { buildMovieResponsive } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  movie: Models.Movie;
  priority?: boolean;
  feedVariant?: boolean;
}

export const MovieArea = ({ movie, priority = false, feedVariant = true }: Props) => {
  const { src, srcSet, sizes, posterSrc } = buildMovieResponsive(movie.id, {
    feed: feedVariant ? true : !priority,
  });

  return (
    <div
      className="border-cax-border bg-cax-surface-subtle relative h-full w-full overflow-hidden rounded-lg border"
      data-movie-area
    >
      <PausableMovie posterSrc={posterSrc} priority={priority} sizes={sizes} src={src} srcSet={srcSet} />
    </div>
  );
};
