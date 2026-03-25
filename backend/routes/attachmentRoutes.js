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
import multer from "multer";
import {
  attachAttachmentToRequest,
  requireAttachmentCreatePermission,
  requireAttachmentDeletePermission,
} from "../middleware/projectPermissions.js";

const router = express.Router();
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/attachments");
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, and PDF are allowed."));
    }
  },
});
router.get("/task/:taskId", getTaskAttachments);
router.get("/:id", getAttachmentById);

router.post(
  "/",
  authenticateToken,
  upload.single("file"), // parse form-data trước
  requireAttachmentCreatePermission,
  createAttachment,
);

router.delete(
  "/:id",
  authenticateToken,
  attachAttachmentToRequest,
  requireAttachmentDeletePermission,
  deleteAttachment,
);

// 🔥 Attachments theo project
router.get('/project/:projectId', async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const tasks = await Task.find({ projectId: new mongoose.Types.ObjectId(projectId) });
    const taskIds = tasks.map(t => t._id);
    const attachments = await Attachment.find({ taskId: { $in: taskIds } })
      .populate('uploadedBy', '-password')
      .sort('-uploadedAt')
      .lean();
    res.json(attachments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
