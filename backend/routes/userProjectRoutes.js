import { authenticateToken } from "../middleware/auth.js";
import express from "express";
import * as userProjectController from "../controllers/userProjectController.js";
import { requireProjectRole } from "../middleware/projectPermissions.js";

const router = express.Router();

router.get("/", userProjectController.getAllUserProjects);
router.get("/project/:projectId", userProjectController.getProjectMembers);
router.get("/user/:userId", userProjectController.getUserProjectsByUserId);
router.get("/userdata/:userId", userProjectController.getUserData);

router.post(
  "/",
  authenticateToken,
  requireProjectRole(["projectAdmin"], (req) => req.body.projectId),
  userProjectController.addUserToProject,
);

router.put(
  "/:userId/:projectId",
  authenticateToken,
  requireProjectRole(["projectAdmin"], (req) => req.params.projectId),
  userProjectController.updateUserRole,
);

router.delete(
  "/:userId/:projectId",
  authenticateToken,
  requireProjectRole(["projectAdmin"], (req) => req.params.projectId),
  userProjectController.removeUserFromProject,
);

export default router;
