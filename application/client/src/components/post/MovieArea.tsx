import { PausableMovie } from "@web-speed-hackathon-2026/client/src/components/foundation/PausableMovie";
import { buildMovieResponsive } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  movie: Models.Movie;
  priority?: boolean;
}

export const MovieArea = ({ movie, priority = false }: Props) => {
  const { src, srcSet, sizes } = buildMovieResponsive(movie.id, { feed: !priority });

  return (
    <div
      className="border-cax-border bg-cax-surface-subtle relative h-full w-full overflow-hidden rounded-lg border"
      data-movie-area
    >
      <PausableMovie priority={priority} sizes={sizes} src={src} srcSet={srcSet} />
    </div>
  );
};
