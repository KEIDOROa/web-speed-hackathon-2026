import { Router } from "express";
import httpErrors from "http-errors";

import { Comment, Post } from "@web-speed-hackathon-2026/server/src/models";

export const postRouter = Router();

// APIレスポンスキャッシュ（posts一覧用）
const postsCache = new Map<string, { data: string; timestamp: number }>();
const POSTS_CACHE_TTL = 30_000; // 30秒

export function clearPostsCache() {
  postsCache.clear();
}

postRouter.get("/posts", async (req, res) => {
  const limit = req.query["limit"] != null ? Number(req.query["limit"]) : undefined;
  const offset = req.query["offset"] != null ? Number(req.query["offset"]) : undefined;
  const cacheKey = `${limit}:${offset}`;

  const cached = postsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < POSTS_CACHE_TTL) {
    return res.status(200).type("application/json").send(cached.data);
  }

  const posts = await Post.unscoped().findAll({
    limit,
    offset,
    attributes: {
      exclude: ["userId", "movieId", "soundId"],
    },
    include: [
      {
        association: "user",
        attributes: { exclude: ["profileImageId"] },
        include: [{ association: "profileImage" }],
      },
      {
        association: "images",
        order: [["createdAt", "ASC"]],
        separate: true,
        through: { attributes: [] },
      },
      { association: "movie" },
      { association: "sound" },
    ],
    order: [["id", "DESC"]],
  });
  const json = JSON.stringify(posts);

  postsCache.set(cacheKey, { data: json, timestamp: Date.now() });

  return res.status(200).type("application/json").send(json);
});

postRouter.get("/posts/:postId", async (req, res) => {
  const post = await Post.findByPk(req.params.postId);

  if (post === null) {
    throw new httpErrors.NotFound();
  }

  return res.status(200).type("application/json").send(post);
});

postRouter.get("/posts/:postId/comments", async (req, res) => {
  const posts = await Comment.findAll({
    limit: req.query["limit"] != null ? Number(req.query["limit"]) : undefined,
    offset: req.query["offset"] != null ? Number(req.query["offset"]) : undefined,
    where: {
      postId: req.params.postId,
    },
  });

  return res.status(200).type("application/json").send(posts);
});

postRouter.post("/posts", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const post = await Post.create(
    {
      ...req.body,
      userId: req.session.userId,
    },
    {
      include: [
        {
          association: "images",
          through: { attributes: [] },
        },
        { association: "movie" },
        { association: "sound" },
      ],
    },
  );

  // 新しい投稿が作成されたのでキャッシュをクリア
  postsCache.clear();

  return res.status(200).type("application/json").send(post);
});
