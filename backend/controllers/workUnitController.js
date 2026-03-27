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

    const existing = await WorkUnit.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "WorkUnit not found" });
    }

    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (type !== undefined) updateFields.type = type;
    if (order !== undefined) updateFields.order = order;
    if (goal !== undefined) updateFields.goal = goal;

    const isPhase = existing.type === "phase" || type === "phase";
    if (isPhase) {
      // Sequence control: only allow updating phase n when phase n-1 is completed
      if (existing.order > 1) {
        const prevPhase = await WorkUnit.findOne({
          projectId: existing.projectId,
          type: "phase",
          order: existing.order - 1,
        });

        if (prevPhase && !prevPhase.isDone) {
          return res.status(400).json({
            message:
              "Cannot update this phase before previous phase is completed.",
          });
        }
      }

      // Start date for phases is always set to now when updating
      updateFields.startDate = new Date();

      // End date is customizable
      if (endDate !== undefined) {
        updateFields.endDate = new Date(endDate);
      }
    } else {
      if (startDate !== undefined) updateFields.startDate = new Date(startDate);
      if (endDate !== undefined) updateFields.endDate = new Date(endDate);
    }

    const updated = await WorkUnit.findByIdAndUpdate(
      req.params.id,
      updateFields,
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

export const markPhaseDone = async (req, res) => {
  try {
    const workUnit = await WorkUnit.findById(req.params.id);
    if (!workUnit) {
      return res.status(404).json({ message: "WorkUnit not found" });
    }

    if (workUnit.type !== "phase") {
      return res.status(400).json({ message: "Only phases can be marked as done" });
    }

    const updated = await WorkUnit.findByIdAndUpdate(
      req.params.id,
      { isDone: true },
      { new: true },
    );

    await createAuditLogFromRequest(req, {
      action: "update",
      entity: "workunit",
      entityId: updated._id,
      details: `${req.user?.fullName || "User"} marked phase ${updated.name} as completed`,
    });

    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const startSprint = async (req, res) => {
  try {
    const sprint = await WorkUnit.findById(req.params.id);
    if (!sprint) {
      return res.status(404).json({ message: "Sprint not found" });
    }

    if (sprint.type !== "sprint") {
      return res.status(400).json({ message: "Only sprints can be started" });
    }

    if (sprint.status !== "planning") {
      return res.status(400).json({ message: "Only sprints in planning status can be started" });
    }

    // Set start date if not already set
    const updateFields = { status: "active" };
    if (!sprint.startDate) {
      updateFields.startDate = new Date();
    }

    const updated = await WorkUnit.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    );

    await createAuditLogFromRequest(req, {
      action: "update",
      entity: "workunit",
      entityId: updated._id,
      details: `${req.user?.fullName || "User"} started sprint ${updated.name}`,
    });

    res.json(updated);
  } catch (error) {
    console.error("startSprint error:", error);
    res.status(400).json({ message: error.message });
  }
};

export const endSprint = async (req, res) => {
  try {
    const { moveUncompletedTo } = req.body;
    const sprint = await WorkUnit.findById(req.params.id);
    if (!sprint) {
      return res.status(404).json({ message: "Sprint not found" });
    }

    if (sprint.type !== "sprint") {
      return res.status(400).json({ message: "Only sprints can be ended" });
    }

    if (sprint.status !== "active") {
      return res.status(400).json({ message: "Only active sprints can be ended" });
    }

    // Get all uncompleted tasks in this sprint
    const uncompletedTasks = await Task.find({
      workUnitId: sprint._id,
      status: { $ne: "done" }
    });

    // Move uncompleted tasks
    if (moveUncompletedTo && moveUncompletedTo !== "backlog") {
      // Move to another sprint
      const targetSprint = await WorkUnit.findById(moveUncompletedTo);
      if (!targetSprint || targetSprint.type !== "sprint") {
        return res.status(400).json({ message: "Invalid target sprint" });
      }
      await Task.updateMany(
        { workUnitId: sprint._id, status: { $ne: "done" } },
        { workUnitId: targetSprint._id }
      );
    } else if (moveUncompletedTo === "backlog") {
      // Move to backlog column
      const backlogUnit = await WorkUnit.findOne({
        projectId: sprint.projectId,
        type: "backlog"
      });
      if (!backlogUnit) {
        return res.status(400).json({ message: "Backlog column not found" });
      }
      await Task.updateMany(
        { workUnitId: sprint._id, status: { $ne: "done" } },
        { workUnitId: backlogUnit._id }
      );
    }

    // Close the sprint
    const updated = await WorkUnit.findByIdAndUpdate(
      req.params.id,
      { status: "closed", isDone: true, endDate: new Date() },
      { new: true }
    );

    await createAuditLogFromRequest(req, {
      action: "update",
      entity: "workunit",
      entityId: updated._id,
      details: `${req.user?.fullName || "User"} ended sprint ${updated.name}. ${uncompletedTasks.length} uncompleted tasks moved.`,
    });

    res.json({
      sprint: updated,
      uncompletedCount: uncompletedTasks.length
    });
  } catch (error) {
    console.error("endSprint error:", error);
    res.status(400).json({ message: error.message });
  }
};

export const getSprintStats = async (req, res) => {
  try {
    const sprint = await WorkUnit.findById(req.params.id);
    if (!sprint) {
      return res.status(404).json({ message: "Sprint not found" });
    }

    if (sprint.type !== "sprint") {
      return res.status(400).json({ message: "Work unit is not a sprint" });
    }

    // Get all tasks in sprint
    const allTasks = await Task.find({ workUnitId: sprint._id });
    const completedTasks = await Task.find({ workUnitId: sprint._id, status: "done" });
    const inProgressTasks = await Task.find({ workUnitId: sprint._id, status: "in-progress" });
    const todoTasks = await Task.find({ workUnitId: sprint._id, status: "todo" });

    // Calculate story points
    const totalPoints = allTasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
    const completedPoints = completedTasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);

    // Calculate remaining work (days left)
    const daysElapsed = sprint.startDate ? Math.floor((new Date() - new Date(sprint.startDate)) / (1000 * 60 * 60 * 24)) : 0;
    const daysTotal = sprint.startDate && sprint.endDate ? Math.floor((new Date(sprint.endDate) - new Date(sprint.startDate)) / (1000 * 60 * 60 * 24)) : 0;
    const daysRemaining = Math.max(0, daysTotal - daysElapsed);

    res.json({
      sprint: sprint,
      stats: {
        totalTasks: allTasks.length,
        completedTasks: completedTasks.length,
        inProgressTasks: inProgressTasks.length,
        todoTasks: todoTasks.length,
        completionPercentage: allTasks.length > 0 ? Math.round((completedTasks.length / allTasks.length) * 100) : 0,
        totalStoryPoints: totalPoints,
        completedStoryPoints: completedPoints,
        remainingStoryPoints: totalPoints - completedPoints,
        daysElapsed,
        daysTotal,
        daysRemaining,
        pointsPerDay: daysElapsed > 0 ? (completedPoints / daysElapsed).toFixed(2) : 0
      }
    });
  } catch (error) {
    console.error("getSprintStats error:", error);
    res.status(500).json({ message: error.message });
  }
};