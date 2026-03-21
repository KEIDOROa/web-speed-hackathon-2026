import { Router } from "express";
import { Op } from "sequelize";

import { Post } from "@web-speed-hackathon-2026/server/src/models";
import { parseSearchQuery } from "@web-speed-hackathon-2026/server/src/utils/parse_search_query.js";

export const searchRouter = Router();

const searchCache = new Map<string, { data: string; timestamp: number }>();
const SEARCH_CACHE_TTL = 20_000;

searchRouter.get("/search", async (req, res) => {
  const query = req.query["q"];
  const limit = req.query["limit"] != null ? Number(req.query["limit"]) : undefined;
  const offset = req.query["offset"] != null ? Number(req.query["offset"]) : undefined;
  const cacheKey = JSON.stringify({
    q: typeof query === "string" ? query : "",
    limit,
    offset,
  });

  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < SEARCH_CACHE_TTL) {
    res.setHeader("Cache-Control", "private, no-store");
    return res.status(200).type("application/json").send(cached.data);
  }

  if (typeof query !== "string" || query.trim() === "") {
    const json = JSON.stringify([]);
    searchCache.set(cacheKey, { data: json, timestamp: Date.now() });
    res.setHeader("Cache-Control", "private, no-store");
    return res.status(200).type("application/json").send(json);
  }

  const { keywords, sinceDate, untilDate } = parseSearchQuery(query);

  if (!keywords && !sinceDate && !untilDate) {
    const json = JSON.stringify([]);
    searchCache.set(cacheKey, { data: json, timestamp: Date.now() });
    res.setHeader("Cache-Control", "private, no-store");
    return res.status(200).type("application/json").send(json);
  }

  const searchTerm = keywords ? `%${keywords}%` : null;

  const dateConditions: Record<symbol, Date>[] = [];
  if (sinceDate) {
    dateConditions.push({ [Op.gte]: sinceDate });
  }
  if (untilDate) {
    dateConditions.push({ [Op.lte]: untilDate });
  }
  const dateWhere =
    dateConditions.length > 0 ? { createdAt: Object.assign({}, ...dateConditions) } : {};

  const textWhere = searchTerm ? { text: { [Op.like]: searchTerm } } : {};

  const postsByText = await Post.findAll({
    where: {
      ...textWhere,
      ...dateWhere,
    },
  });

  let postsByUser: typeof postsByText = [];
  if (searchTerm) {
    postsByUser = await Post.findAll({
      include: [
        {
          association: "user",
          attributes: { exclude: ["profileImageId"] },
          include: [{ association: "profileImage" }],
          required: true,
          where: {
            [Op.or]: [{ username: { [Op.like]: searchTerm } }, { name: { [Op.like]: searchTerm } }],
          },
        },
        {
          association: "images",
          through: { attributes: [] },
        },
        { association: "movie" },
        { association: "sound" },
      ],
      where: dateWhere,
    });
  }

  const postIdSet = new Set<string>();
  const mergedPosts: typeof postsByText = [];

  for (const post of [...postsByText, ...postsByUser]) {
    if (!postIdSet.has(post.id)) {
      postIdSet.add(post.id);
      mergedPosts.push(post);
    }
  }

  mergedPosts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const result = mergedPosts.slice(offset || 0, (offset || 0) + (limit || mergedPosts.length));

  const json = JSON.stringify(result);
  searchCache.set(cacheKey, { data: json, timestamp: Date.now() });
  res.setHeader("Cache-Control", "private, no-store");
  return res.status(200).type("application/json").send(json);
});
