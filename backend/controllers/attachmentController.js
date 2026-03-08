import Attachment from '../models/Attachment.js';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Tạo __filename và __dirname trong ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/attachments'); // Save files to the uploads/attachments directory
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed.'));
    }
  },
});

const attachmentsFilePath = path.join(__dirname, '../data/attachments.json');

export const getTaskAttachments = async (req, res) => {
  try {
    const { taskId } = req.params;
    const attachments = await Attachment.find({ taskId })
      .populate('uploadedBy', '-password')
      .sort('-uploadedAt');
    res.json(attachments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAttachmentById = async (req, res) => {
  try {
    const attachment = await Attachment.findById(req.params.id)
      .populate('uploadedBy', '-password');
    if (!attachment) return res.status(404).json({ message: 'Attachment not found' });
    res.json(attachment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createAttachment = async (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    console.log('BODY:', req.body);
    console.log('FILE:', req.file);
    try {
      const { taskId, uploadedBy } = req.body;
      const fileName = req.file.originalname;
      const fileUrl = `/uploads/attachments/${req.file.filename}`;
      const fileSize = req.file.size;

      const newAttachment = {
        _id: new mongoose.Types.ObjectId().toString(),
        taskId: new mongoose.Types.ObjectId(taskId).toString(),
        fileName,
        fileUrl,
        fileSize,
        uploadedBy: new mongoose.Types.ObjectId(uploadedBy).toString(),
        uploadedAt: new Date().toISOString(),
      };

      // Save to MongoDB
      const attachment = new Attachment(newAttachment);
      const saved = await attachment.save();
      const populated = await Attachment.findById(saved._id).populate('uploadedBy', '-password');

      // Save to JSON file
      fs.readFile(attachmentsFilePath, 'utf8', (readErr, data) => {
        if (readErr && readErr.code !== 'ENOENT') {
          console.error('Error reading attachments file:', readErr);
          return res.status(500).json({ message: 'Failed to save attachment metadata.' });
        }

        const attachments = data ? JSON.parse(data) : [];
        attachments.push(newAttachment);

        fs.writeFile(attachmentsFilePath, JSON.stringify(attachments, null, 2), (writeErr) => {
          if (writeErr) {
            console.error('Error writing to attachments file:', writeErr);
            return res.status(500).json({ message: 'Failed to save attachment metadata.' });
          }

          res.status(201).json(populated);
        });
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
};

export const deleteAttachment = async (req, res) => {
  try {
    const attachment = await Attachment.findByIdAndDelete(req.params.id);
    if (!attachment) return res.status(404).json({ message: 'Attachment not found' });
    res.json({ message: 'Attachment deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
