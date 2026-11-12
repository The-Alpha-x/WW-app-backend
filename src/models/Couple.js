import mongoose from "mongoose";

const coupleSchema = new mongoose.Schema({
  name: { type: String, trim: true, maxlength: 80, default: "Our Little World" },
  memberIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  invitationHash: { type: String, default: null, select: false },
  invitationExpiresAt: { type: Date, default: null }
}, { timestamps: true });

coupleSchema.index({ memberIds: 1 });
export default mongoose.model("Couple", coupleSchema);
