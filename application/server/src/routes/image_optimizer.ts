import fs from "node:fs";
import path from "node:path";

import { Router } from "express";
import sharp from "sharp";

import { PUBLIC_PATH, UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

const cache = new Map<string, { buffer: Buffer; contentType: string }>();

const POST_IMAGE_MAX_WIDTH = 800;
const PROFILE_IMAGE_MAX_WIDTH = 128;

const POST_WIDTH_WHITELIST = new Set([360, 480, 640, 800]);
const PROFILE_WIDTH_WHITELIST = new Set([64, 96, 128]);

function findImageFile(reqPath: string): string | null {
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

    // Only handle .jpg files
    if (!reqPath.endsWith(".jpg")) {
      return next();
    }

    const acceptHeader = req.headers.accept || "";
    const supportsAvif = acceptHeader.includes("image/avif");
    const supportsWebp = acceptHeader.includes("image/webp");

    const format = supportsAvif ? "avif" : supportsWebp ? "webp" : "jpeg";
    const contentType = supportsAvif ? "image/avif" : supportsWebp ? "image/webp" : "image/jpeg";

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

    const filePath = findImageFile(reqPath);
    if (!filePath) {
      return next();
    }

    let pipeline = sharp(filePath).resize({ width: maxWidth, withoutEnlargement: true });

    const compact = maxWidth <= 480;
    if (format === "avif") {
      pipeline = pipeline.avif({ quality: compact ? 52 : 58 });
    } else if (format === "webp") {
      pipeline = pipeline.webp({ quality: compact ? 68 : 74 });
    } else {
      pipeline = pipeline.jpeg({ quality: compact ? 68 : 74, mozjpeg: true });
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
