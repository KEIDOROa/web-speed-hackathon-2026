import ffmpeg from "fluent-ffmpeg";

const VF_SQUARE_CENTER =
  "crop=min(iw\\,ih):min(iw\\,ih):(iw-min(iw\\,ih))/2:(ih-min(iw\\,ih))/2";

export async function convertVideoToMp4AndPoster(
  inputPath: string,
  outputMp4Path: string,
  posterJpgPath: string,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        "-t",
        "5",
        "-r",
        "10",
        "-vf",
        VF_SQUARE_CENTER,
        "-an",
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
      ])
      .output(outputMp4Path)
      .on("end", () => resolve())
      .on("error", (err) => reject(err));
  });

  await new Promise<void>((resolve, reject) => {
    ffmpeg(outputMp4Path)
      .outputOptions(["-vframes", "1", "-q:v", "2"])
      .output(posterJpgPath)
      .on("end", () => resolve())
      .on("error", (err) => reject(err));
  });
}
