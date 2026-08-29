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

  // States: Modal Cliente (Loja Física)
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
  // MOTOR DE CÁLCULOS DRE (VAREJO FÍSICO)
  // ==========================================
  const calcularMetricas = () => {
    let dados = lancamentos;
    if (visaoAtual !== 'consolidada') {
      dados = lancamentos.filter(l => l.cliente_id === visaoAtual);
    }

    const soma = dados.reduce((acc, curr) => {
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

    let margemLiquida = 0;
    if (soma.receitaBruta > 0) margemLiquida = (soma.lucroLiquido / soma.receitaBruta) * 100;

    let pesoTaxas = 0;
    if (soma.receitaBruta > 0) pesoTaxas = (soma.taxas_maquininha / soma.receitaBruta) * 100;

    const margemContribuicao = soma.receitaLiquida - soma.totalCustos;
    let mcPercentual = soma.receitaLiquida > 0 ? (margemContribuicao / soma.receitaLiquida) : 0;
    let pontoEquilibrio = mcPercentual > 0 ? (soma.totalDespesasOp / mcPercentual) : 0;

    return {
      dadosDRE: soma,
      cards: {
        faturamentoBruto: formatCurrency(soma.receitaBruta),
        lucroBruto: formatCurrency(soma.lucroBruto),
        lucroLiquido: formatCurrency(soma.lucroLiquido),
        margemLiquida: `${margemLiquida.toFixed(1)}%`,
        pesoTaxas: `${pesoTaxas.toFixed(1)}%`,
        pontoEquilibrio: formatCurrency(pontoEquilibrio)
      }
    };
  };

  const metricas = calcularMetricas();

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

  const lancamentoModalAtual = lancamentos.find(l => l.cliente_id === visaoAtual) || null;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <div className="header-title-row">
            <h1 className="page-title">
              {visaoAtual === 'consolidada' ? 'Visão Consolidada (Carteira)' : getClientNameById(visaoAtual)}
            </h1>
            <select className="view-selector" value={visaoAtual} onChange={(e) => setVisaoAtual(e.target.value)}>
              <option value="consolidada">Todos os Estabelecimentos</option>
              {clientes.map(cliente => (
                <option key={cliente.id} value={cliente.id}>{cliente.nome_loja_ml}</option>
              ))}
            </select>
          </div>
          <p className="text-secondary">
            {visaoAtual === 'consolidada' 
              ? 'Análise da carteira de Lojas Físicas'
              : `Resultados do estabelecimento ${getClientNameById(visaoAtual)}`}
          </p>
        </div>
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {visaoAtual !== 'consolidada' && (
            <>
              <button className="btn-secondary" onClick={() => setIsDreModalOpen(true)} style={{ backgroundColor: 'var(--accent-green)', color: '#fff', border: 'none' }}>
                💵 Lançar DRE do Mês
              </button>
              <button className="btn-secondary" onClick={abrirModalEditarCliente}>
                ✏️ Editar Loja
              </button>
            </>
          )}
          <button className="btn-primary" onClick={abrirModalNovoCliente}>
            + Novo Estabelecimento
          </button>
        </div>
      </header>

      <div className="metrics-grid">
        <MetricCard title="Vendas Totais" value={metricas.cards.faturamentoBruto} subtitle="Soma de todos os meios" icon="💰" />
        <MetricCard title="Impacto das Taxas (MDR)" value={metricas.cards.pesoTaxas} subtitle="Da Receita Bruta vai para Adquirentes" icon="💳" />
        <MetricCard title="Lucro Líquido Real" value={metricas.cards.lucroLiquido} subtitle={`Margem Final: ${metricas.cards.margemLiquida}`} icon="💎" />
        <MetricCard title="Ponto de Equilíbrio" value={metricas.cards.pontoEquilibrio} subtitle="Meta para pagar aluguel e equipe" icon="⚖️" />
      </div>

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
