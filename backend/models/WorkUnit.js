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
  isDone: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

workUnitSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const WorkUnit = mongoose.model('WorkUnit', workUnitSchema);
export default WorkUnit;   // ✅ default export
