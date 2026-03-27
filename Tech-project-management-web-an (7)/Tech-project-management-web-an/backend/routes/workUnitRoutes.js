import { authenticateToken } from "../middleware/auth.js";
import express from "express";
import * as workUnitController from "../controllers/workUnitController.js";
import {
  attachWorkUnitToRequest,
  requireWorkUnitManagePermission,
} from "../middleware/projectPermissions.js";

const router = express.Router();

router.get("/project/:projectId", workUnitController.getProjectWorkUnits);
router.get("/:id", workUnitController.getWorkUnitById);

router.post(
  "/",
  authenticateToken,
  requireWorkUnitManagePermission((req) => req.body.projectId),
  workUnitController.createWorkUnit,
);

router.put(
  "/:id",
  authenticateToken,
  attachWorkUnitToRequest,
  requireWorkUnitManagePermission((req) => req.workUnit.projectId),
  workUnitController.updateWorkUnit,
);

router.delete(
  "/:id",
  authenticateToken,
  attachWorkUnitToRequest,
  requireWorkUnitManagePermission((req) => req.workUnit.projectId),
  workUnitController.deleteWorkUnit,
);

router.post(
  "/sprint",
  authenticateToken,
  requireWorkUnitManagePermission((req) => req.body.projectId),
  workUnitController.createSprint,
);

router.put(
  "/mark-done/:id",
  authenticateToken,
  attachWorkUnitToRequest,
  requireWorkUnitManagePermission((req) => req.workUnit.projectId),
  workUnitController.markPhaseDone,
);

router.post(
  "/sprint/:id/start",
  authenticateToken,
  attachWorkUnitToRequest,
  requireWorkUnitManagePermission((req) => req.workUnit.projectId),
  workUnitController.startSprint,
);

router.post(
  "/sprint/:id/end",
  authenticateToken,
  attachWorkUnitToRequest,
  requireWorkUnitManagePermission((req) => req.workUnit.projectId),
  workUnitController.endSprint,
);

router.get(
  "/sprint/:id/stats",
  authenticateToken,
  workUnitController.getSprintStats,
);

export default router;