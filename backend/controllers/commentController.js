import Comment from '../models/Comment.js';
import mongoose from 'mongoose';

export const getTaskComments = async (req, res) => {
  try {
    const { taskId } = req.params;
    const comments = await Comment.find({ taskId })
      .populate('userId', '-password')
      .sort('createdAt').lean();
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCommentById = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id)
      .populate('userId', '-password');
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    res.json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createComment = async (req, res) => {
  try {
    const { taskId, userId, content, parentId } = req.body;
    
    const comment = new Comment({
      _id: new mongoose.Types.ObjectId(),
      taskId: new mongoose.Types.ObjectId(taskId),
      userId: new mongoose.Types.ObjectId(userId),
      content,
      parentId: parentId ? new mongoose.Types.ObjectId(parentId) : null
    });

    const saved = await comment.save();
    const populated = await Comment.findById(saved._id).populate('userId', '-password');
    
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateComment = async (req, res) => {
  try {
    const { content } = req.body;
    
    const updated = await Comment.findByIdAndUpdate(
      req.params.id,
      { content },
      { new: true }
    ).populate('userId', '-password');
    
    if (!updated) return res.status(404).json({ message: 'Comment not found' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findByIdAndDelete(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
