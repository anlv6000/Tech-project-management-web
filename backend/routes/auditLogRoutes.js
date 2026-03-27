import express from "express";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";
import {
  getAllAuditLogs,
  getAuditLogsByAction,
  getAuditLogsByEntity,
  createAuditLog,
  deleteAuditLog,
  getRecentAuditLogs,
  deleteAuditLogsByDate,
} from "../controllers/auditLogController.js";

const router = express.Router();

// Get all audit logs
router.get("/", authenticateToken, requireAdmin, getAllAuditLogs);
router.get("/recent", authenticateToken, requireAdmin, getRecentAuditLogs);
// Get audit logs by action
router.get(
  "/action/:action",
  authenticateToken,
  requireAdmin,
  getAuditLogsByAction,
);

// Get audit logs by entity
router.get(
  "/entity/:entity",
  authenticateToken,
  requireAdmin,
  getAuditLogsByEntity,
);
router.get(
  "/entity/:entity/:entityId",
  authenticateToken,
  requireAdmin,
  getAuditLogsByEntity,
);

// Create audit log
router.post("/", authenticateToken, createAuditLog);

// Delete audit log
router.delete("/:id", authenticateToken, requireAdmin, deleteAuditLog);
router.delete("/", authenticateToken, requireAdmin, deleteAuditLogsByDate);

export default router;
