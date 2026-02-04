import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Demo hardcoded login for review (replace with backend later)
const VALID_CREDENTIALS = [
  {
    email: 'lishaanthkumar05@gmail.com',
    password: 'Lishaanth@2005',
    role: 'ADMIN',
    name: 'Lishaanth Kumar'
  },
  {
    email: 'user@gmail.com',
    password: 'user@123',
    role: 'STUDENT',
    name: 'User'
  },
  {
    email: 'teacher@gmail.com',
    password: 'teacher@123',
    role: 'TEACHER',
    name: 'Teacher'
  }
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in on component mount
    const userData = getCurrentUser();
    if (userData) {
      setUser(userData);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      // Trim input values
      const trimmedEmail = email.trim();
      const trimmedPassword = password.trim();

      const response = await fetch('http://localhost:8081/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: trimmedEmail, password: trimmedPassword }),
      });

      if (response.ok) {
        const validUser = await response.json();

        // Set authenticated user state
        setUser(validUser);

        // Save session in localStorage
        localStorage.setItem('user', JSON.stringify(validUser));

        // Redirect based on role
        if (validUser.role === 'ADMIN') {
          navigate('/admin/dashboard', { replace: true });
        } else if (validUser.role === 'STUDENT') {
          navigate('/student/dashboard', { replace: true });
        } else if (validUser.role === 'TEACHER') {
          navigate('/teacher/dashboard', { replace: true });
        }

        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login', { replace: true });
  };

  const register = async (userData) => {
    try {
      const response = await fetch('http://localhost:8081/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        const result = await response.text();
        return { success: true, message: result };
      } else {
        const errorText = await response.text();
        return { success: false, error: errorText || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const value = {
    user,
    login,
    logout,
    register,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Helper function to get current user from localStorage
const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      return null;
    }
  }
  return null;
};
