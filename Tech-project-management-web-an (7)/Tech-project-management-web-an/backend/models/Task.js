import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  workUnitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkUnit',
    required: true
  },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  assigneeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: { type: String, enum: ['todo', 'in-progress', 'done', 'backlog'], default: 'todo' },
  deadline: { type: Date, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  order: { type: Number, required: true, default: 0 },
  timeSpent: { type: Number, default: 0 },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
  type: {
    type: String,
    enum: ['parent', 'subtask', 'epic', 'milestone', 'feature', 'bug', 'improvement'],
    default: 'parent'
  },
  storyPoints: { type: Number, default: null },
  issueType: { type: String, enum: ['epic', 'user-story', 'task', 'bug', 'subtask'], default: 'task' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  relatedTasks: [
  {
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    type: {
      type: String,
      enum: ['blocks', 'blocked_by', 'relates_to', 'duplicates'],
      default: 'relates_to'
    }
  }
]
});

taskSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  }
});

taskSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Task', taskSchema);
