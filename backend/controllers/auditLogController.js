import AuditLog from "../models/AuditLog.js";
import {
  createAuditLogFromRequest,
  getClientIp,
} from "../utils/auditLogger.js";

export const getAllAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate("userId", "fullName email")
      .sort({ createdAt: -1 })
      .limit(1000);

    res.json(logs);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching audit logs", error: error.message });
  }
};

export const getAuditLogsByAction = async (req, res) => {
  try {
    const { action } = req.params;
    const logs = await AuditLog.find({ action })
      .populate("userId", "fullName email")
      .sort({ createdAt: -1 });

    res.json(logs);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching audit logs", error: error.message });
  }
};

export const getAuditLogsByEntity = async (req, res) => {
  try {
    const { entity, entityId } = req.params;
    const query = { entity };
    if (entityId) query.entityId = entityId;

    const logs = await AuditLog.find(query)
      .populate("userId", "fullName email")
      .sort({ createdAt: -1 });

    res.json(logs);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching audit logs", error: error.message });
  }
};

export const createAuditLog = async (req, res) => {
  try {
    const { userId, action, entity, entityId, details, ipAddress, userAgent } =
      req.body;
    const resolvedUserId = userId || req.user?._id || req.user?.id;

    if (!resolvedUserId || !action || !entity || !details) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const auditLog = new AuditLog({
      userId: resolvedUserId,
      action,
      entity,
      entityId,
      details,
      ipAddress: ipAddress || getClientIp(req),
      userAgent: userAgent || req.headers["user-agent"] || "",
    });

    await auditLog.save();
    const populated = await auditLog.populate("userId", "fullName email");

    res.status(201).json(populated);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating audit log", error: error.message });
  }
};

export const deleteAuditLog = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await AuditLog.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).json({ message: "Audit log not found" });
    }

    res.json(result);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting audit log", error: error.message });
  }
};

// Helper function to create audit logs from other operations
export const logAction = async (userId, action, entity, entityId, details) => {
  try {
    const auditLog = new AuditLog({
      userId: resolvedUserId,
      action,
      entity,
      entityId,
      details,
    });
    await auditLog.save();
  } catch (error) {
    console.error("Error logging action:", error);
  }
};
