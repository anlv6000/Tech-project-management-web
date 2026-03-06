import Attachment from '../models/Attachment.js';
import mongoose from 'mongoose';

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
  try {
    const { taskId, fileName, fileUrl, fileSize, uploadedBy } = req.body;
    
    const attachment = new Attachment({
      _id: new mongoose.Types.ObjectId(),
      taskId: new mongoose.Types.ObjectId(taskId),
      fileName,
      fileUrl,
      fileSize,
      uploadedBy: new mongoose.Types.ObjectId(uploadedBy)
    });

    const saved = await attachment.save();
    const populated = await Attachment.findById(saved._id).populate('uploadedBy', '-password');
    
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
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
