import ffmpeg from "fluent-ffmpeg";

export async function convertAudioToMp3(inputPath: string, outputPath: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions(["-vn", "-codec:a", "libmp3lame", "-q:a", "4"])
      .output(outputPath)
      .on("end", () => resolve())
      .on("error", (err) => reject(err));
  });
}
