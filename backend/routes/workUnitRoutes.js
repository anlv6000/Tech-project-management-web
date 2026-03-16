import { authenticateToken } from "../middleware/auth.js";
import express from "express";
import * as workUnitController from "../controllers/workUnitController.js";

const router = express.Router();

router.get("/project/:projectId", workUnitController.getProjectWorkUnits);
router.get("/:id", workUnitController.getWorkUnitById);
router.post("/", authenticateToken, workUnitController.createWorkUnit);
router.put("/:id", authenticateToken, workUnitController.updateWorkUnit);
router.delete("/:id", authenticateToken, workUnitController.deleteWorkUnit);
router.post("/sprint", authenticateToken, workUnitController.createSprint);

export default router;
