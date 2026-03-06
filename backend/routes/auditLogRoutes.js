import express from 'express';
import {
  getAllAuditLogs,
  getAuditLogsByAction,
  getAuditLogsByEntity,
  createAuditLog,
  deleteAuditLog,
} from '../controllers/auditLogController.js';

const router = express.Router();

// Get all audit logs
router.get('/', getAllAuditLogs);

// Get audit logs by action
router.get('/action/:action', getAuditLogsByAction);

// Get audit logs by entity
router.get('/entity/:entity', getAuditLogsByEntity);
router.get('/entity/:entity/:entityId', getAuditLogsByEntity);

// Create audit log
router.post('/', createAuditLog);

// Delete audit log
router.delete('/:id', deleteAuditLog);

export default router;
