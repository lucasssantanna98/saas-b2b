import React, { useState } from 'react';
import { MetricCard } from '../../components/dashboard/MetricCard';
import { Modal } from '../../components/common/Modal';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import './DashboardGestor.css';

const dreData = [
  { mes: 'Jan', faturamento: 45000, lucro: 12000 },
  { mes: 'Fev', faturamento: 52000, lucro: 15000 },
  { mes: 'Mar', faturamento: 48000, lucro: 11000 },
  { mes: 'Abr', faturamento: 61000, lucro: 18000 },
  { mes: 'Mai', faturamento: 59000, lucro: 16000 },
  { mes: 'Jun', faturamento: 75000, lucro: 24000 },
];

export function DashboardGestor() {
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [visaoAtual, setVisaoAtual] = useState('consolidada'); // 'consolidada' ou id do cliente

  const handleSalvarCliente = (e) => {
    e.preventDefault();
    // Aqui no futuro chamaremos o Supabase
    alert('Cliente salvo com sucesso! (Integração com BD em breve)');
    setIsClientModalOpen(false);
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <div className="header-title-row">
            <h1 className="page-title">
              {visaoAtual === 'consolidada' ? 'Visão Consolidada' : 'Visão do Lojista'}
            </h1>
            <select 
              className="view-selector" 
              value={visaoAtual} 
              onChange={(e) => setVisaoAtual(e.target.value)}
            >
              <option value="consolidada">Todas as Lojas (Consolidado)</option>
              <option value="loja1">Loja Exemplo (Mercado Livre)</option>
            </select>
          </div>
          <p className="text-secondary">
            {visaoAtual === 'consolidada' 
              ? 'Acompanhamento financeiro de todas as lojas - Junho'
              : 'Analisando os resultados individuais da Loja Exemplo'}
          </p>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => setIsClientModalOpen(true)}>
            + Novo Cliente
          </button>
        </div>
      </header>

      <div className="metrics-grid">
        <MetricCard 
          title="Faturamento Bruto" 
          value={visaoAtual === 'consolidada' ? "R$ 75.000,00" : "R$ 15.000,00"} 
          trend="up" 
          trendValue={visaoAtual === 'consolidada' ? "12.5%" : "5.0%"} 
          subtitle="vs mês anterior" 
          icon="💰" 
        />
        <MetricCard 
          title="Margem de Contribuição" 
          value={visaoAtual === 'consolidada' ? "35.2%" : "42.1%"} 
          trend="up" 
          trendValue="2.1%" 
          subtitle="vs mês anterior" 
          icon="📊" 
        />
        <MetricCard 
          title="Ponto de Equilíbrio" 
          value={visaoAtual === 'consolidada' ? "R$ 22.450,00" : "R$ 4.200,00"} 
          subtitle="Custo fixo coberto" 
          icon="⚖️" 
        />
        <MetricCard 
          title="Markup Médio" 
          value="2.1x" 
          trend="down" 
          trendValue="0.1x" 
          subtitle="Precificação" 
          icon="📈" 
        />
      </div>

      <div className="charts-section">
        <div className="chart-card glass-panel">
          <h3 className="chart-title">Evolução de Faturamento vs Lucro Líquido</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={dreData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorFat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-green)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--accent-green)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="mes" 
                  stroke="var(--text-secondary)" 
                  tick={{fill: 'var(--text-secondary)'}}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  stroke="var(--text-secondary)"
                  tick={{fill: 'var(--text-secondary)'}}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `R$ ${value/1000}k`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-secondary)', 
                    border: 'var(--glass-border)', 
                    borderRadius: '8px',
                    boxShadow: 'var(--glass-shadow)',
                    color: 'var(--text-primary)'
                  }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="faturamento" 
                  name="Faturamento Bruto"
                  stroke="var(--accent-blue)" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorFat)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="lucro" 
                  name="Lucro Líquido"
                  stroke="var(--accent-green)" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorLucro)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Modal de Novo Cliente */}
      <Modal 
        isOpen={isClientModalOpen} 
        onClose={() => setIsClientModalOpen(false)}
        title="Cadastrar Novo Cliente"
      >
        <form onSubmit={handleSalvarCliente}>
          <div className="form-group">
            <label>Razão Social</label>
            <input type="text" className="form-input" placeholder="Ex: Empresa Silva LTDA" required />
          </div>
          <div className="form-group">
            <label>Nome da Loja (Mercado Livre)</label>
            <input type="text" className="form-input" placeholder="Ex: SILVA SHOP" required />
          </div>
          <div className="form-group">
            <label>CNPJ</label>
            <input type="text" className="form-input" placeholder="00.000.000/0001-00" required />
          </div>
          
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsClientModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Salvar Cliente
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
