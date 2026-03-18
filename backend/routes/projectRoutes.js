import { authenticateToken } from "../middleware/auth.js";
import express from "express";
import * as projectController from "../controllers/projectController.js";
import { requireProjectRole } from "../middleware/projectPermissions.js";

const router = express.Router();

router.get("/", projectController.getAllProjects);
router.get("/user/:userId", projectController.getUserProjects);
router.get("/:id", projectController.getProjectById);

router.post("/", authenticateToken, projectController.createProject);

router.post(
  "/:projectId/invite",
  authenticateToken,
  requireProjectRole(["projectAdmin"], (req) => req.params.projectId),
  projectController.inviteUserToProject,
);

router.post("/accept-invitation", projectController.acceptInvitation);

router.put(
  "/:id",
  authenticateToken,
  requireProjectRole(["projectAdmin"], (req) => req.params.id),
  projectController.updateProject,
);

router.delete(
  "/:id",
  authenticateToken,
  requireProjectRole(["projectAdmin"], (req) => req.params.id),
  projectController.deleteProject,
);

router.post(
  "/:id/complete",
  authenticateToken,
  requireProjectRole(["projectAdmin"], (req) => req.params.id),
  projectController.completeProject,
);

export default router;
