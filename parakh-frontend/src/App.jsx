import React from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';
import MainLayout from './layout/MainLayout';

// Component to conditionally apply layout based on route
const AppWithLayout = () => {
  const location = useLocation();
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/register';

  return isAuthRoute ? (
    <AppRoutes />
  ) : (
    <MainLayout>
      <AppRoutes />
    </MainLayout>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppWithLayout />
      </AuthProvider>
    </Router>
  );
}

export default App;
