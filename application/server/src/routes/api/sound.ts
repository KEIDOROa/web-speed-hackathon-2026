import { mkdir, mkdtemp, readFile, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { convertAudioToMp3 } from "@web-speed-hackathon-2026/server/src/utils/convert_sound";
import { extractMetadataFromSound } from "@web-speed-hackathon-2026/server/src/utils/extract_metadata_from_sound";

const AUDIO_EXTENSIONS = new Set([
  "mp3",
  "wav",
  "flac",
  "ogg",
  "opus",
  "m4a",
  "aac",
  "oga",
  "wma",
]);

const EXTENSION = "mp3";

export const soundRouter = Router();

soundRouter.post("/sounds", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const type = await fileTypeFromBuffer(req.body);
  if (type === undefined || AUDIO_EXTENSIONS.has(type.ext) !== true) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  const { artist, title } = await extractMetadataFromSound(req.body);

  const soundId = uuidv4();
  const soundsDir = path.resolve(UPLOAD_PATH, "sounds");
  await mkdir(soundsDir, { recursive: true });

  const tmpDir = await mkdtemp(path.join(tmpdir(), "sound-upload-"));
  try {
    const inputPath = path.join(tmpDir, `input.${type.ext}`);
    const tmpMp3 = path.join(tmpDir, `out.${EXTENSION}`);
    await writeFile(inputPath, req.body);

    await convertAudioToMp3(inputPath, tmpMp3);

    const mp3Buffer = await readFile(tmpMp3);
    const filePath = path.resolve(soundsDir, `./${soundId}.${EXTENSION}`);
    await writeFile(filePath, mp3Buffer);
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }

  return res.status(200).type("application/json").send({ artist, id: soundId, title });
});
