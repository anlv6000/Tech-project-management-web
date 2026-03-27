import Notification from '../models/Notification.js';

export const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(100);
    
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
};

export const getUnreadNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = await Notification.find({ userId, isRead: false })
      .sort({ createdAt: -1 });
    
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
};

export const createNotification = async (req, res) => {
  try {
    const { userId, type, title, message, relatedEntityId, relatedEntityType, actionLink } = req.body;

    if (!userId || !type || !title || !message) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const notification = new Notification({
      userId,
      type,
      title,
      message,
      relatedEntityId,
      relatedEntityType,
      actionLink,
      isRead: false,
    });

    await notification.save();
    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Error creating notification', error: error.message });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Error marking notification as read', error: error.message });
  }
};

export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );

    res.json({
      message: 'Notifications marked as read',
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error marking notifications as read', error: error.message });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Notification.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error deleting notification', error: error.message });
  }
};

export const deleteAllNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await Notification.deleteMany({ userId });

    res.json({
      message: 'Notifications deleted',
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting notifications', error: error.message });
  }
};

// Helper function to create notifications
export const createUserNotification = async (userId, type, title, message, relatedEntityId, relatedEntityType, actionLink) => {
  try {
    const notification = new Notification({
      userId,
      type,
      title,
      message,
      relatedEntityId,
      relatedEntityType,
      actionLink,
      isRead: false,
    });
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};
