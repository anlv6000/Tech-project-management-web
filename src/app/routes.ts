import { createBrowserRouter } from 'react-router';

// Guest pages
import LandingPage from './pages/guest/LandingPage';
import RegisterPage from './pages/guest/RegisterPage';
import LoginPage from './pages/guest/LoginPage';
import ForgotPasswordPage from './pages/guest/ForgotPasswordPage';

// User pages
import UserLayout from './pages/user/UserLayout';
import Dashboard from './pages/user/Dashboard';
import ProjectList from './pages/user/ProjectList';
import ProjectDetail from './pages/user/ProjectDetail';
import TaskBoard from './pages/user/TaskBoard';
import Reports from './pages/user/Reports';
import NotificationsPage from './pages/user/NotificationsPage';
import ProfilePage from './pages/user/ProfilePage';

// Admin pages
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import ProjectManagement from './pages/admin/ProjectManagement';
import SystemReports from './pages/admin/SystemReports';
import AuditLogs from './pages/admin/AuditLogs';

export const router = createBrowserRouter([
  // Guest routes
  {
    path: '/',
    Component: LandingPage,
  },
  {
    path: '/register',
    Component: RegisterPage,
  },
  {
    path: '/login',
    Component: LoginPage,
  },
  {
    path: '/forgot-password',
    Component: ForgotPasswordPage,
  },
  
  // User routes
  {
    path: '/app',
    Component: UserLayout,
    children: [
      {
        index: true,
        Component: Dashboard,
      },
      {
        path: 'projects',
        Component: ProjectList,
      },
      {
        path: 'projects/:projectId',
        Component: ProjectDetail,
      },
      {
        path: 'projects/:projectId/board',
        Component: TaskBoard,
      },
      {
        path: 'reports',
        Component: Reports,
      },
      {
        path: 'notifications',
        Component: NotificationsPage,
      },
      {
        path: 'profile',
        Component: ProfilePage,
      },
    ],
  },
  
  // Admin routes
  {
    path: '/admin',
    Component: AdminLayout,
    children: [
      {
        index: true,
        Component: AdminDashboard,
      },
      {
        path: 'users',
        Component: UserManagement,
      },
      {
        path: 'projects',
        Component: ProjectManagement,
      },
      {
        path: 'reports',
        Component: SystemReports,
      },
      {
        path: 'audit',
        Component: AuditLogs,
      },
    ],
  },
]);
