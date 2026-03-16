import { authenticateToken } from "../middleware/auth.js";
import express from "express";
import * as userProjectController from "../controllers/userProjectController.js";

const router = express.Router();

router.get("/", userProjectController.getAllUserProjects);
router.get("/project/:projectId", userProjectController.getProjectMembers);
router.post("/", authenticateToken, userProjectController.addUserToProject);
router.put(
  "/:userId/:projectId",
  authenticateToken,
  userProjectController.updateUserRole,
);
router.delete(
  "/:userId/:projectId",
  authenticateToken,
  userProjectController.removeUserFromProject,
);
router.get("/user/:userId", userProjectController.getUserProjectsByUserId);
router.get("/userdata/:userId", userProjectController.getUserData);

export default router;
