import { Router } from "express";
import { createCouple, createInvitation, getMyCouple, joinCouple } from "../controllers/coupleController.js";
import { requireAuth, requireCouple } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);
router.post("/", createCouple);
router.post("/join", joinCouple);
router.post("/invitation", requireCouple, createInvitation);
router.get("/me", requireCouple, getMyCouple);
export default router;
