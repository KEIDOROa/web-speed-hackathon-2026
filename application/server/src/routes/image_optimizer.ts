import fs from "node:fs";
import path from "node:path";

import { Router } from "express";
import sharp from "sharp";

import { PUBLIC_PATH, UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

const cache = new Map<string, { buffer: Buffer; contentType: string }>();

const POST_IMAGE_MAX_WIDTH = 800;
const PROFILE_IMAGE_MAX_WIDTH = 128;

const POST_WIDTH_WHITELIST = new Set([280, 360, 480, 640, 800]);
const PROFILE_WIDTH_WHITELIST = new Set([64, 96, 128]);
const MOVIE_WIDTH_WHITELIST = new Set([280, 360, 480]);

function findMediaFile(reqPath: string): string | null {
  const relative = reqPath.replace(/^\//, "");
  const uploadFile = path.join(UPLOAD_PATH, relative);
  if (fs.existsSync(uploadFile)) return uploadFile;

  const publicFile = path.join(PUBLIC_PATH, relative);
  if (fs.existsSync(publicFile)) return publicFile;

  return null;
}

export const imageOptimizerRouter = Router();

imageOptimizerRouter.get("/images/{*path}", async (req, res, next) => {
  try {
    const reqPath = req.path;

    if (!reqPath.endsWith(".jpg")) {
      return next();
    }

    const acceptHeader = req.headers.accept || "";
    const supportsWebp = acceptHeader.includes("image/webp");

    const format = supportsWebp ? "webp" : "jpeg";
    const contentType = supportsWebp ? "image/webp" : "image/jpeg";

    const isProfile = reqPath.includes("/profiles/");
    const wQuery = req.query["w"];
    const wParsed = typeof wQuery === "string" ? Number.parseInt(wQuery, 10) : NaN;

    let maxWidth = isProfile ? PROFILE_IMAGE_MAX_WIDTH : POST_IMAGE_MAX_WIDTH;
    if (isProfile && Number.isFinite(wParsed) && PROFILE_WIDTH_WHITELIST.has(wParsed)) {
      maxWidth = wParsed;
    }
    if (!isProfile && Number.isFinite(wParsed) && POST_WIDTH_WHITELIST.has(wParsed)) {
      maxWidth = wParsed;
    }

    const cacheKey = `${reqPath}:${format}:${maxWidth}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      res.setHeader("Content-Type", cached.contentType);
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      res.setHeader("Vary", "Accept");
      res.send(cached.buffer);
      return;
    }

    const filePath = findMediaFile(reqPath);
    if (filePath == null) {
      return next();
    }

    let pipeline = sharp(filePath).resize({ width: maxWidth, withoutEnlargement: true });

    const compact = maxWidth <= 480;
    if (format === "webp") {
      pipeline = pipeline.webp({ quality: compact ? 64 : 74 });
    } else {
      pipeline = pipeline.jpeg({ quality: compact ? 64 : 74, mozjpeg: true });
    }

    const buffer = await pipeline.toBuffer();

    cache.set(cacheKey, { buffer, contentType });

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("Vary", "Accept");
    res.send(buffer);
  } catch {
    next();
  }
});

imageOptimizerRouter.get("/movies/:movieId/poster", async (req, res, next) => {
  try {
    const movieId = req.params.movieId;
    if (typeof movieId !== "string" || movieId.length === 0) {
      return next();
    }

    const wQuery = req.query["w"];
    const wParsed = typeof wQuery === "string" ? Number.parseInt(wQuery, 10) : NaN;
    let maxWidth = 480;
    if (Number.isFinite(wParsed) && MOVIE_WIDTH_WHITELIST.has(wParsed)) {
      maxWidth = wParsed;
    }

    const acceptHeader = req.headers.accept || "";
    const supportsWebp = acceptHeader.includes("image/webp");
    const format = supportsWebp ? "webp" : "jpeg";
    const contentType = supportsWebp ? "image/webp" : "image/jpeg";

    const relPath = `movies/${movieId}.jpg`;
    const cacheKey = `${relPath}:poster:${maxWidth}:${format}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      res.setHeader("Content-Type", cached.contentType);
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      res.setHeader("Vary", "Accept");
      res.send(cached.buffer);
      return;
    }

    const filePath = findMediaFile(relPath);
    if (filePath == null) {
      return next();
    }

    const compact = maxWidth <= 360;
    const pipeline = sharp(filePath).resize({
      width: maxWidth,
      height: maxWidth,
      fit: "inside",
      withoutEnlargement: true,
    });

    let buffer: Buffer;
    if (supportsWebp) {
      buffer = await pipeline.webp({ quality: compact ? 70 : 78, effort: 4 }).toBuffer();
    } else {
      buffer = await pipeline.jpeg({ quality: compact ? 70 : 78, mozjpeg: true }).toBuffer();
    }

    cache.set(cacheKey, { buffer, contentType });
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("Vary", "Accept");
    res.send(buffer);
  } catch {
    next();
  }
});

imageOptimizerRouter.get("/movies/{*path}", async (req, res, next) => {
  try {
    const reqPath = req.path;

    if (!reqPath.endsWith(".mp4")) {
      return next();
    }

    const filePath = findMediaFile(reqPath);
    if (filePath == null) {
      return next();
    }

    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.sendFile(path.resolve(filePath), (err) => {
      if (err) {
        next(err);
      }
    });
  } catch {
    next();
  }
});
