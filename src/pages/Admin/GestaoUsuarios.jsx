import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { ShieldAlert, Users, Calendar, Store, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../../components/common/Modal';

export const GestaoUsuarios = () => {
  const [gestores, setGestores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const navigate = useNavigate();

  // Estados para o Modal de Criação
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);

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
    const { data: usersData, error: usersError } = await supabase.from('vw_gestores').select('*').order('created_at', { ascending: false });
    if (usersError) {
      console.error(usersError);
      setLoading(false);
      return;
    }
    const { data: lojasData } = await supabase.from('clientes').select('id, user_id');
    const gestoresComLojas = usersData.map(u => {
      const numLojas = lojasData ? lojasData.filter(l => l.user_id === u.id).length : 0;
      return { ...u, numLojas };
    });
    setGestores(gestoresComLojas);
    setLoading(false);
  };

  const handleCriarGestor = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    
    // ATENÇÃO: Ao criar um usuário pelo frontend, o Supabase loga na conta nova automaticamente.
    // Para manter a segurança sem expor chaves mestras, a solução é forçar o logout após a criação.
    const { error } = await supabase.auth.signUp({
      email: newEmail,
      password: newPassword,
    });

    if (error) {
      alert("Erro ao criar gestor: " + error.message);
      setIsCreating(false);
      return;
    }

    alert("Gestor criado com sucesso! Por segurança arquitetural, o sistema fará logout para você poder entregar o acesso ao consultor.");
    await supabase.auth.signOut();
    navigate('/login');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (!userEmail) return <div style={{ color: 'white', padding: '40px' }}>Verificando credenciais de Deus...</div>;

  return (
    <div style={{ padding: '0' }}>
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShieldAlert color="#f59e0b" size={32} />
            Painel do Super Administrador
          </h1>
          <p className="page-subtitle">Acesso restrito. Visão global de todos os gestores cadastrados no sistema.</p>
        </div>
        
        <button className="custom-btn" onClick={() => setIsModalOpen(true)} style={{ backgroundColor: 'var(--accent-blue, #3b82f6)', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> Cadastrar Novo Gestor
        </button>
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Cadastrar Novo Gestor">
        <form onSubmit={handleCriarGestor}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>E-mail do Gestor</label>
            <input 
              type="email" 
              className="form-input" 
              value={newEmail} 
              onChange={e => setNewEmail(e.target.value)} 
              placeholder="email@empresa.com"
              required 
              style={{ width: '100%', padding: '12px', backgroundColor: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px' }}
            />
          </div>
          
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Senha Provisória</label>
            <input 
              type="text" 
              className="form-input" 
              value={newPassword} 
              onChange={e => setNewPassword(e.target.value)} 
              placeholder="Mínimo 6 caracteres"
              minLength={6}
              required 
              style={{ width: '100%', padding: '12px', backgroundColor: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px' }}
            />
          </div>
          
          <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)} style={{ padding: '8px 16px', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={isCreating} style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              {isCreating ? 'Criando...' : 'Criar Gestor'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
