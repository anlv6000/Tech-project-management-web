import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  fileName: {
    type: String,
    required: true,
    trim: true
  },
  fileUrl: {
    type: String,
    required: true,
    trim: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

attachmentSchema.index({ taskId: 1 });

export default mongoose.model('Attachment', attachmentSchema);
