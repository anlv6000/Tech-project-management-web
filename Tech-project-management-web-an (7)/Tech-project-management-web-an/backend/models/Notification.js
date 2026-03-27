import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['task', 'comment', 'project', 'mention', 'system', 'invitation', 'workunit'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    relatedEntityId: {
      type: String,
    },
    relatedEntityType: {
      type: String,
      enum: ['task', 'project', 'comment', 'user'],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    actionLink: String,
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

export default mongoose.model('Notification', notificationSchema);
