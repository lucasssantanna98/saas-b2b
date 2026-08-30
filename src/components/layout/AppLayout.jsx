import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Menu, X } from 'lucide-react';
import './AppLayout.css';

export const AppLayout = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="app-layout">
      {/* Mobile Header */}
      <div className="mobile-header">
        <h2 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold' }}>Sant'Anna</span>
          <span style={{ color: '#3b82f6', marginLeft: '4px' }}>Analytics</span>
        </h2>
        <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={24} color="white" /> : <Menu size={24} color="white" />}
        </button>
      </div>

      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      
      {/* Overlay for mobile when menu is open */}
      {isMobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      <main className="main-content">
        {children}
      </main>
    </div>
  );
};
