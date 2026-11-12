import mongoose from "mongoose";
import { getModel } from "../config/requestContext.js";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  passwordHash: { type: String, required: true, select: false },
  displayName: { type: String, required: true, trim: true, maxlength: 60 },
  coupleId: { type: mongoose.Schema.Types.ObjectId, ref: "Couple", default: null, index: true }
}, { timestamps: true });

export const getUserModel = () => getModel("User", userSchema);
