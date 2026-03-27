import AuditLog from '../models/AuditLog.js';

export const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || '';
};

export const createAuditLogFromRequest = async (
  req,
  { userId, action, entity, entityId = '', details = '' },
) => {
  try {
    const resolvedUserId =
      userId || req.user?._id || req.user?.id || req.body?.userId || null;

    if (!resolvedUserId || !action || !entity || !details) return null;

    const auditLog = await AuditLog.create({
      userId: resolvedUserId,
      action,
      entity,
      entityId: entityId ? String(entityId) : '',
      details,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'] || '',
    });

    return auditLog;
  } catch (error) {
    console.error('Audit log write failed:', error.message);
    return null;
  }
};
