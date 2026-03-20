export const POST_IMAGE_SRCSET_WIDTHS = [360, 480, 640, 800] as const;

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

export function getSoundPath(soundId: string): string {
  return `/sounds/${soundId}.mp3`;
}
