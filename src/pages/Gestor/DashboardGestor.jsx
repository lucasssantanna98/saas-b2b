import React, { useState, useEffect } from 'react';
import { MetricCard } from '../../components/dashboard/MetricCard';
import { Modal } from '../../components/common/Modal';
import { DreTable } from '../../components/dashboard/DreTable';
import { DreModal } from '../../components/dashboard/DreModal';
import { supabase } from '../../services/supabase';
import './DashboardGestor.css';

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

  // States: Modal DRE Completo
  const [isDreModalOpen, setIsDreModalOpen] = useState(false);

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
      if (error && error.code !== '42P01') throw error;
      if (data) setLancamentos(data);
    } catch (error) {
      console.error('Erro lançamentos:', error.message);
    }
  };

  // ==========================================
  // MOTOR DE CÁLCULOS DRE COMPLETO
  // ==========================================
  const calcularMetricas = () => {
    let dados = lancamentos;
    if (visaoAtual !== 'consolidada') {
      dados = lancamentos.filter(l => l.cliente_id === visaoAtual);
    }

    // Agrega todos os campos da tabela DRE
    const soma = dados.reduce((acc, curr) => {
      Object.keys(acc).forEach(key => {
        acc[key] += Number(curr[key] || 0);
      });
      return acc;
    }, {
      receita_vendas: 0, receita_servicos: 0,
      deducoes_devolucoes: 0, deducoes_impostos: 0, deducoes_taxas: 0,
      custo_mercadorias: 0, custo_fretes: 0,
      despesas_vendas: 0, despesas_administrativas: 0,
      despesas_financeiras: 0, receitas_financeiras: 0,
      impostos_ir_csll: 0, pro_labore: 0
    });

    // Cálculos em cascata do DRE
    soma.receitaBruta = soma.receita_vendas + soma.receita_servicos;
    soma.totalDeducoes = soma.deducoes_devolucoes + soma.deducoes_impostos + soma.deducoes_taxas;
    soma.receitaLiquida = soma.receitaBruta - soma.totalDeducoes;
    
    soma.totalCustos = soma.custo_mercadorias + soma.custo_fretes;
    soma.lucroBruto = soma.receitaLiquida - soma.totalCustos;
    
    soma.totalDespesasOp = soma.despesas_vendas + soma.despesas_administrativas;
    soma.lucroOperacional = soma.lucroBruto - soma.totalDespesasOp;
    
    soma.resultadoFinanceiro = soma.receitas_financeiras - soma.despesas_financeiras;
    soma.lair = soma.lucroOperacional + soma.resultadoFinanceiro;
    
    soma.lucroLiquido = soma.lair - soma.impostos_ir_csll - soma.pro_labore;

    // Indicadores para os Cards
    let margemLiquida = 0;
    if (soma.receitaBruta > 0) margemLiquida = (soma.lucroLiquido / soma.receitaBruta) * 100;

    let margemBruta = 0;
    if (soma.receitaLiquida > 0) margemBruta = (soma.lucroBruto / soma.receitaLiquida) * 100;

    // Ponto de Equilíbrio = Custos e Desp Fixas / Margem de Contribuição (%)
    // Margem Contribuição = Receita Liquida - CMV - Despesas Variáveis(vendas)
    const margemContribuicao = soma.receitaLiquida - soma.totalCustos - soma.despesas_vendas;
    let mcPercentual = soma.receitaLiquida > 0 ? (margemContribuicao / soma.receitaLiquida) : 0;
    let pontoEquilibrio = mcPercentual > 0 ? (soma.despesas_administrativas / mcPercentual) : 0;

    return {
      dadosDRE: soma,
      cards: {
        faturamentoBruto: formatCurrency(soma.receitaBruta),
        lucroBruto: formatCurrency(soma.lucroBruto),
        lucroLiquido: formatCurrency(soma.lucroLiquido),
        margemLiquida: `${margemLiquida.toFixed(1)}%`,
        margemBruta: `${margemBruta.toFixed(1)}%`,
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
      alert('Erro ao salvar cliente.');
    } finally {
      setIsLoading(false);
    }
  };

  const getClientNameById = (id) => {
    const cliente = clientes.find(c => c.id === id);
    return cliente ? cliente.nome_loja_ml : 'Loja Desconhecida';
  };

  // Pega o lançamento do mes atual ou vazio pra mandar pro Modal
  const lancamentoModalAtual = lancamentos.find(l => l.cliente_id === visaoAtual) || null;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <div className="header-title-row">
            <h1 className="page-title">
              {visaoAtual === 'consolidada' ? 'Visão Consolidada' : getClientNameById(visaoAtual)}
            </h1>
            <select className="view-selector" value={visaoAtual} onChange={(e) => setVisaoAtual(e.target.value)}>
              <option value="consolidada">Todas as Lojas (Consolidado)</option>
              {clientes.map(cliente => (
                <option key={cliente.id} value={cliente.id}>{cliente.nome_loja_ml}</option>
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
              <button className="btn-secondary" onClick={() => setIsDreModalOpen(true)} style={{ backgroundColor: 'var(--accent-green)', color: '#fff', border: 'none' }}>
                💵 Lançar DRE
              </button>
              <button className="btn-secondary" onClick={abrirModalEditarCliente}>
                ✏️ Editar Loja
              </button>
            </>
          )}
          <button className="btn-primary" onClick={abrirModalNovoCliente}>
            + Nova Loja
          </button>
        </div>
      </header>

      <div className="metrics-grid">
        <MetricCard title="Faturamento Bruto" value={metricas.cards.faturamentoBruto} subtitle="Total Receitas" icon="💰" />
        <MetricCard title="Lucro Bruto" value={metricas.cards.lucroBruto} subtitle={`Margem: ${metricas.cards.margemBruta}`} icon="📊" />
        <MetricCard title="Lucro Líquido Final" value={metricas.cards.lucroLiquido} subtitle={`Margem Líquida: ${metricas.cards.margemLiquida}`} icon="💎" />
        <MetricCard title="Ponto de Equilíbrio" value={metricas.cards.pontoEquilibrio} subtitle="Cobrir Despesas Fixas" icon="⚖️" />
      </div>

      <div className="charts-section">
        <DreTable dados={metricas.dadosDRE} />
      </div>

      {/* Modais */}
      <Modal isOpen={isClientModalOpen} onClose={() => setIsClientModalOpen(false)} title={editandoClienteId ? "Editar Loja" : "Cadastrar Nova Loja"}>
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
