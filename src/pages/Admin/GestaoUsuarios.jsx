import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { ShieldAlert, Users, Calendar, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const GestaoUsuarios = () => {
  const [gestores, setGestores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.email !== 'lucass.santanna98@gmail.com') {
      navigate('/dashboard'); // Expulsa invasores
      return;
    }
    setUserEmail(user.email);
    fetchGestores();
  };

  const fetchGestores = async () => {
    setLoading(true);
    
    // Busca a lista de e-mails da view secreta
    const { data: usersData, error: usersError } = await supabase.from('vw_gestores').select('*').order('created_at', { ascending: false });
    
    if (usersError) {
      console.error(usersError);
      setLoading(false);
      return;
    }

    // Busca a contagem de lojas por gestor
    const { data: lojasData } = await supabase.from('clientes').select('id, user_id');
    
    // Mescla os dados
    const gestoresComLojas = usersData.map(u => {
      const numLojas = lojasData ? lojasData.filter(l => l.user_id === u.id).length : 0;
      return { ...u, numLojas };
    });

    setGestores(gestoresComLojas);
    setLoading(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (!userEmail) return <div style={{ color: 'white', padding: '40px' }}>Verificando credenciais de Deus...</div>;

  return (
    <div style={{ padding: '0' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldAlert color="#f59e0b" size={32} />
          Painel do Super Administrador
        </h1>
        <p className="page-subtitle">Acesso restrito. Visão global de todos os gestores cadastrados no sistema.</p>
      </header>

      <div className="metrics-grid" style={{ marginBottom: '32px' }}>
        <div className="metric-card glass-panel" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="metric-header">
            <span className="metric-title">Total de Gestores</span>
            <Users size={20} color="#f59e0b" />
          </div>
          <div className="metric-value">{gestores.length}</div>
        </div>
        
        <div className="metric-card glass-panel" style={{ borderLeft: '4px solid #3b82f6' }}>
          <div className="metric-header">
            <span className="metric-title">Total de Lojas no Sistema</span>
            <Store size={20} color="#3b82f6" />
          </div>
          <div className="metric-value">{gestores.reduce((acc, curr) => acc + curr.numLojas, 0)}</div>
        </div>
      </div>

      <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white' }}>
          <thead>
            <tr>
              <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}>E-mail do Gestor</th>
              <th style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}>Lojas Gerenciadas</th>
              <th style={{ padding: '16px', textAlign: 'right', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}>Data de Cadastro</th>
              <th style={{ padding: '16px', textAlign: 'right', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}>Último Acesso</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ padding: '24px', textAlign: 'center' }}>Carregando dados globais...</td></tr>
            ) : (
              gestores.map(g => (
                <tr key={g.id}>
                  <td style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {g.email === 'lucass.santanna98@gmail.com' ? <ShieldAlert size={16} color="#f59e0b" title="Super Admin" /> : <Users size={16} color="#94a3b8" />}
                    <span style={{ fontWeight: g.email === 'lucass.santanna98@gmail.com' ? 'bold' : 'normal', color: g.email === 'lucass.santanna98@gmail.com' ? '#f59e0b' : 'white' }}>
                      {g.email}
                    </span>
                  </td>
                  <td style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                    <span style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', padding: '4px 12px', borderRadius: '12px', color: '#60a5fa', fontWeight: 'bold' }}>
                      {g.numLojas}
                    </span>
                  </td>
                  <td style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'right', color: 'var(--text-secondary)' }}>
                    {formatDate(g.created_at)}
                  </td>
                  <td style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'right', color: 'var(--text-secondary)' }}>
                    {formatDate(g.last_sign_in_at)}
                  </td>
                </tr>
              ))
            )}
            {gestores.length === 0 && !loading && (
              <tr><td colSpan={4} style={{ padding: '24px', textAlign: 'center' }}>Nenhum usuário encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
