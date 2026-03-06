import express from 'express';
import * as workUnitController from '../controllers/workUnitController.js';

const router = express.Router();

router.get('/project/:projectId', workUnitController.getProjectWorkUnits);
router.get('/:id', workUnitController.getWorkUnitById);
router.post('/', workUnitController.createWorkUnit);
router.put('/:id', workUnitController.updateWorkUnit);
router.delete('/:id', workUnitController.deleteWorkUnit);
router.post('/sprint', workUnitController.createSprint);

export default router;
