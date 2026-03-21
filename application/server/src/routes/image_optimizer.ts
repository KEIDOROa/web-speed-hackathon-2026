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
  const uploadFile = path.join(UPLOAD_PATH, reqPath);
  if (fs.existsSync(uploadFile)) return uploadFile;

  const publicFile = path.join(PUBLIC_PATH, reqPath);
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

    const relPath = `movies/${movieId}.gif`;
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
    const pipeline = sharp(filePath, { animated: false, limitInputPixels: false }).resize({
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

async function transcodeMovie(
  filePath: string,
  maxWidth: number,
  acceptHeader: string,
): Promise<{ buffer: Buffer; contentType: string; cacheVariant: "webp" | "gif" }> {
  const basePipeline = () =>
    sharp(filePath, { animated: true, limitInputPixels: false }).resize({
      width: maxWidth,
      height: maxWidth,
      fit: "inside",
      withoutEnlargement: true,
    });

  const compact = maxWidth <= 360;
  const preferWebp = acceptHeader.includes("image/webp");

  if (preferWebp) {
    try {
      const buffer = await basePipeline()
        .webp({ quality: compact ? 44 : 50, effort: 4 })
        .toBuffer();
      return { buffer, contentType: "image/webp", cacheVariant: "webp" };
    } catch {
      /* アニメ WebP 化に失敗した場合は GIF にフォールバック */
    }
  }

  const buffer = await basePipeline().gif({ effort: 4, colours: 128 }).toBuffer();
  return { buffer, contentType: "image/gif", cacheVariant: "gif" };
}

imageOptimizerRouter.get("/movies/{*path}", async (req, res, next) => {
  try {
    const reqPath = req.path;

    if (!reqPath.endsWith(".gif")) {
      return next();
    }

    const wQuery = req.query["w"];
    const wParsed = typeof wQuery === "string" ? Number.parseInt(wQuery, 10) : NaN;
    let maxWidth = 480;
    if (Number.isFinite(wParsed) && MOVIE_WIDTH_WHITELIST.has(wParsed)) {
      maxWidth = wParsed;
    }

    const acceptHeader = req.headers.accept || "";
    const preferWebp = acceptHeader.includes("image/webp");

    const filePath = findMediaFile(reqPath);
    if (filePath == null) {
      return next();
    }

    const sendCached = (entry: { buffer: Buffer; contentType: string }) => {
      res.setHeader("Content-Type", entry.contentType);
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      res.setHeader("Vary", "Accept");
      res.send(entry.buffer);
    };

    const desiredVariant: "webp" | "gif" = preferWebp ? "webp" : "gif";
    const desiredKey = `${reqPath}:movie:${desiredVariant}:${maxWidth}`;
    const desiredHit = cache.get(desiredKey);
    if (desiredHit) {
      sendCached(desiredHit);
      return;
    }

    const { buffer, contentType, cacheVariant } = await transcodeMovie(
      filePath,
      maxWidth,
      acceptHeader,
    );

    const storeKey = `${reqPath}:movie:${cacheVariant}:${maxWidth}`;
    cache.set(storeKey, { buffer, contentType });

    sendCached({ buffer, contentType });
  } catch {
    next();
  }
});
