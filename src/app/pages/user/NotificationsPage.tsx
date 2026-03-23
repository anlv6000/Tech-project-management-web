import React from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Bell, Check, MessageSquare, FolderKanban, AlertCircle, UserPlus } from 'lucide-react';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getUserNotifications, markAsRead, refreshNotifications, getTask } = useData();

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

  const resolvePjaxRoute = (actionLink: string) => {
    const link = actionLink.split('?')[0];
    const parts = link.split('/').filter(Boolean);

    if (!parts.length) return null;

    const projectIndex = parts.findIndex((p) => p === 'projects');
    const taskIndex = parts.findIndex((p) => p === 'tasks');
    const boardIndex = parts.findIndex((p) => p === 'board');

    if (projectIndex >= 0) {
      const projectId = parts[projectIndex + 1];

      if (taskIndex >= 0 && projectId) {
        const taskId = parts[taskIndex + 1];
        if (taskId) {
          return `/app/projects/${projectId}/board?taskId=${taskId}`;
        }
      }

      if (boardIndex >= 0 && projectId) {
        const query = actionLink.includes('?') ? actionLink.split('?')[1] : '';
        return `/app/projects/${projectId}/board${query ? '?' + query : ''}`;
      }

      if (projectId) {
        return `/app/projects/${projectId}`;
      }
    }

    return null;
  };

  const handleNotificationClick = async (notification: any) => {
    const notificationId = notification.id || notification._id || '';
    if (notificationId) {
      markAsRead(notificationId);
    }

    if (notification.actionLink) {
      const actionLink = String(notification.actionLink);
      const resolvedRoute = resolvePjaxRoute(actionLink);
      if (resolvedRoute) {
        navigate(resolvedRoute);
        return;
      }

      if (actionLink.startsWith('http')) {
        window.location.href = actionLink;
        return;
      }

      navigate(actionLink);
      return;
    }

    if (notification.type === 'project' || notification.type === 'invitation') {
      const projectId = notification.data?.projectId || notification.relatedEntityId;
      if (projectId) {
        navigate(`/app/projects/${projectId}`);
        return;
      }

      navigate('/app/projects');
      return;
    }

    if (notification.relatedEntityType === 'task' || notification.type === 'task') {
      const taskId = notification.relatedEntityId || notification.data?.taskId || '';
      const task = taskId ? getTask(taskId) : undefined;
      const projectId = task?.projectId || notification.data?.projectId;

      if (projectId) {
        const query = taskId ? `?taskId=${taskId}` : '';
        navigate(`/app/projects/${projectId}/board${query}`);
        return;
      }

      if (taskId) {
        try {
          const res = await fetch(`http://localhost:5000/api/tasks/${taskId}`);
          if (res.ok) {
            const taskDetail = await res.json();
            if (taskDetail.projectId) {
              navigate(`/app/projects/${taskDetail.projectId}/board?taskId=${taskId}`);
              return;
            }
          }
        } catch (error) {
          console.error('Failed to fetch task details for notification route', error);
        }
      }

      navigate('/app/projects');
      return;
    }

    navigate('/app/projects');
  };

  const handleAcceptInvitation = async (notification: any) => {
    try {
      const response = await fetch('http://localhost:5000/api/projects/accept-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token: notification.data?.invitationToken,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        markAsRead(notification.id || notification._id || '');

        await refreshNotifications(userId);

        if (data?.projectId) {
          // Stay on notifications so user sees welcome notification
          // but also allow quickly jump into project
          // navigate(`/app/projects/${data.projectId}`);
          return;
        }

        return;
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
              onClick={() => handleNotificationClick(notification)}
              className={`bg-white p-4 rounded-lg border hover:shadow-md transition-shadow cursor-pointer ${
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAcceptInvitation(notification);
                          }}
                          className="px-3 py-1 text-sm bg-green-600 text-white hover:bg-green-700 rounded-lg"
                        >
                          Accept
                        </button>
                      )}
                      {!notification.isRead && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id || notification._id || '');
                          }}
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