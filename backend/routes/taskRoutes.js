import { authenticateToken } from "../middleware/auth.js";
import express from "express";
import * as taskController from "../controllers/taskController.js";

const router = express.Router();
router.get("/", taskController.getAllTasks);
router.get("/project/:projectId", taskController.getTasksByProject);
router.get("/workunit/:workUnitId", taskController.getTasksByWorkUnit);
router.get("/user/:userId", taskController.getTasksByUserId);
router.get("/:taskId/subtasks", taskController.getSubTasks);
router.get("/:id", taskController.getTaskById);
router.post("/", authenticateToken, taskController.createTask);
router.put("/:id", authenticateToken, taskController.updateTask);
router.delete("/:id", authenticateToken, taskController.deleteTask);

export default router;
