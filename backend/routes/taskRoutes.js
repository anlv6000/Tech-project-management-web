import express from "express";
import * as taskController from "../controllers/taskController.js";

const router = express.Router();
router.get("/", taskController.getAllTasks);
router.get("/project/:projectId", taskController.getTasksByProject);
router.get("/workunit/:workUnitId", taskController.getTasksByWorkUnit);
router.get("/:id", taskController.getTaskById);
router.post("/", taskController.createTask);
router.put("/:id", taskController.updateTask);
router.delete("/:id", taskController.deleteTask);

export default router;
