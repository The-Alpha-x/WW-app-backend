import { z } from "zod";
import { getCoupleModel } from "../models/Couple.js";
import { getUserModel } from "../models/User.js";
import { getDatabaseConnection } from "../config/requestContext.js";
import { env } from "../config/env.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { randomCode, sha256 } from "../utils/tokens.js";

export const createCouple = asyncHandler(async (req, res) => {
  const Couple = getCoupleModel();
  const User = getUserModel();
  const parsed = z.object({ name: z.string().trim().min(1).max(80).optional() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid couple name" });
  if (req.user.coupleId) return res.status(409).json({ message: "You already belong to a couple" });

  const session = await getDatabaseConnection().startSession();
  let couple;
  try {
    await session.withTransaction(async () => {
      couple = await Couple.create([{
        name: parsed.data.name || "Our Little World",
        memberIds: [req.user._id]
      }], { session });
      await User.updateOne(
        { _id: req.user._id, coupleId: null },
        { $set: { coupleId: couple[0]._id } },
        { session }
      );
    });
  } finally {
    await session.endSession();
  }

  res.status(201).json({ couple: { id: couple[0]._id, name: couple[0].name, memberIds: couple[0].memberIds } });
});

export const createInvitation = asyncHandler(async (req, res) => {
  const Couple = getCoupleModel();
  const couple = await Couple.findById(req.coupleId).select("+invitationHash");
  if (!couple) return res.status(404).json({ message: "Couple not found" });
  if (couple.memberIds.length >= 2) return res.status(409).json({ message: "Your couple already has two members" });

  const code = randomCode();
  couple.invitationHash = sha256(code);
  couple.invitationExpiresAt = new Date(Date.now() + env.INVITATION_TTL_HOURS * 3600000);
  await couple.save();

  res.status(201).json({
    invitationCode: code,
    expiresAt: couple.invitationExpiresAt,
    message: "Share this code privately. It can only be used once."
  });
});

export const joinCouple = asyncHandler(async (req, res) => {
  const Couple = getCoupleModel();
  const User = getUserModel();
  const parsed = z.object({ invitationCode: z.string().min(20).max(100) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "A valid invitation code is required" });
  if (req.user.coupleId) return res.status(409).json({ message: "You already belong to a couple" });

  const hash = sha256(parsed.data.invitationCode);
  const session = await getDatabaseConnection().startSession();
  let joinedCouple;
  try {
    await session.withTransaction(async () => {
      joinedCouple = await Couple.findOneAndUpdate(
        {
          invitationHash: hash,
          invitationExpiresAt: { $gt: new Date() },
          $expr: { $lt: [{ $size: "$memberIds" }, 2] }
        },
        {
          $addToSet: { memberIds: req.user._id },
          $unset: { invitationHash: "", invitationExpiresAt: "" }
        },
        { new: true, session }
      );

      if (!joinedCouple) {
        const err = new Error("Invitation is invalid, expired, or already used");
        err.status = 400;
        throw err;
      }

      const update = await User.updateOne(
        { _id: req.user._id, coupleId: null },
        { $set: { coupleId: joinedCouple._id } },
        { session }
      );
      if (update.modifiedCount !== 1) {
        const err = new Error("Your account is already linked to a couple");
        err.status = 409;
        throw err;
      }
    });
  } finally {
    await session.endSession();
  }

  res.json({ couple: { id: joinedCouple._id, name: joinedCouple.name, memberIds: joinedCouple.memberIds } });
});

export const getMyCouple = asyncHandler(async (req, res) => {
  const Couple = getCoupleModel();
  const couple = await Couple.findById(req.coupleId).populate("memberIds", "displayName email");
  if (!couple) return res.status(404).json({ message: "Couple not found" });
  res.json({ couple: { id: couple._id, name: couple.name, members: couple.memberIds, createdAt: couple.createdAt } });
});
