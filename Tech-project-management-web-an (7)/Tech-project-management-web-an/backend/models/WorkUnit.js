import mongoose from 'mongoose';

const workUnitSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['sprint', 'column', 'phase'], required: true },
  order: { type: Number, default: 0 },
  startDate: { type: Date, default: null },
  endDate: { type: Date, default: null },
  goal: { type: String, default: null, trim: true },
  status: { type: String, enum: ['planning', 'active', 'closed'], default: 'planning' },
  isDone: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

workUnitSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  // Auto-update status based on dates
  if (this.type === 'sprint') {
    if (this.startDate && new Date() >= this.startDate && this.status === 'planning') {
      this.status = 'active';
    }
    if (this.endDate && new Date() >= this.endDate && this.status !== 'closed') {
      this.status = 'closed';
    }
  }
  next();
});

const WorkUnit = mongoose.model('WorkUnit', workUnitSchema);
export default WorkUnit;   // ✅ default export
