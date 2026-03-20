import type { Response } from "express";

const AUTH_HINT_COOKIE = "cax_authed";

const isProd = process.env["NODE_ENV"] === "production";

const cookieBase = {
  path: "/",
  sameSite: "lax" as const,
  secure: isProd,
};

export function setAuthHintCookie(res: Response): void {
  res.cookie(AUTH_HINT_COOKIE, "1", {
    ...cookieBase,
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 365,
  });
}

export function clearAuthHintCookie(res: Response): void {
  res.clearCookie(AUTH_HINT_COOKIE, cookieBase);
}
