export const POST_IMAGE_SRCSET_WIDTHS = [280, 360, 480, 640, 800] as const;

export const MOVIE_SRCSET_WIDTHS = [280, 360, 480] as const;

export const MOVIE_IMAGE_SIZES = "(max-width: 640px) min(100vw - 5rem, 480px), 480px";

export function getImagePath(imageId: string): string {
  return `/images/${imageId}.jpg`;
}

const FEED_POST_IMAGE_WIDTHS = [280, 360, 480] as const;

export function buildPostImageResponsive(
  imageId: string,
  options?: { feed?: boolean },
): { src: string; srcSet: string } {
  const base = `/images/${imageId}.jpg`;
  if (options?.feed) {
    const srcSet = FEED_POST_IMAGE_WIDTHS.map((w) => `${base}?w=${w} ${w}w`).join(", ");
    return { src: `${base}?w=280`, srcSet };
  }
  const srcSet = POST_IMAGE_SRCSET_WIDTHS.map((w) => `${base}?w=${w} ${w}w`).join(", ");
  return { src: `${base}?w=480`, srcSet };
}

export type ProfileImageMaxWidth = 64 | 96 | 128;

export function getProfileImagePath(
  profileImageId: string,
  maxWidth: ProfileImageMaxWidth = 128,
): string {
  return `/images/profiles/${profileImageId}.jpg?w=${maxWidth}`;
}

export function getMoviePath(movieId: string): string {
  return `/movies/${movieId}.gif`;
}

export function buildMovieResponsive(
  movieId: string,
  options?: { feed?: boolean },
): {
  src: string;
  srcSet: string;
  sizes: string;
} {
  const base = getMoviePath(movieId);
  const srcSet = MOVIE_SRCSET_WIDTHS.map((w) => `${base}?w=${w} ${w}w`).join(", ");
  const defaultW = options?.feed ? 280 : 360;
  return { src: `${base}?w=${defaultW}`, srcSet, sizes: MOVIE_IMAGE_SIZES };
}

export function getSoundPath(soundId: string): string {
  return `/sounds/${soundId}.mp3`;
}
