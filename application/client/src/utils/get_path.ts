export const POST_IMAGE_SRCSET_WIDTHS = [280, 360, 480, 640, 800] as const;

export const MOVIE_SRCSET_WIDTHS = [280, 360, 480, 640] as const;

export const MOVIE_IMAGE_SIZES = "(max-width: 640px) min(100vw - 5rem, 560px), 560px";

export function getImagePath(imageId: string): string {
  return `/images/${imageId}.jpg`;
}

export function buildPostImageResponsive(imageId: string): { src: string; srcSet: string } {
  const base = `/images/${imageId}.jpg`;
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

export function buildMovieResponsive(movieId: string): {
  src: string;
  srcSet: string;
  sizes: string;
} {
  const base = getMoviePath(movieId);
  const srcSet = MOVIE_SRCSET_WIDTHS.map((w) => `${base}?w=${w} ${w}w`).join(", ");
  return { src: `${base}?w=480`, srcSet, sizes: MOVIE_IMAGE_SIZES };
}

export function getSoundPath(soundId: string): string {
  return `/sounds/${soundId}.mp3`;
}
