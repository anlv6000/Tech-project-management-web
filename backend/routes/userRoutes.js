import express from "express";
import * as userController from "../controllers/userController.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authenticateToken, userController.getAllUsers);
router.get("/search", userController.searchUsers);
router.get("/:id", authenticateToken, userController.getUserById);
router.post("/", userController.createUser);
router.post("/auth/login", userController.loginUser);
router.post("/auth/register", userController.registerUser);
router.post("/auth/verify-otp", userController.verifyOtp);
router.post("/auth/resend-otp", userController.resendOtp);
router.put("/:id", authenticateToken, userController.updateUser);
router.delete(
  "/:id",
  authenticateToken,
  requireAdmin,
  userController.deleteUser,
);
router.put("/:id/change-password", authenticateToken, userController.changePassword);
router.put("/:id/reset-password", authenticateToken, requireAdmin, userController.resetPassword);

export default router;