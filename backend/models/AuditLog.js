import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      enum: ['create', 'update', 'delete', 'login', 'logout', 'export', 'archive'],
      required: true,
    },
    entity: {
      type: String,
      enum: ['project', 'task', 'user', 'comment', 'attachment', 'workunit', 'userproject'],
      required: true,
    },
    entityId: {
      type: String,
    },
    details: {
      type: String,
      required: true,
    },
    ipAddress: String,
    userAgent: String,
  },
  { timestamps: true }
);

export default mongoose.model('AuditLog', auditLogSchema);
