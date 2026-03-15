import express from 'express';
import * as userProjectController from '../controllers/userProjectController.js';

const router = express.Router();

router.get('/', userProjectController.getAllUserProjects);
router.get('/project/:projectId', userProjectController.getProjectMembers);
router.post('/', userProjectController.addUserToProject);
router.put('/:userId/:projectId', userProjectController.updateUserRole);
router.delete('/:userId/:projectId', userProjectController.removeUserFromProject);
router.get('/user/:userId', userProjectController.getUserProjectsByUserId);
router.get('/userdata/:userId', userProjectController.getUserData);

export default router;
    