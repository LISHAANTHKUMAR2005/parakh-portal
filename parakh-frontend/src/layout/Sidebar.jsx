import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavigationItems = () => {
    if (!user) return [];

    if (user.role === 'STUDENT') {
      return [
        { name: 'Dashboard', href: '/student/dashboard', current: true },
        { name: 'Exam', href: '/student/exam', current: false },
        { name: 'Results', href: '/student/result', current: false },
      ];
    }

    if (user.role === 'TEACHER') {
      return [
        { name: 'Dashboard', href: '/teacher/dashboard', current: true },
        { name: 'Question Manager', href: '/teacher/questions', current: false },
        { name: 'Reports', href: '/teacher/reports', current: false },
      ];
    }

    if (user.role === 'ADMIN') {
      return [
        { name: 'Dashboard', href: '/admin/dashboard', current: true },
        { name: 'User Manager', href: '/admin/users', current: false },
        { name: 'System Stats', href: '/admin/stats', current: false },
      ];
    }

    return [];
  };

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:border-r md:border-gray-200">
      {/* Sidebar component */}
      <div className="flex flex-col flex-grow pt-5 bg-white overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <h1 className="text-2xl font-bold text-gray-900">PARAKH</h1>
        </div>
        <div className="mt-5 flex-grow flex flex-col">
          <nav className="flex-1 px-2 pb-4 space-y-1">
            {user && getNavigationItems().map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  item.current
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {item.name}
              </a>
            ))}
          </nav>
        </div>
        {user && (
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-700">{user.name}</div>
              <div className="text-xs text-gray-500">{user.role}</div>
            </div>
            <button
              onClick={handleLogout}
              className="ml-2 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-xs"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;