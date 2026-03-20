import { Router } from "express";
import httpErrors from "http-errors";
import { UniqueConstraintError, ValidationError } from "sequelize";

import { clearAuthHintCookie, setAuthHintCookie } from "@web-speed-hackathon-2026/server/src/auth_hint_cookie";
import { User } from "@web-speed-hackathon-2026/server/src/models";

export const authRouter = Router();

authRouter.post("/signup", async (req, res) => {
  try {
    const { id: userId } = await User.create(req.body);
    const user = await User.findByPk(userId);

    req.session.userId = userId;
    setAuthHintCookie(res);
    return res.status(200).type("application/json").send(user);
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      return res.status(400).type("application/json").send({ code: "USERNAME_TAKEN" });
    }
    if (err instanceof ValidationError) {
      return res.status(400).type("application/json").send({ code: "INVALID_USERNAME" });
    }
    throw err;
  }
});

authRouter.post("/signin", async (req, res) => {
  const user = await User.findOne({
    where: {
      username: req.body.username,
    },
  });

  if (user === null) {
    throw new httpErrors.BadRequest();
  }
  if (!user.validPassword(req.body.password)) {
    throw new httpErrors.BadRequest();
  }

  req.session.userId = user.id;
  setAuthHintCookie(res);
  return res.status(200).type("application/json").send(user);
});

authRouter.post("/signout", async (req, res) => {
  req.session.userId = undefined;
  clearAuthHintCookie(res);
  return res.status(200).type("application/json").send({});
});
