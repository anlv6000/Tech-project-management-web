import express from 'express';
import {
  getUserNotifications,
  getUnreadNotifications,
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
} from '../controllers/notificationController.js';

const router = express.Router();

// Get user notifications
router.get('/user/:userId', getUserNotifications);

// Get unread notifications
router.get('/user/:userId/unread', getUnreadNotifications);

// Create notification
router.post('/', createNotification);

// Mark as read
router.put('/:id/read', markNotificationAsRead);

// Mark all as read
router.put('/user/:userId/read-all', markAllNotificationsAsRead);

// Delete notification
router.delete('/:id', deleteNotification);

// Delete all notifications
router.delete('/user/:userId/delete-all', deleteAllNotifications);

export default router;
