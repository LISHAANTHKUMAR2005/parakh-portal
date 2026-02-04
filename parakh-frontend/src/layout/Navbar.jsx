import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import Button from '../components/ui/Button';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  const NavLink = ({ to, children }) => (
    <Link
      to={to}
      className={`relative px-3 py-2 text-sm font-medium transition-colors duration-200 group ${isActive(to) ? 'text-primary-600' : 'text-surface-600 hover:text-primary-600'
        }`}
    >
      {children}
      <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-primary-500 transform origin-left transition-transform duration-300 ${isActive(to) ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
        }`}></span>
    </Link>
  );

  return (
    <nav className="sticky top-0 z-50 glass border-b border-surface-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center text-white font-bold shadow-lg shadow-primary-500/20 group-hover:scale-110 transition-transform duration-300">
                P
              </div>
              <span className="text-lg font-bold font-display text-surface-900 tracking-tight group-hover:text-primary-600 transition-colors">
                PARAKH
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:space-x-2">
              {user && (
                <>
                  {user.role === 'STUDENT' && (
                    <>
                      <NavLink to="/student/dashboard">Dashboard</NavLink>
                      <NavLink to="/student/exam">Exam</NavLink>
                      <NavLink to="/student/result">Results</NavLink>
                    </>
                  )}

                  {user.role === 'TEACHER' && (
                    <>
                      <NavLink to="/teacher/dashboard">Dashboard</NavLink>
                      <NavLink to="/teacher/questions">Question Bank</NavLink>
                      <NavLink to="/teacher/reports">Analytics & Reports</NavLink>
                    </>
                  )}

                  {user.role === 'ADMIN' && (
                    <>
                      <NavLink to="/admin/dashboard">Dashboard</NavLink>
                      <NavLink to="/admin/users">User Management</NavLink>
                      <NavLink to="/admin/stats">System Stats</NavLink>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-medium text-surface-900 leading-none">
                    {user.name}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-primary-600 tracking-wider mt-1">
                    {user.role}
                  </span>
                </div>
                <div className="h-8 w-px bg-surface-200 hidden sm:block"></div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                    </svg>
                  }
                >
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">Log In</Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">Get Started</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;