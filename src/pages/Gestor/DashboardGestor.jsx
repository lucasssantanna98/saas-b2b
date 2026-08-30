import React, { useState, useEffect, useRef } from 'react';
import { MetricCard } from '../../components/dashboard/MetricCard';
import { Modal } from '../../components/common/Modal';
import { DreTable } from '../../components/dashboard/DreTable';
import { DreModal } from '../../components/dashboard/DreModal';
import { supabase } from '../../services/supabase';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import ReactMarkdown from 'react-markdown';
import { useReactToPrint } from 'react-to-print';
import { gerarConsultoriaCFO } from '../../services/ai';
import './DashboardGestor.css';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

export function DashboardGestor() {
  const [visaoAtual, setVisaoAtual] = useState('consolidada'); 
  const [mesFiltro, setMesFiltro] = useState('todos');
  const [clientes, setClientes] = useState([]);
  const [lancamentos, setLancamentos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // States: Modal Cliente
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editandoClienteId, setEditandoClienteId] = useState(null);
  const [razaoSocial, setRazaoSocial] = useState('');
  const [nomeLoja, setNomeLoja] = useState('');
  const [cnpj, setCnpj] = useState('');

  // States: Modal DRE Completo
  const [isDreModalOpen, setIsDreModalOpen] = useState(false);

  // States: IA CFO
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;

  // Ref para impressão de PDF
  const printRef = useRef();
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: 'Relatorio_Consultoria_SaaS',
  });

  useEffect(() => {
    fetchClientes();
    fetchLancamentos();
  }, []);

  const fetchClientes = async () => {
    try {
      const { data, error } = await supabase.from('clientes').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setClientes(data);
    } catch (error) {
      console.error('Erro clientes:', error.message);
    }
  };

  const fetchLancamentos = async () => {
    try {
      const { data, error } = await supabase.from('dre_mensal').select('*').order('mes_referencia', { ascending: true });
      if (error && error.code !== '42P01') throw error;
      if (data) setLancamentos(data);
    } catch (error) {
      console.error('Erro lançamentos:', error.message);
    }
  };

  // Pega os meses únicos que existem no banco para montar o dropdown
  const mesesDisponiveis = [...new Set(lancamentos.map(l => l.mes_referencia))].sort().reverse();

  // ==========================================
  // MOTOR DE CÁLCULOS E GRÁFICOS
  // ==========================================
  const calcularMetricas = () => {
    // FILTROS
    let dados = lancamentos;
    if (visaoAtual !== 'consolidada') {
      dados = dados.filter(l => l.cliente_id === visaoAtual);
    }
    
    // Para os cards e tabela, filtra pelo mês se não for 'todos'
    let dadosFiltradosMes = dados;
    if (mesFiltro !== 'todos') {
      dadosFiltradosMes = dados.filter(l => l.mes_referencia === mesFiltro);
    }

    // 1. SOMA DOS CARDS E TABELA
    const soma = dadosFiltradosMes.reduce((acc, curr) => {
      Object.keys(acc).forEach(key => {
        acc[key] += Number(curr[key] || 0);
      });
      return acc;
    }, {
      vendas_cartao: 0, vendas_pix_dinheiro: 0,
      taxas_maquininha: 0, impostos_vendas: 0,
      custo_mercadorias: 0,
      despesas_ponto: 0, folha_pagamento: 0, despesas_gerais: 0,
      impostos_ir_csll: 0, pro_labore: 0
    });

    soma.receitaBruta = soma.vendas_cartao + soma.vendas_pix_dinheiro;
    soma.totalDeducoes = soma.taxas_maquininha + soma.impostos_vendas;
    soma.receitaLiquida = soma.receitaBruta - soma.totalDeducoes;
    
    soma.totalCustos = soma.custo_mercadorias;
    soma.lucroBruto = soma.receitaLiquida - soma.totalCustos;
    
    soma.totalDespesasOp = soma.despesas_ponto + soma.folha_pagamento + soma.despesas_gerais;
    soma.totalProvisoes = soma.impostos_ir_csll + soma.pro_labore;
    
    soma.lucroLiquido = soma.lucroBruto - soma.totalDespesasOp - soma.totalProvisoes;
    soma.lair = soma.lucroBruto - soma.totalDespesasOp;

    let margemLiquida = 0;
    if (soma.receitaBruta > 0) margemLiquida = (soma.lucroLiquido / soma.receitaBruta) * 100;

    // A Fórmula correta do Ponto de Equilíbrio (PE) sobre o Faturamento Bruto:
    // 1. Custos Variáveis = Deduções (Taxas, Impostos) + CMV
    const custosVariaveisTotais = soma.totalDeducoes + soma.totalCustos;
    
    // 2. Margem de Contribuição (R$) = Receita Bruta - Custos Variáveis
    const margemContribuicao = soma.receitaBruta - custosVariaveisTotais;
    
    // 3. Índice da Margem de Contribuição (IMC) = MC / Receita Bruta
    let imc = soma.receitaBruta > 0 ? (margemContribuicao / soma.receitaBruta) : 0;
    
    // 4. Ponto de Equilíbrio = Custos Fixos Totais / IMC
    let pontoEquilibrio = imc > 0 ? (soma.totalDespesasOp / imc) : 0;

    // 2. DADOS PRO GRÁFICO DE PIZZA (Raio-X de Custos)
    const dadosRaioX = [
      { name: 'Lucro Líquido', value: soma.lucroLiquido > 0 ? soma.lucroLiquido : 0 },
      { name: 'Taxas e Impostos', value: soma.totalDeducoes },
      { name: 'Custo Mercadoria', value: soma.totalCustos },
      { name: 'Despesas Fixas', value: soma.totalDespesasOp },
      { name: 'Pró-Labore e IR', value: soma.totalProvisoes },
    ].filter(d => d.value > 0); 

    // 3. DADOS PRO GRÁFICO DE BARRAS (Histórico do Cliente)
    const historicoMensal = [];
    if (visaoAtual !== 'consolidada') {
      const mesesDoCliente = [...new Set(dados.map(l => l.mes_referencia))].sort();
      mesesDoCliente.forEach(mes => {
        const lancamentosDoMes = dados.filter(l => l.mes_referencia === mes);
        const faturamento = lancamentosDoMes.reduce((acc, curr) => acc + Number(curr.vendas_cartao) + Number(curr.vendas_pix_dinheiro), 0);
        
        let lucro = 0;
        lancamentosDoMes.forEach(l => {
          const recLiquida = (Number(l.vendas_cartao) + Number(l.vendas_pix_dinheiro)) - Number(l.taxas_maquininha) - Number(l.impostos_vendas);
          lucro += recLiquida - Number(l.custo_mercadorias) - Number(l.despesas_ponto) - Number(l.folha_pagamento) - Number(l.despesas_gerais) - Number(l.impostos_ir_csll) - Number(l.pro_labore);
        });

        historicoMensal.push({
          mes: mes.substring(5,7) + '/' + mes.substring(2,4),
          Faturamento: faturamento,
          Lucro: lucro
        });
      });
    }

    // 4. DADOS PRO GRÁFICO DE PONTO DE EQUILÍBRIO (Intersecção)
    const dadosPontoEquilibrio = [];
    if (soma.receitaBruta > 0 && pontoEquilibrio > 0) {
      // Cria uma escala do faturamento (do 0 até 20% acima do atual ou do PE)
      const maxFaturamento = Math.max(soma.receitaBruta, pontoEquilibrio) * 1.2;
      const step = maxFaturamento / 10; // 10 pontos na linha
      
      const percCV = custosVariaveisTotais / soma.receitaBruta; // % de Custo Variável
      
      for (let i = 0; i <= 10; i++) {
        const xFaturamento = i * step;
        const yCustoTotal = soma.totalDespesasOp + (xFaturamento * percCV); // Custo Fixo + (Faturamento * %)
        const yMargemContribuicao = xFaturamento * imc; // Faturamento * Índice de Margem
        
        dadosPontoEquilibrio.push({
          nome: formatCurrency(xFaturamento).replace(',00', ''), // Omit decimals for compact x-axis
          FaturamentoBruto: xFaturamento,
          CustosTotais: yCustoTotal,
          MargemContribuicao: yMargemContribuicao
        });
      }
    }

    return {
      dadosDRE: soma,
      dadosRaioX,
      historicoMensal,
      dadosPontoEquilibrio,
      cards: {
        faturamentoBruto: formatCurrency(soma.receitaBruta),
        custosVariaveis: formatCurrency(soma.totalDeducoes + soma.totalCustos),
        custosFixos: formatCurrency(soma.totalDespesasOp),
        lucroBruto: formatCurrency(soma.lucroBruto),
        lucroLiquido: formatCurrency(soma.lucroLiquido),
        margemLiquida: `${margemLiquida.toFixed(1)}%`,
        pontoEquilibrio: formatCurrency(pontoEquilibrio)
      }
    };
  };

  const metricas = calcularMetricas();

  // ==========================================
  // HANDLERS
  // ==========================================
  const abrirModalEditarCliente = () => {
    const cliente = clientes.find(c => c.id === visaoAtual);
    if (cliente) {
      setEditandoClienteId(cliente.id);
      setRazaoSocial(cliente.razao_social);
      setNomeLoja(cliente.nome_loja_ml);
      setCnpj(cliente.cnpj);
      setIsClientModalOpen(true);
    }
  };

  const abrirModalNovoCliente = () => {
    setEditandoClienteId(null);
    setRazaoSocial('');
    setNomeLoja('');
    setCnpj('');
    setIsClientModalOpen(true);
  };

  const handleSalvarCliente = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload = { razao_social: razaoSocial, nome_loja_ml: nomeLoja, cnpj, status: 'ativo' };
      if (editandoClienteId) {
        await supabase.from('clientes').update(payload).eq('id', editandoClienteId);
        setClientes(clientes.map(c => c.id === editandoClienteId ? { ...c, ...payload } : c));
      } else {
        const { data } = await supabase.from('clientes').insert([payload]).select();
        if (data) {
          setClientes([data[0], ...clientes]);
          setVisaoAtual(data[0].id);
        }
      }
      setIsClientModalOpen(false);
    } catch (error) {
      alert('Erro ao salvar loja física.');
    } finally {
      setIsLoading(false);
    }
  };

  const getClientNameById = (id) => {
    const cliente = clientes.find(c => c.id === id);
    return cliente ? cliente.nome_loja_ml : 'Loja Desconhecida';
  };

  // Lógica do Botão de Lançar/Editar
  const btnDreText = mesFiltro !== 'todos' ? `✏️ Editar DRE (${mesFiltro})` : '💵 Lançar Novo DRE';
  // O modal vai puxar o lançamento especificamente do mes selecionado (se houver)
  const lancamentoModalAtual = (mesFiltro !== 'todos' && visaoAtual !== 'consolidada') 
    ? (lancamentos.find(l => l.cliente_id === visaoAtual && l.mes_referencia === mesFiltro) || null)
    : null;

  const abrirModalDre = () => {
    if (visaoAtual === 'consolidada') {
      alert('Selecione uma loja específica para lançar o DRE.');
      return;
    }
    setIsDreModalOpen(true);
  };

  const handleGerarConsultoria = async () => {
    if (!geminiKey) {
      alert("Aviso: Chave VITE_GEMINI_API_KEY não configurada no arquivo .env.local!");
      return;
    }
    setAiLoading(true);
    setAiResponse(null);
    try {
      const response = await gerarConsultoriaCFO(metricas.dadosDRE, geminiKey);
      setAiResponse(response);
    } catch (error) {
      alert(error.message);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="dashboard-container" ref={printRef}>
      <header className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px', marginBottom: '32px' }}>
        <div style={{ flex: 1 }}>
          <h1 className="page-title" style={{ margin: 0, fontSize: '2rem' }}>
            {visaoAtual === 'consolidada' ? 'Visão Consolidada' : getClientNameById(visaoAtual)}
          </h1>
          <p className="text-secondary" style={{ marginTop: '8px' }}>
            Métricas calculadas com base no período selecionado.
          </p>

          <div className="filters-container">
            <select className="custom-select" value={visaoAtual} onChange={(e) => setVisaoAtual(e.target.value)}>
              <option value="consolidada">🏢 Todas as Lojas (Consolidado)</option>
              {clientes.map(cliente => (
                <option key={cliente.id} value={cliente.id}>🏪 {cliente.nome_loja_ml}</option>
              ))}
            </select>

            <select className="custom-select" value={mesFiltro} onChange={(e) => setMesFiltro(e.target.value)}>
              <option value="todos">📅 Todos os Meses (Soma)</option>
              {mesesDisponiveis.map(mes => (
                <option key={mes} value={mes}>📅 {mes}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
          {visaoAtual !== 'consolidada' && (
            <>
              <button className="custom-btn" onClick={abrirModalDre} style={{ backgroundColor: 'var(--accent-green, #10b981)', color: '#fff' }}>
                {btnDreText}
              </button>
              <button className="custom-btn" onClick={abrirModalEditarCliente} style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff' }}>
                ✏️ Editar Loja
              </button>
            </>
          )}
          <button className="custom-btn" onClick={abrirModalNovoCliente} style={{ backgroundColor: 'var(--accent-blue, #3b82f6)', color: '#fff' }}>
            + Novo Estabelecimento
          </button>
          
          <button className="custom-btn" onClick={handlePrint} style={{ backgroundColor: '#f59e0b', color: '#fff' }}>
            📄 Gerar PDF Executivo
          </button>
        </div>
      </header>

      <div className="metrics-grid">
        <MetricCard title="Vendas Totais" value={metricas.cards.faturamentoBruto} subtitle="Receita Bruta" icon="💰" />
        <MetricCard title="Custos Variáveis" value={metricas.cards.custosVariaveis} subtitle="Taxas + Impostos + CMV" icon="📉" />
        <MetricCard title="Custos Fixos" value={metricas.cards.custosFixos} subtitle="Operação da Loja" icon="🏢" />
        <MetricCard title="Lucro Bruto" value={metricas.cards.lucroBruto} subtitle="Antes dos custos fixos" icon="📊" />
        <MetricCard title="Ponto de Equilíbrio" value={metricas.cards.pontoEquilibrio} subtitle="Meta Mínima" icon="⚖️" />
        <MetricCard title="Lucro Líquido Final" value={metricas.cards.lucroLiquido} subtitle={`Margem: ${metricas.cards.margemLiquida}`} icon="💎" />
      </div>

      {/* ABA DE GRÁFICOS BI (Só aparece para lojas específicas) */}
      {visaoAtual !== 'consolidada' && metricas.historicoMensal.length > 0 && (
        <div className="charts-section">
          <div className="charts-row">
            
            {/* Gráfico 1: Raio X */}
            <div className="chart-card glass-panel">
              <h3 className="chart-title">Raio-X de Custos ({mesFiltro === 'todos' ? 'Acumulado' : mesFiltro})</h3>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={metricas.dadosRaioX} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                      {metricas.dadosRaioX.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: 'none', borderRadius: '8px', color: '#fff' }} />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico 2: Evolução */}
            <div className="chart-card glass-panel">
              <h3 className="chart-title">Evolução de Lucro vs Receita</h3>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metricas.historicoMensal} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="mes" stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)'}} axisLine={false} tickLine={false} />
                    <YAxis stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)'}} axisLine={false} tickLine={false} tickFormatter={(value) => `R$ ${value/1000}k`} />
                    <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: 'none', borderRadius: '8px', color: '#fff' }} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                    <Legend />
                    <Bar dataKey="Faturamento" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Lucro" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Gráfico 3: Ponto de Equilíbrio */}
          <div className="chart-card glass-panel" style={{ marginTop: '24px' }}>
            <h3 className="chart-title">Análise do Ponto de Equilíbrio (Break-Even)</h3>
            <p className="text-secondary" style={{ marginBottom: '16px', fontSize: '0.9rem' }}>
              Ponto exato (cruzamento das linhas) onde o lucro cobre as despesas fixas.
            </p>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={metricas.dadosPontoEquilibrio} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="nome" stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)', fontSize: 12}} />
                  <YAxis stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)', fontSize: 12}} tickFormatter={(val) => `R$ ${val/1000}k`} />
                  <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                  <Legend verticalAlign="top" height={36}/>
                  <Line type="monotone" dataKey="FaturamentoBruto" name="Faturamento (Receita)" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="CustosTotais" name="Custos Totais (Fixo + Variável)" stroke="#ef4444" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="MargemContribuicao" name="Margem de Contribuição" stroke="#3b82f6" strokeWidth={3} strokeDasharray="5 5" dot={false} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Seção IA - CFO Virtual */}
          <div className="chart-card glass-panel ai-section-print" style={{ marginTop: '24px', border: '1px solid #8b5cf6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
              <h3 className="chart-title" style={{ color: '#8b5cf6', margin: 0 }}>🤖 Consultoria Financeira com IA (CFO Virtual)</h3>
              <button className="custom-btn" onClick={handleGerarConsultoria} disabled={aiLoading || metricas.dadosDRE.receitaBruta === 0} style={{ backgroundColor: '#8b5cf6', color: '#fff' }}>
                {aiLoading ? 'Analisando números...' : 'Gerar Relatório'}
              </button>
            </div>
            
            {aiResponse && (
              <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '24px', borderRadius: '8px', lineHeight: '1.6', fontSize: '0.95rem' }}>
                <ReactMarkdown>{aiResponse}</ReactMarkdown>
              </div>
            )}
            
            {!aiResponse && !aiLoading && (
              <p className="text-secondary" style={{fontSize: '0.95rem'}}>Clique no botão acima para que nossa Inteligência Artificial analise a saúde financeira da loja, avalie o impacto das taxas de maquininha atuais e crie um plano de ação automatizado.</p>
            )}
          </div>

        </div>
      )}

      {/* TABELA DRE */}
      <div className="charts-section">
        <DreTable dados={metricas.dadosDRE} />
      </div>

      {/* Modais */}
      <Modal isOpen={isClientModalOpen} onClose={() => setIsClientModalOpen(false)} title={editandoClienteId ? "Editar Estabelecimento" : "Cadastrar Nova Loja Física"}>
        <form onSubmit={handleSalvarCliente}>
          <div className="form-group"><label>Razão Social</label><input type="text" className="form-input" value={razaoSocial} onChange={e => setRazaoSocial(e.target.value)} required /></div>
          <div className="form-group"><label>Nome Fantasia / Placa da Loja</label><input type="text" className="form-input" value={nomeLoja} onChange={e => setNomeLoja(e.target.value)} required /></div>
          <div className="form-group"><label>CNPJ</label><input type="text" className="form-input" value={cnpj} onChange={e => setCnpj(e.target.value)} required /></div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsClientModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={isLoading}>{isLoading ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </Modal>

      <DreModal 
        isOpen={isDreModalOpen} 
        onClose={() => setIsDreModalOpen(false)}
        clienteId={visaoAtual}
        lancamentoAtual={lancamentoModalAtual}
        onSalvarSucesso={fetchLancamentos}
      />
    </div>
  );
}
