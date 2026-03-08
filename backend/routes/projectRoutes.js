import express from 'express';
import * as projectController from '../controllers/projectController.js';

const router = express.Router();

router.get('/', projectController.getAllProjects);
router.get('/:id', projectController.getProjectById);
router.get('/user/:userId', projectController.getUserProjects);
router.post('/', projectController.createProject);
router.post('/:projectId/invite', projectController.inviteUserToProject);
router.post('/accept-invitation', projectController.acceptInvitation);
router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);
router.post('/:id/complete', projectController.completeProject);

export default router;
