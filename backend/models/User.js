import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  avatar: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
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

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();   // thêm trường id dạng string
    delete ret._id;                // bỏ _id gốc
    delete ret.password;           // bỏ password
    return ret;
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash if password is modified
  if (!this.isModified('password')) {
    this.updatedAt = Date.now();
    return next();
  }

  try {
    this.password = await bcrypt.hash(this.password, 10);
    this.updatedAt = Date.now();
    next();
  } catch (error) {
    next(error);
  }
});

export default mongoose.model('User', userSchema);
