import { Router } from "express";
import httpErrors from "http-errors";

export const translateRouter = Router();

translateRouter.post("/translate", async (req, res) => {
  const { text, sourceLanguage, targetLanguage } = req.body as {
    text?: string;
    sourceLanguage?: string;
    targetLanguage?: string;
  };

  if (!text || !sourceLanguage || !targetLanguage) {
    throw new httpErrors.BadRequest("text, sourceLanguage, targetLanguage are required");
  }

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(sourceLanguage)}&tl=${encodeURIComponent(targetLanguage)}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Translation API returned ${response.status}`);
    }

    const data = (await response.json()) as [[[string, string, ...unknown[]], ...unknown[]], ...unknown[]];
    const translated = (data[0] as [string, string][]).map((segment) => segment[0]).join("");

    res.json({ result: translated });
  } catch {
    throw new httpErrors.InternalServerError("Translation failed");
  }
});
