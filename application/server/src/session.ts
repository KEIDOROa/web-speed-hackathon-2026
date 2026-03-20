import session, { MemoryStore } from "express-session";

const isProd = process.env["NODE_ENV"] === "production";

const sessionMaxAgeMs = 60 * 60 * 24 * 365 * 1000;

export const sessionStore = new MemoryStore();

export const sessionMiddleware = session({
  store: sessionStore,
  proxy: true,
  resave: false,
  saveUninitialized: false,
  secret: "secret",
  cookie: {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    maxAge: sessionMaxAgeMs,
  },
  rolling: true,
});
