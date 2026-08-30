import React from 'react';
import { Settings } from 'lucide-react';

export const Configuracoes = () => {
  return (
    <div style={{ padding: '0' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Settings color="#3b82f6" size={32} />
          Configurações do Sistema
        </h1>
        <p className="page-subtitle">Em breve, você poderá configurar notificações, integrações e perfil da empresa por aqui.</p>
      </header>

      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', marginTop: '20px' }}>
        <Settings size={48} color="rgba(255,255,255,0.2)" style={{ marginBottom: '16px' }} />
        <h2 style={{ color: 'white', marginBottom: '8px' }}>Módulo em Desenvolvimento</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Estamos construindo as opções avançadas para personalizar sua experiência.</p>
      </div>
    </div>
  );
};
