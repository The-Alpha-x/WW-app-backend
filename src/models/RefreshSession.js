import mongoose from "mongoose";
import { getModel } from "../config/requestContext.js";

const refreshSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  tokenId: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } }
}, { timestamps: true });

export const getRefreshSessionModel = () => getModel("RefreshSession", refreshSessionSchema);
