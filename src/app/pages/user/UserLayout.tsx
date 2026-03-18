import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { API_BASE_URL } from "../../config/baseApi";
import {
  CheckCircle,
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  BarChart3,
  Bell,
  User,
  LogOut,
  ChevronDown,
  Search,
  Menu,
  X,
} from 'lucide-react';

export default function UserLayout() {
  const { user, logout, isAuthenticated } = useAuth();
  const { getUserNotifications } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const notifications = user ? getUserNotifications(user.id || user._id || '') : [];
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { path: '/app', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { path: '/app/projects', icon: FolderKanban, label: 'Projects' },
    { path: '/app/reports', icon: BarChart3, label: 'Reports' },
    { path: '/app/notifications', icon: Bell, label: 'Notifications', badge: unreadCount },
    { path: '/app/profile', icon: User, label: 'Profile' },
  ];

  const isActive = (path: string, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b h-16 flex items-center px-4 lg:px-6 z-10">
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link to="/app" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold hidden sm:block">Tech-Task friendly</span>
          </Link>

          {/* Search */}
          <div className="flex-1 max-w-md ml-4 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects, tasks..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <Link to="/app/notifications">
            <button className="relative p-2 hover:bg-gray-100 rounded-lg">
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>
          </Link>

{/* Profile dropdown */}
<div className="relative">
  <button
    onClick={() => setIsProfileOpen(!isProfileOpen)}
    className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg"
  >
    {user?.avatar ? (
      <img
        src={`${API_BASE_URL}${user.avatar}`}
        alt={user.fullName}
        className="w-8 h-8 rounded-full object-cover"
      />
    ) : (
      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
        <span className="text-blue-600 font-medium">
          {user?.fullName.charAt(0).toUpperCase()}
        </span>
      </div>
    )}
    <ChevronDown className="w-4 h-4 text-gray-600 hidden sm:block" />
  </button>

  {isProfileOpen && (
    <>
      <div
        className="fixed inset-0 z-10"
        onClick={() => setIsProfileOpen(false)}
      ></div>
      <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border z-20">
        <div className="p-4 border-b">
          <p className="font-medium text-gray-900">{user?.fullName}</p>
          <p className="text-sm text-gray-600">{user?.email}</p>
        </div>
        <div className="p-2">
          <Link
            to="/app/profile"
            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg"
            onClick={() => setIsProfileOpen(false)}
          >
            <User className="w-4 h-4" />
            Profile
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg text-red-600"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </>
  )}
</div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-20 w-64 bg-white border-r transition-transform duration-200 mt-16 lg:mt-0`}
        >
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path, item.exact);
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    active
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
