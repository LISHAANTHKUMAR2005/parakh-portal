import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/ui/Button';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col z-50 relative font-sans">
      {/* Top Strip - Government / Ministry */}
      <div className="bg-black text-white px-4 sm:px-6 lg:px-8 py-1.5 flex justify-between items-center text-[10px] md:text-xs font-bold uppercase tracking-widest leading-none">
        <div className="flex gap-4">
          <span>Government of India</span>
          <span className="hidden sm:inline opacity-50">|</span>
          <span className="hidden sm:inline">Ministry of Education</span>
        </div>
        <div className="flex gap-4">
          <span>Skip to Main Content</span>
          <span className="opacity-50">|</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-white"></span> Screen Reader Access</span>
        </div>
      </div>

      {/* Main Header */}
      <nav className="bg-white border-b-4 border-primary-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center gap-4">
              {/* Emblem Placeholder */}
              <Link to="/" className="flex items-center gap-4 group">
                <div className="flex flex-col items-center justify-center w-12 h-16 opacity-80">
                  <div className="w-8 h-8 rounded-full border-2 border-surface-900 mb-1"></div>
                  <div className="w-10 h-1 bg-surface-900 mb-1"></div>
                  <div className="text-[8px] font-bold uppercase">Satyamev Jayate</div>
                </div>
                <div className="flex flex-col justify-center border-l border-surface-300 pl-4 h-12">
                  <span className="text-2xl font-bold text-primary-900 tracking-tight leading-none group-hover:text-primary-800">
                    PARAKH
                  </span>
                  <span className="text-xs font-semibold text-surface-600 uppercase tracking-wider leading-none mt-1">
                    National Assessment Centre
                  </span>
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-6">
              {user ? (
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-bold text-surface-900">{user.name}</div>
                    <div className="text-xs text-surface-500 uppercase tracking-wide bg-surface-100 px-1 inline-block mt-0.5">{user.role}</div>
                  </div>
                  <div className="h-10 w-px bg-surface-200 hidden sm:block"></div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="border-red-200 text-red-700 hover:bg-red-50 text-xs uppercase font-bold tracking-wide"
                  >
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link to="/login" className="text-sm font-bold text-primary-900 hover:underline uppercase tracking-wide">
                    Login
                  </Link>
                  <Link to="/register">
                    <Button variant="primary" size="sm" className="bg-primary-900 hover:bg-primary-800 text-xs uppercase font-bold tracking-wide rounded-sm">Register</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;