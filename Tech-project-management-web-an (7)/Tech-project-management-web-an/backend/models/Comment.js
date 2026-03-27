import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});
commentSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  }
});

commentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

commentSchema.index({ taskId: 1 });

export default mongoose.model('Comment', commentSchema);
