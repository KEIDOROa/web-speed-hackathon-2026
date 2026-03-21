import { mkdir, mkdtemp, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { convertVideoToMp4AndPoster } from "@web-speed-hackathon-2026/server/src/utils/convert_movie";

const VIDEO_EXTENSIONS = new Set([
  "mp4",
  "webm",
  "mkv",
  "mov",
  "avi",
  "m4v",
  "flv",
  "wmv",
  "3gp",
]);

const EXTENSION_MP4 = "mp4";
const POSTER_SUFFIX = ".jpg";

export const movieRouter = Router();

movieRouter.post("/movies", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const type = await fileTypeFromBuffer(req.body);
  if (type === undefined || VIDEO_EXTENSIONS.has(type.ext) !== true) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  const movieId = uuidv4();
  const moviesDir = path.resolve(UPLOAD_PATH, "movies");
  await mkdir(moviesDir, { recursive: true });

  const tmpDir = await mkdtemp(path.join(tmpdir(), "movie-upload-"));
  try {
    const inputPath = path.join(tmpDir, `input.${type.ext}`);
    await writeFile(inputPath, req.body);

    const outMp4 = path.join(moviesDir, `${movieId}.${EXTENSION_MP4}`);
    const outPoster = path.join(moviesDir, `${movieId}${POSTER_SUFFIX}`);

    await convertVideoToMp4AndPoster(inputPath, outMp4, outPoster);
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }

  return res.status(200).type("application/json").send({ id: movieId });
});
