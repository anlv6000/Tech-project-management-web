import Attachment from "../models/Attachment.js";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { createAuditLogFromRequest } from "../utils/auditLogger.js";

// ESM helpers
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

export const getTaskAttachments = async (req, res) => {
  try {
    const { taskId } = req.params;
    const attachments = await Attachment.find({ taskId })
      .populate("uploadedBy", "-password")
      .sort("-uploadedAt");

    res.json(attachments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAttachmentById = async (req, res) => {
  try {
    const attachment = await Attachment.findById(req.params.id).populate(
      "uploadedBy",
      "-password",
    );

    if (!attachment) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    res.json(attachment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createAttachment = async (req, res) => {
  upload.single("file")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    try {
      const { taskId } = req.body;

      if (!req.file) {
        return res.status(400).json({ message: "File is required" });
      }

      const fileName = req.file.originalname;
      const fileUrl = `/uploads/attachments/${req.file.filename}`;
      const fileSize = req.file.size;

      const attachment = new Attachment({
        _id: new mongoose.Types.ObjectId(),
        taskId: new mongoose.Types.ObjectId(taskId),
        fileName,
        fileUrl,
        fileSize,
        uploadedBy: new mongoose.Types.ObjectId(req.user._id),
        uploadedAt: new Date(),
      });

      const saved = await attachment.save();
      const populated = await Attachment.findById(saved._id).populate(
        "uploadedBy",
        "-password",
      );

      await createAuditLogFromRequest(req, {
        action: "create",
        entity: "attachment",
        entityId: saved._id,
        details: `${req.user?.fullName || "User"} uploaded attachment ${fileName}`,
      });

      res.status(201).json(populated);
    } catch (error) {
      console.error("Error creating attachment:", error);
      res.status(400).json({ message: error.message });
    }
  });
};


export const deleteAttachment = async (req, res) => {
  try {
    const attachment = await Attachment.findByIdAndDelete(req.params.id);

    if (!attachment) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    await createAuditLogFromRequest(req, {
      action: "delete",
      entity: "attachment",
      entityId: attachment._id,
      details: `${req.user?.fullName || "User"} deleted attachment ${attachment.fileName}`,
    });

    res.json({ message: "Attachment deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
