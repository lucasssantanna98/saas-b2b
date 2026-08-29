import React from 'react';
import { MetricCard } from '../../components/dashboard/MetricCard';
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
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1 className="page-title">Visão Consolidada</h1>
          <p className="text-secondary">Acompanhamento financeiro de todas as lojas - Junho</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary">+ Novo Cliente</button>
        </div>
      </header>

      <div className="metrics-grid">
        <MetricCard 
          title="Faturamento Bruto" 
          value="R$ 75.000,00" 
          trend="up" 
          trendValue="12.5%" 
          subtitle="vs mês anterior" 
          icon="💰" 
        />
        <MetricCard 
          title="Margem de Contribuição" 
          value="35.2%" 
          trend="up" 
          trendValue="2.1%" 
          subtitle="vs mês anterior" 
          icon="📊" 
        />
        <MetricCard 
          title="Ponto de Equilíbrio" 
          value="R$ 22.450,00" 
          subtitle="Custo fixo consolidado coberto" 
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
    </div>
  );
}
