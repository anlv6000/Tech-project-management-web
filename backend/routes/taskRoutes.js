import { authenticateToken } from "../middleware/auth.js";
import express from "express";
import * as taskController from "../controllers/taskController.js";
import {
  attachTaskToRequest,
  requireTaskCreatePermission,
  requireTaskUpdatePermission,
  requireTaskDeletePermission,
} from "../middleware/projectPermissions.js";

const router = express.Router();
router.get("/", taskController.getAllTasks);
router.get("/project/:projectId", taskController.getTasksByProject);
router.get("/workunit/:workUnitId", taskController.getTasksByWorkUnit);
router.get("/user/:userId", taskController.getTasksByUserId);
router.get("/:taskId/subtasks", taskController.getSubTasks);


router.post(
  '/:taskId/related',
  authenticateToken,
  attachTaskToRequest,
  requireTaskUpdatePermission,
  taskController.addRelatedTask
);

router.delete(
  '/:taskId/related/:relatedTaskId',
  authenticateToken,
  attachTaskToRequest,
  requireTaskUpdatePermission,
  taskController.removeRelatedTask
);
router.get("/:id", taskController.getTaskById);

router.post(
  "/",
  authenticateToken,
  requireTaskCreatePermission,
  taskController.createTask,
);

router.put(
  "/:id",
  authenticateToken,
  attachTaskToRequest,
  requireTaskUpdatePermission,
  taskController.updateTask,
);

router.delete(
  "/:id",
  authenticateToken,
  attachTaskToRequest,
  requireTaskDeletePermission,
  taskController.deleteTask,
);

export default router;