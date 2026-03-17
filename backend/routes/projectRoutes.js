import { authenticateToken } from "../middleware/auth.js";
import express from "express";
import * as projectController from "../controllers/projectController.js";

const router = express.Router();

router.get("/", projectController.getAllProjects);
router.get("/:id", projectController.getProjectById);
router.get("/user/:userId", projectController.getUserProjects);
router.post("/", authenticateToken, projectController.createProject);
router.post(
  "/:projectId/invite",
  authenticateToken,
  projectController.inviteUserToProject,
);
router.post("/accept-invitation", projectController.acceptInvitation);
router.put("/:id", authenticateToken, projectController.updateProject);
router.delete("/:id", authenticateToken, projectController.deleteProject);
router.post(
  "/:id/complete",
  authenticateToken,
  projectController.completeProject,
);

export default router;
