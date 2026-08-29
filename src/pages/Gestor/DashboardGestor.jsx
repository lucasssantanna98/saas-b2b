import React, { useState, useEffect } from 'react';
import { MetricCard } from '../../components/dashboard/MetricCard';
import { Modal } from '../../components/common/Modal';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { supabase } from '../../services/supabase';
import './DashboardGestor.css';

// Formata moeda BR
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export function DashboardGestor() {
  const [visaoAtual, setVisaoAtual] = useState('consolidada'); 
  const [clientes, setClientes] = useState([]);
  const [lancamentos, setLancamentos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // States: Modal Cliente
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editandoClienteId, setEditandoClienteId] = useState(null);
  const [razaoSocial, setRazaoSocial] = useState('');
  const [nomeLoja, setNomeLoja] = useState('');
  const [cnpj, setCnpj] = useState('');

  // States: Modal DRE
  const [isDreModalOpen, setIsDreModalOpen] = useState(false);
  const [mesReferencia, setMesReferencia] = useState('2026-06');
  const [faturamentoBruto, setFaturamentoBruto] = useState(0);
  const [devolucoes, setDevolucoes] = useState(0);
  const [taxasMl, setTaxasMl] = useState(0);
  const [cmv, setCmv] = useState(0);
  const [custosFixos, setCustosFixos] = useState(0);
  const [custosVariaveis, setCustosVariaveis] = useState(0);

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
      const { data, error } = await supabase.from('dre_mensal').select('*');
      if (error && error.code !== '42P01') throw error; // Ignora se a tabela não existir ainda
      if (data) setLancamentos(data);
    } catch (error) {
      console.error('Erro lançamentos:', error.message);
    }
  };

  // ==========================================
  // MOTOR DE CÁLCULOS DRE
  // ==========================================
  const calcularMetricas = () => {
    let dadosFiltrados = lancamentos;
    if (visaoAtual !== 'consolidada') {
      dadosFiltrados = lancamentos.filter(l => l.cliente_id === visaoAtual);
    }

    // Soma tudo
    const soma = dadosFiltrados.reduce((acc, curr) => ({
      faturamentoBruto: acc.faturamentoBruto + Number(curr.faturamento_bruto || 0),
      devolucoes: acc.devolucoes + Number(curr.devolucoes || 0),
      taxasMl: acc.taxasMl + Number(curr.taxas_ml || 0),
      cmv: acc.cmv + Number(curr.cmv || 0),
      custosFixos: acc.custosFixos + Number(curr.custos_fixos || 0),
      custosVariaveis: acc.custosVariaveis + Number(curr.custos_variaveis || 0),
    }), { faturamentoBruto: 0, devolucoes: 0, taxasMl: 0, cmv: 0, custosFixos: 0, custosVariaveis: 0 });

    const faturamentoLiquido = soma.faturamentoBruto - soma.devolucoes - soma.taxasMl;
    const margemContribuicao = faturamentoLiquido - soma.cmv - soma.custosVariaveis;
    
    let margemPercentual = 0;
    if (faturamentoLiquido > 0) {
      margemPercentual = (margemContribuicao / faturamentoLiquido) * 100;
    }

    let pontoEquilibrio = 0;
    if (margemPercentual > 0) {
      pontoEquilibrio = soma.custosFixos / (margemPercentual / 100);
    }

    let markup = 0;
    const custoTotalProduto = soma.cmv;
    if (custoTotalProduto > 0) {
      markup = soma.faturamentoBruto / custoTotalProduto;
    }

    return {
      faturamentoBrutoFormatado: formatCurrency(soma.faturamentoBruto),
      margemContribuicaoFormatada: `${margemPercentual.toFixed(1)}%`,
      pontoEquilibrioFormatado: formatCurrency(pontoEquilibrio),
      markupFormatado: `${markup.toFixed(2)}x`
    };
  };

  const metricas = calcularMetricas();

  // ==========================================
  // HANDLERS DE AÇÃO
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

  const abrirModalDre = () => {
    // Busca se já tem lançamento pro mes pra preencher (Simplificado: só limpa ou puxa o último)
    const lancamentoCliente = lancamentos.find(l => l.cliente_id === visaoAtual && l.mes_referencia === mesReferencia);
    if (lancamentoCliente) {
      setFaturamentoBruto(lancamentoCliente.faturamento_bruto);
      setDevolucoes(lancamentoCliente.devolucoes);
      setTaxasMl(lancamentoCliente.taxas_ml);
      setCmv(lancamentoCliente.cmv);
      setCustosFixos(lancamentoCliente.custos_fixos);
      setCustosVariaveis(lancamentoCliente.custos_variaveis);
    } else {
      setFaturamentoBruto(0); setDevolucoes(0); setTaxasMl(0); setCmv(0); setCustosFixos(0); setCustosVariaveis(0);
    }
    setIsDreModalOpen(true);
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
      alert('Erro ao salvar cliente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSalvarDre = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload = {
        cliente_id: visaoAtual,
        mes_referencia: mesReferencia,
        faturamento_bruto: Number(String(faturamentoBruto).replace(',', '.')),
        devolucoes: Number(String(devolucoes).replace(',', '.')),
        taxas_ml: Number(String(taxasMl).replace(',', '.')),
        cmv: Number(String(cmv).replace(',', '.')),
        custos_fixos: Number(String(custosFixos).replace(',', '.')),
        custos_variaveis: Number(String(custosVariaveis).replace(',', '.'))
      };

      // Tenta deletar o existente para o mesmo mes pra simplificar update e insere novo
      await supabase.from('dre_mensal').delete().match({ cliente_id: visaoAtual, mes_referencia: mesReferencia });
      const { data, error } = await supabase.from('dre_mensal').insert([payload]).select();
      
      if (error) throw error;
      
      alert('Lançamentos salvos com sucesso!');
      fetchLancamentos();
      setIsDreModalOpen(false);
    } catch (error) {
      console.error('Erro DRE:', error.message);
      alert('Erro ao salvar lançamentos. Você já criou a tabela dre_mensal no Supabase?');
    } finally {
      setIsLoading(false);
    }
  };

  const getClientNameById = (id) => {
    const cliente = clientes.find(c => c.id === id);
    return cliente ? cliente.nome_loja_ml : 'Loja Desconhecida';
  };

  // Mock data pros graficos nao ficarem vazios
  const graficosData = [
    { mes: 'Jan', faturamento: 0, lucro: 0 },
    { mes: 'Fev', faturamento: 0, lucro: 0 },
    { mes: 'Mar', faturamento: 0, lucro: 0 },
    { mes: 'Abr', faturamento: 0, lucro: 0 },
    { mes: 'Mai', faturamento: 0, lucro: 0 },
    { mes: 'Jun', faturamento: metricas.faturamentoBrutoFormatado.replace(/\D/g, '')/100, lucro: (metricas.faturamentoBrutoFormatado.replace(/\D/g, '')/100)*0.2 },
  ];

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <div className="header-title-row">
            <h1 className="page-title">
              {visaoAtual === 'consolidada' ? 'Visão Consolidada' : getClientNameById(visaoAtual)}
            </h1>
            <select 
              className="view-selector" 
              value={visaoAtual} 
              onChange={(e) => setVisaoAtual(e.target.value)}
            >
              <option value="consolidada">Todas as Lojas (Consolidado)</option>
              {clientes.map(cliente => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nome_loja_ml}
                </option>
              ))}
            </select>
          </div>
          <p className="text-secondary">
            {visaoAtual === 'consolidada' 
              ? 'Acompanhamento financeiro de todas as lojas'
              : `Analisando os resultados individuais de ${getClientNameById(visaoAtual)}`}
          </p>
        </div>
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {visaoAtual !== 'consolidada' && (
            <>
              <button className="btn-secondary" onClick={abrirModalDre} style={{ backgroundColor: 'var(--accent-green)', color: '#fff', border: 'none' }}>
                💵 Lançar DRE
              </button>
              <button className="btn-secondary" onClick={abrirModalEditarCliente}>
                ✏️ Editar
              </button>
            </>
          )}
          <button className="btn-primary" onClick={abrirModalNovoCliente}>
            + Novo Cliente
          </button>
        </div>
      </header>

      <div className="metrics-grid">
        <MetricCard 
          title="Faturamento Bruto" 
          value={metricas.faturamentoBrutoFormatado} 
          subtitle="Valor Bruto Total" 
          icon="💰" 
        />
        <MetricCard 
          title="Margem de Contribuição" 
          value={metricas.margemContribuicaoFormatada} 
          subtitle="Geração de caixa do mês" 
          icon="📊" 
        />
        <MetricCard 
          title="Ponto de Equilíbrio" 
          value={metricas.pontoEquilibrioFormatado} 
          subtitle="Para cobrir custo fixo" 
          icon="⚖️" 
        />
        <MetricCard 
          title="Markup Médio" 
          value={metricas.markupFormatado} 
          subtitle="Sobre CMV" 
          icon="📈" 
        />
      </div>

      <div className="charts-section">
        <div className="chart-card glass-panel">
          <h3 className="chart-title">Evolução Histórica (Em Breve)</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={graficosData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
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
                <XAxis dataKey="mes" stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)'}} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)'}} axisLine={false} tickLine={false} tickFormatter={(value) => `R$ ${value}`} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: 'var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)'}} itemStyle={{ color: 'var(--text-primary)' }} />
                <Area type="monotone" dataKey="faturamento" stroke="var(--accent-blue)" strokeWidth={3} fillOpacity={1} fill="url(#colorFat)" />
                <Area type="monotone" dataKey="lucro" stroke="var(--accent-green)" strokeWidth={3} fillOpacity={1} fill="url(#colorLucro)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Modal de Cliente */}
      <Modal isOpen={isClientModalOpen} onClose={() => setIsClientModalOpen(false)} title={editandoClienteId ? "Editar Cliente" : "Cadastrar Novo Cliente"}>
        <form onSubmit={handleSalvarCliente}>
          <div className="form-group"><label>Razão Social</label><input type="text" className="form-input" value={razaoSocial} onChange={e => setRazaoSocial(e.target.value)} required /></div>
          <div className="form-group"><label>Nome da Loja (ML)</label><input type="text" className="form-input" value={nomeLoja} onChange={e => setNomeLoja(e.target.value)} required /></div>
          <div className="form-group"><label>CNPJ</label><input type="text" className="form-input" value={cnpj} onChange={e => setCnpj(e.target.value)} required /></div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsClientModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={isLoading}>{isLoading ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </Modal>

      {/* Modal Financeiro / DRE */}
      <Modal isOpen={isDreModalOpen} onClose={() => setIsDreModalOpen(false)} title={`Lançamentos DRE - ${getClientNameById(visaoAtual)}`}>
        <form onSubmit={handleSalvarDre}>
          <div className="form-group">
            <label>Mês de Referência (ex: 2026-06)</label>
            <input type="text" className="form-input" value={mesReferencia} onChange={e => setMesReferencia(e.target.value)} required />
          </div>
          
          <h4 style={{ color: 'var(--accent-blue)', marginTop: '20px', marginBottom: '10px' }}>Entradas (Receitas)</h4>
          <div className="form-group" style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}><label>Faturamento Bruto</label><input type="number" step="0.01" className="form-input" value={faturamentoBruto} onChange={e => setFaturamentoBruto(e.target.value)} required /></div>
            <div style={{ flex: 1 }}><label>Devoluções</label><input type="number" step="0.01" className="form-input" value={devolucoes} onChange={e => setDevolucoes(e.target.value)} required /></div>
          </div>
          
          <h4 style={{ color: 'var(--accent-danger)', marginTop: '20px', marginBottom: '10px' }}>Saídas (Custos)</h4>
          <div className="form-group" style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}><label>Taxas ML</label><input type="number" step="0.01" className="form-input" value={taxasMl} onChange={e => setTaxasMl(e.target.value)} required /></div>
            <div style={{ flex: 1 }}><label>CMV (Custo Mercadoria)</label><input type="number" step="0.01" className="form-input" value={cmv} onChange={e => setCmv(e.target.value)} required /></div>
          </div>
          <div className="form-group" style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}><label>Custos Fixos</label><input type="number" step="0.01" className="form-input" value={custosFixos} onChange={e => setCustosFixos(e.target.value)} required /></div>
            <div style={{ flex: 1 }}><label>Custos Variáveis</label><input type="number" step="0.01" className="form-input" value={custosVariaveis} onChange={e => setCustosVariaveis(e.target.value)} required /></div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsDreModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={isLoading} style={{ backgroundColor: 'var(--accent-green)' }}>
              {isLoading ? 'Calculando e Salvando...' : 'Salvar DRE'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
