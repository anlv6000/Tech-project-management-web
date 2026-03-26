import mongoose from "mongoose";

const userProjectSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true,
  },
  role: {
    type: String,
    enum: ["projectAdmin", "projectManager", "member", "viewer"],
    default: "member",
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
});

userProjectSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

// Create compound index to ensure user is only added to project once
userProjectSchema.index({ userId: 1, projectId: 1 }, { unique: true });

export default mongoose.model("UserProject", userProjectSchema);
