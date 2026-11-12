import { Router } from "express";
import { createTask, deleteTask, listTasks, updateTask } from "../controllers/taskController.js";
import { requireAuth, requireCouple } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireCouple);
router.get("/", listTasks);
router.post("/", createTask);
router.patch("/:taskId", updateTask);
router.delete("/:taskId", deleteTask);
export default router;
