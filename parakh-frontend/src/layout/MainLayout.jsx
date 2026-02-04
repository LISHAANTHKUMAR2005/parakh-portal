import React from 'react';
import Navbar from './Navbar';


const MainLayout = ({ children }) => {
  return (
    <div className="h-screen flex flex-col bg-surface-50 overflow-hidden font-sans">
      <Navbar />
      <main className="flex-1 w-full h-full overflow-hidden relative">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;