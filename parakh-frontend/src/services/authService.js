import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:8081/api/auth';

export const login = async (email, password) => {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      // Store user in localStorage
      localStorage.setItem('user', JSON.stringify(data));
      return { success: true, user: data };
    } else {
      // If status is 403, it means not approved
      if (response.status === 403) {
        return { success: false, error: data || "Account pending approval." };
      }
      return { success: false, error: typeof data === 'string' ? data : 'Login failed' };
    }
  } catch (error) {
    return { success: false, error: 'Network error. Please try again later.' };
  }
};

export const register = async (name, email, password, role, institution) => {
  try {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password, role, institution }),
    });

    const data = await response.text(); // Backend returns string message

    if (response.ok) {
      return { success: true, message: data };
    } else {
      return { success: false, error: data };
    }
  } catch (error) {
    return { success: false, error: 'Registration failed. Please try again later.' };
  }
};

export const logout = () => {
  localStorage.removeItem('user');
};

export const getCurrentUser = () => {
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

export const isAuthenticated = () => {
  return getCurrentUser() !== null;
};