import fs from "node:fs";
import path from "node:path";

import { Router } from "express";
import sharp from "sharp";

import { PUBLIC_PATH, UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

const cache = new Map<string, { buffer: Buffer; contentType: string }>();

const POST_IMAGE_MAX_WIDTH = 800;
const PROFILE_IMAGE_MAX_WIDTH = 128;

function findImageFile(reqPath: string): string | null {
  const uploadFile = path.join(UPLOAD_PATH, reqPath);
  if (fs.existsSync(uploadFile)) return uploadFile;

  const publicFile = path.join(PUBLIC_PATH, reqPath);
  if (fs.existsSync(publicFile)) return publicFile;

  return null;
}

export const imageOptimizerRouter = Router();

imageOptimizerRouter.get("/images/*", async (req, res, next) => {
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
    const maxWidth = isProfile ? PROFILE_IMAGE_MAX_WIDTH : POST_IMAGE_MAX_WIDTH;

    const cacheKey = `${reqPath}:${format}:${maxWidth}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      res.setHeader("Content-Type", cached.contentType);
      res.setHeader("Cache-Control", "public, max-age=604800");
      res.setHeader("Vary", "Accept");
      res.send(cached.buffer);
      return;
    }

    const filePath = findImageFile(reqPath);
    if (!filePath) {
      return next();
    }

    let pipeline = sharp(filePath).resize({ width: maxWidth, withoutEnlargement: true });

    if (format === "avif") {
      pipeline = pipeline.avif({ quality: 60 });
    } else if (format === "webp") {
      pipeline = pipeline.webp({ quality: 75 });
    } else {
      pipeline = pipeline.jpeg({ quality: 75 });
    }

    const buffer = await pipeline.toBuffer();

    cache.set(cacheKey, { buffer, contentType });

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=604800");
    res.setHeader("Vary", "Accept");
    res.send(buffer);
  } catch {
    next();
  }
});
