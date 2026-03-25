import { authenticateToken } from "../middleware/auth.js";
import express from "express";
import * as commentController from "../controllers/commentController.js";
import Comment from "../models/Comment.js";
import Task from "../models/Task.js";
import mongoose from "mongoose";
import {
  attachCommentToRequest,
  requireCommentCreatePermission,
  requireCommentModifyPermission,
} from "../middleware/projectPermissions.js";

const router = express.Router();

router.get("/task/:taskId", commentController.getTaskComments);
router.get("/:id", commentController.getCommentById);

router.post(
  "/",
  authenticateToken,
  requireCommentCreatePermission,
  commentController.createComment,
);

router.put(
  "/:id",
  authenticateToken,
  attachCommentToRequest,
  requireCommentModifyPermission,
  commentController.updateComment,
);

router.delete(
  "/:id",
  authenticateToken,
  attachCommentToRequest,
  requireCommentModifyPermission,
  commentController.deleteComment,
);

// 🔥 Comments theo project
router.get('/project/:projectId', async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const tasks = await Task.find({ projectId: new mongoose.Types.ObjectId(projectId) });
    const taskIds = tasks.map(t => t._id);
    const comments = await Comment.find({ taskId: { $in: taskIds } })
      .populate('userId', '-password')
      .sort('createdAt')
      .lean();
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
