import { getUserModel } from "../models/User.js";
import { verifyAccessToken } from "../utils/tokens.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const requireAuth = asyncHandler(async (req, res, next) => {
  const User = getUserModel();
  const token = req.cookies.ww_access;
  if (!token) return res.status(401).json({ message: "Authentication required" });

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    return res.status(401).json({ message: "Invalid or expired access token" });
  }

  if (payload.typ !== "access") return res.status(401).json({ message: "Invalid access token" });

  const user = await User.findById(payload.sub).select("_id email displayName coupleId");
  if (!user) return res.status(401).json({ message: "Account not found" });

  req.user = user;
  next();
});

export const requireCouple = asyncHandler(async (req, res, next) => {
  if (!req.user.coupleId) {
    return res.status(403).json({ message: "You have not joined a couple yet" });
  }
  req.coupleId = req.user.coupleId;
  next();
});
