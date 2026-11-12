import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  coupleId: { type: mongoose.Schema.Types.ObjectId, ref: "Couple", required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 140 },
  description: { type: String, trim: true, maxlength: 2000, default: "" },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  dueDate: { type: Date, default: null },
  status: { type: String, enum: ["pending", "in_progress", "completed"], default: "pending" },
  priority: { type: String, enum: ["low", "medium", "high"], default: "medium" }
}, { timestamps: true });

taskSchema.index({ coupleId:  1, dueDate: 1 });
export default mongoose.model("Task", taskSchema);
