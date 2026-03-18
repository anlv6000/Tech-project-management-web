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

export default router;
