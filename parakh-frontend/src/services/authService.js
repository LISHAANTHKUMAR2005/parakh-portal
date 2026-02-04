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

    if (response.ok) {
      const data = await response.json();
      // Store user in localStorage
      localStorage.setItem('user', JSON.stringify(data));
      return { success: true, user: data };
    } else {
      // Handle different error responses
      let errorMessage = 'Invalid credentials. Please check your email and password.';
      
      try {
        const errorData = await response.json();
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData && errorData.error) {
          errorMessage = errorData.error;
        } else if (response.status === 403) {
          errorMessage = errorData || "Account not approved. Please contact administrator.";
        }
      } catch (parseError) {
        // If response is not JSON, use default error message
        if (response.status === 403) {
          errorMessage = "Account not approved. Please contact administrator.";
        }
      }
      
      return { success: false, error: errorMessage };
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