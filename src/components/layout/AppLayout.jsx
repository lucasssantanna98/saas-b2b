import React from 'react';
import { Sidebar } from './Sidebar';
import './AppLayout.css';

export const AppLayout = ({ children }) => {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};
