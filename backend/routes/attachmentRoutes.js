import { authenticateToken } from "../middleware/auth.js";
import express from "express";
import {
  createAttachment,
  getTaskAttachments,
  getAttachmentById,
  deleteAttachment,
} from "../controllers/attachmentController.js";
import Attachment from "../models/Attachment.js";
import Task from "../models/Task.js";
import mongoose from "mongoose";

const router = express.Router();

router.get("/task/:taskId", getTaskAttachments);
router.get("/:id", getAttachmentById);
router.post("/", authenticateToken, createAttachment);
router.delete("/:id", authenticateToken, deleteAttachment);

// 🔥 Attachments theo project
router.get("/project/:projectId", async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const tasks = await Task.find({
      projectId: new mongoose.Types.ObjectId(projectId),
    });
    const taskIds = tasks.map((t) => t._id);
    const attachments = await Attachment.find({ taskId: { $in: taskIds } })
      .populate("uploadedBy", "-password")
      .sort("-uploadedAt")
      .lean();
    res.json(attachments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
