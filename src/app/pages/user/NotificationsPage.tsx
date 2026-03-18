import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Bell, Check, MessageSquare, FolderKanban, AlertCircle, UserPlus } from 'lucide-react';
import { API_BASE_URL } from "../../config/baseApi";
export default function NotificationsPage() {
  const { user } = useAuth();
  const { getUserNotifications, markAsRead } = useData();

  if (!user) return null;

  const userId = user.id || user._id || '';
  const notifications = getUserNotifications(userId);
  const unreadNotifications = notifications.filter(n => !n.isRead);

  const getIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <Check className="w-5 h-5" />;
      case 'comment':
        return <MessageSquare className="w-5 h-5" />;
      case 'project':
        return <FolderKanban className="w-5 h-5" />;
      case 'invitation':
        return <UserPlus className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const handleAcceptInvitation = async (notification: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/accept-invitation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token: notification.data?.invitationToken
        }),
      });

      if (response.ok) {
        markAsRead(notification.id || notification._id || '');
        // Refresh page or update state
        window.location.reload();
      }
    } catch (error) {
      console.error('Accept invitation error:', error);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
        <p className="text-gray-600">
          {unreadNotifications.length > 0 
            ? `You have ${unreadNotifications.length} unread notification${unreadNotifications.length > 1 ? 's' : ''}`
            : "You're all caught up!"
          }
        </p>
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-lg border p-12 text-center">
          <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No notifications yet</h3>
          <p className="text-gray-600">When you get notifications, they'll show up here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id || notification._id}
              className={`bg-white p-4 rounded-lg border hover:shadow-md transition-shadow ${
                !notification.isRead ? 'border-l-4 border-l-blue-600' : ''
              }`}
            >
              <div className="flex gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  notification.type === 'task' ? 'bg-green-100 text-green-600' :
                  notification.type === 'comment' ? 'bg-blue-100 text-blue-600' :
                  notification.type === 'project' ? 'bg-purple-100 text-purple-600' :
                  notification.type === 'invitation' ? 'bg-orange-100 text-orange-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {getIcon(notification.type)}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-medium text-gray-900">{notification.title}</h3>
                      <p className="text-gray-700 mt-1">{notification.message}</p>
                      <p className="text-sm text-gray-500 mt-2">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {notification.type === 'invitation' && notification.data?.status !== 'accepted' && (
                        <button
                          onClick={() => handleAcceptInvitation(notification)}
                          className="px-3 py-1 text-sm bg-green-600 text-white hover:bg-green-700 rounded-lg"
                        >
                          Accept
                        </button>
                      )}
                      {!notification.isRead && (
                        <button
                          onClick={() => markAsRead(notification.id || notification._id || '')}
                          className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
