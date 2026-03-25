import Task from "../models/Task.js";
import mongoose from "mongoose";
import { createAuditLogFromRequest } from "../utils/auditLogger.js";

export const getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    if (!projectId || projectId === "undefined") {
      return res.json([]);
    }

    const tasks = await Task.find({ projectId })
      .populate("assigneeId", "-password")
      .populate("createdBy", "-password")
      .sort("-createdAt")
      .lean();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTasksByWorkUnit = async (req, res) => {
  try {
    const { workUnitId } = req.params;
    const tasks = await Task.find({ workUnitId })
      .populate("assigneeId", "-password")
      .populate("createdBy", "-password")
      .sort("order")
      .lean();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("assigneeId", "-password")
      .populate("createdBy", "-password");

    if (!task) return res.status(404).json({ message: "Task not found" });

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createTask = async (req, res) => {
  try {
    const {
      projectId,
      workUnitId,
      title,
      description,
      assigneeId,
      status,
      deadline,
      order,
      timeSpent,
      parentId,
      type,
    } = req.body;

    const task = new Task({
      _id: new mongoose.Types.ObjectId(),
      projectId: new mongoose.Types.ObjectId(projectId),
      workUnitId: workUnitId ? new mongoose.Types.ObjectId(workUnitId) : null,
      title,
      description,
      assigneeId: assigneeId ? new mongoose.Types.ObjectId(assigneeId) : null,
      status: status || "todo",
      deadline: deadline ? new Date(deadline) : null,
      createdBy: new mongoose.Types.ObjectId(req.user._id),
      order: order || 0,
      timeSpent: timeSpent || 0,
      parentId: parentId ? new mongoose.Types.ObjectId(parentId) : null,
      type: type || "parent",
    });

    const saved = await task.save();

    const populated = await Task.findById(saved._id)
      .populate("assigneeId", "-password")
      .populate("createdBy", "-password");

    await createAuditLogFromRequest(req, {
      action: "create",
      entity: "task",
      entityId: populated._id,
      details: `${req.user?.fullName || "User"} created task ${populated.title}`,
    });

    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const existingTask = req.task || (await Task.findById(req.params.id));

    if (!existingTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    const updates = {};
    const allowedFields = [
      "title",
      "description",
      "assigneeId",
      "status",
      "deadline",
      "order",
      "timeSpent",
      "workUnitId",
      "type",
    ];

    for (const field of allowedFields) {
      if (field in req.body) {
        if (field === "assigneeId") {
          updates.assigneeId = req.body.assigneeId
            ? new mongoose.Types.ObjectId(req.body.assigneeId)
            : null;
        } else if (field === "deadline") {
          updates.deadline = req.body.deadline
            ? new Date(req.body.deadline)
            : null;
        } else if (field === "workUnitId") {
          updates.workUnitId = req.body.workUnitId
            ? new mongoose.Types.ObjectId(req.body.workUnitId)
            : null;
        } else {
          updates[field] = req.body[field];
        }
      }
    }

    const updated = await Task.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    })
      .populate("assigneeId", "-password")
      .populate("createdBy", "-password");

    if (!updated) {
      return res.status(404).json({ message: "Task not found" });
    }

    await createAuditLogFromRequest(req, {
      action: "update",
      entity: "task",
      entityId: updated._id,
      details: `${req.user?.fullName || "User"} updated task ${updated.title}`,
    });

    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) return res.status(404).json({ message: "Task not found" });

    await createAuditLogFromRequest(req, {
      action: "delete",
      entity: "task",
      entityId: task._id,
      details: `${req.user?.fullName || "User"} deleted task ${task.title}`,
    });

    res.json({ message: "Task deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate("assigneeId", "-password")
      .populate("createdBy", "-password")
      .sort({ createdAt: -1 })
      .lean();

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTasksByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const tasks = await Task.find({
      $or: [{ createdBy: userId }, { assigneeId: userId }],
    })
      .populate("assigneeId", "-password")
      .populate("createdBy", "-password")
      .sort({ createdAt: -1 })
      .lean();

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSubTasks = async (req, res) => {
  try {
    const { taskId } = req.params;
    const subTasks = await Task.find({ parentId: taskId })
      .populate("assigneeId", "-password")
      .populate("createdBy", "-password")
      .sort("order")
      .lean();
    res.json(subTasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getRelatedTasks = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId)
      .populate({
        path: 'relatedTasks.taskId',
        populate: [
          { path: 'assigneeId', select: '-password' },
          { path: 'createdBy', select: '-password' }
        ]
      })
      .lean();

    if (!task) return res.status(404).json({ message: 'Task not found' });

    res.json(task.relatedTasks || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addRelatedTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { relatedTaskId, type } = req.body;

    if (taskId === relatedTaskId) {
      return res.status(400).json({ message: 'Cannot relate a task to itself' });
    }

    const [task, relatedTask] = await Promise.all([
      Task.findById(taskId),
      Task.findById(relatedTaskId)
    ]);

    if (!task || !relatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.projectId.toString() !== relatedTask.projectId.toString()) {
      return res.status(400).json({
        message: 'Cannot relate tasks from different projects'
      });
    }

    const alreadyLinked = task.relatedTasks?.some(
      r => r.taskId.toString() === relatedTaskId
    );
    if (alreadyLinked) {
      return res.status(400).json({ message: 'Tasks are already related' });
    }

    task.relatedTasks.push({ taskId: relatedTaskId, type });

    const inverseType = {
      blocks: 'blocked_by',
      blocked_by: 'blocks',
      relates_to: 'relates_to',
      duplicates: 'duplicates'
    }[type] || 'relates_to';

    relatedTask.relatedTasks.push({ taskId: taskId, type: inverseType });

    await Promise.all([task.save(), relatedTask.save()]);

    await createAuditLogFromRequest(req, {
      action: 'update',
      entity: 'task',
      entityId: task._id,
      details: `${req.user?.fullName || 'User'} linked task ${task.title} → ${relatedTask.title} (${type})`
    });

    const updated = await Task.findById(taskId).populate({
      path: 'relatedTasks.taskId',
      populate: [
        { path: 'assigneeId', select: '-password' },
        { path: 'createdBy', select: '-password' }
      ]
    });

    res.json(updated.relatedTasks);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const removeRelatedTask = async (req, res) => {
  try {
    const { taskId, relatedTaskId } = req.params;

    const [task, relatedTask] = await Promise.all([
      Task.findById(taskId),
      Task.findById(relatedTaskId)
    ]);

    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Gỡ 2 chiều
    task.relatedTasks = task.relatedTasks.filter(
      r => r.taskId.toString() !== relatedTaskId
    );
    await task.save();

    if (relatedTask) {
      relatedTask.relatedTasks = relatedTask.relatedTasks.filter(
        r => r.taskId.toString() !== taskId
      );
      await relatedTask.save();
    }

    res.json({ message: 'Relation removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
