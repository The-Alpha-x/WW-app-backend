import mongoose from "mongoose";
import { z } from "zod";
import Task from "../models/Task.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const taskInput = z.object({
  title: z.string().trim().min(1).max(140),
  description: z.string().max(2000).optional(),
  assignedTo: z.string().regex(/^[a-f\d]{24}$/i).nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  priority: z.enum(["low", "medium", "high"]).optional()
});

export const listTasks = asyncHandler(async (req, res) => {
  const tasks = await Task.find({ coupleId: req.coupleId }).sort({ dueDate: 1, createdAt: -1 });
  res.json({ tasks });
});

export const createTask = asyncHandler(async (req, res) => {
  const parsed = taskInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid task", errors: parsed.error.flatten() });

  if (parsed.data.assignedTo) {
    const Couple = (await import("../models/Couple.js")).default;
    const couple = await Couple.findById(req.coupleId);
    if (!couple?.memberIds.some(id => id.equals(parsed.data.assignedTo))) {
      return res.status(400).json({ message: "Assigned user must belong to your couple" });
    }
  }

  const task = await Task.create({
    ...parsed.data,
    dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
    coupleId: req.coupleId,
    createdBy: req.user._id
  });
  res.status(201).json({ task });
});

export const updateTask = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.taskId)) return res.status(400).json({ message: "Invalid task ID" });
  const parsed = taskInput.partial().extend({
    status: z.enum(["pending", "in_progress", "completed"]).optional()
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid task update", errors: parsed.error.flatten() });

  const updates = { ...parsed.data };
  if (typeof updates.dueDate === "string") updates.dueDate = new Date(updates.dueDate);
  if (updates.assignedTo) {
    const Couple = (await import("../models/Couple.js")).default;
    const couple = await Couple.findById(req.coupleId);
    if (!couple?.memberIds.some(id => id.equals(updates.assignedTo))) {
      return res.status(400).json({ message: "Assigned user must belong to your couple" });
    }
  }
  const task = await Task.findOneAndUpdate(
    { _id: req.params.taskId, coupleId: req.coupleId },
    { $set: updates },
    { new: true, runValidators: true }
  );
  if (!task) return res.status(404).json({ message: "Task not found" });
  res.json({ task });
});

export const deleteTask = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.taskId)) return res.status(400).json({ message: "Invalid task ID" });
  const task = await Task.findOneAndDelete({ _id: req.params.taskId, coupleId: req.coupleId });
  if (!task) return res.status(404).json({ message: "Task not found" });
  res.status(204).end();
});
