import WorkUnit from "../models/WorkUnit.js";
import mongoose from "mongoose";
import { createAuditLogFromRequest } from "../utils/auditLogger.js";
import Task from "../models/Task.js";
import { deleteTaskWithChildren } from "./taskController.js";
export const getProjectWorkUnits = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!projectId || projectId === "undefined") {
      return res.json([]);
    }

    const workUnits = await WorkUnit.find({ projectId }).sort("order");
    res.json(workUnits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createSprint = async (req, res) => {
  try {
    const { projectId, name, startDate, endDate, goal } = req.body;

    const lastSprint = await WorkUnit.find({ projectId, type: "sprint" })
      .sort({ order: -1 })
      .limit(1);

    const nextOrder = lastSprint.length > 0 ? lastSprint[0].order + 1 : 1;

    const sprint = new WorkUnit({
      projectId: new mongoose.Types.ObjectId(projectId),
      name,
      type: "sprint",
      order: nextOrder,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      goal: goal || null,
    });

    const saved = await sprint.save();

    await createAuditLogFromRequest(req, {
      action: "create",
      entity: "workunit",
      entityId: saved._id,
      details: `${req.user?.fullName || "User"} created sprint ${saved.name}`,
    });

    return res.status(201).json(saved);
  } catch (error) {
    console.error("createSprint error:", error);
    return res.status(400).json({ message: error.message });
  }
};

export const getWorkUnitById = async (req, res) => {
  try {
    const workUnit = await WorkUnit.findById(req.params.id);

    if (!workUnit) {
      return res.status(404).json({ message: "WorkUnit not found" });
    }

    res.json(workUnit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createWorkUnit = async (req, res) => {
  try {
    const { projectId, name, type, order, startDate, endDate, goal } = req.body;

    const workUnit = new WorkUnit({
      _id: new mongoose.Types.ObjectId(),
      projectId: new mongoose.Types.ObjectId(projectId),
      name,
      type,
      order: order || 0,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      goal: goal || null,
    });

    const saved = await workUnit.save();

    await createAuditLogFromRequest(req, {
      action: "create",
      entity: "workunit",
      entityId: saved._id,
      details: `${req.user?.fullName || "User"} created work unit ${saved.name}`,
    });

    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateWorkUnit = async (req, res) => {
  try {
    const { name, type, order, startDate, endDate, goal } = req.body;

    const updated = await WorkUnit.findByIdAndUpdate(
      req.params.id,
      {
        name,
        type,
        order,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        goal,
      },
      { new: true },
    );

    if (!updated) {
      return res.status(404).json({ message: "WorkUnit not found" });
    }

    await createAuditLogFromRequest(req, {
      action: "update",
      entity: "workunit",
      entityId: updated._id,
      details: `${req.user?.fullName || "User"} updated work unit ${updated.name}`,
    });

    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteWorkUnit = async (req, res) => {
  try {
    const workUnit = await WorkUnit.findById(req.params.id);
    if (!workUnit) {
      return res.status(404).json({ message: "WorkUnit not found" });
    }

    // Lấy tất cả task thuộc workUnit
    const tasks = await Task.find({ workUnitId: workUnit._id });
    for (const task of tasks) {
      await deleteTaskWithChildren(task._id); // xóa task + subtasks + related
    }

    // Xóa workUnit
    await workUnit.deleteOne();

    await createAuditLogFromRequest(req, {
      action: "delete",
      entity: "workunit",
      entityId: workUnit._id,
      details: `${req.user?.fullName || "User"} deleted work unit ${workUnit.name} and all related tasks`,
    });

    res.json({ message: "WorkUnit and all related tasks deleted" });
  } catch (error) {
    console.error("deleteWorkUnit error:", error);
    res.status(500).json({ message: error.message });
  }
};