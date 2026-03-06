import express from 'express';
import * as attachmentController from '../controllers/attachmentController.js';

const router = express.Router();

router.get('/task/:taskId', attachmentController.getTaskAttachments);
router.get('/:id', attachmentController.getAttachmentById);
router.post('/', attachmentController.createAttachment);
router.delete('/:id', attachmentController.deleteAttachment);

export default router;
