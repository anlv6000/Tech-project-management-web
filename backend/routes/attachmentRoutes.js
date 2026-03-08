import express from 'express';
import { createAttachment, getTaskAttachments, getAttachmentById, deleteAttachment } from '../controllers/attachmentController.js';

const router = express.Router();

// Route to get all attachments for a task
router.get('/task/:taskId', getTaskAttachments);

// Route to get a specific attachment by ID
router.get('/:id', getAttachmentById);

// Route to create a new attachment with file upload
router.post('/', createAttachment);

// Route to delete an attachment by ID
router.delete('/:id', deleteAttachment);

export default router;
