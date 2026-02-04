import React from 'react';
import Navbar from './Navbar';


const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-surface-50">
      <Navbar />
      <main className="w-full">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;