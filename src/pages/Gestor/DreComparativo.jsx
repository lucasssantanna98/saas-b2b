import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import './DreComparativo.css';

export const DreComparativo = () => {
  const [clientes, setClientes] = useState([]);
  const [lojaId, setLojaId] = useState('');
  
  const [mesesDisponiveis, setMesesDisponiveis] = useState([]);
  const [mesAtual, setMesAtual] = useState('');
  const [mesAnterior, setMesAnterior] = useState('');
  
  const [dadosAtual, setDadosAtual] = useState(null);
  const [dadosAnterior, setDadosAnterior] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClientes();
  }, []);

  useEffect(() => {
    if (lojaId) {
      fetchLancamentosLoja(lojaId);
    } else {
      setMesesDisponiveis([]);
      setDadosAtual(null);
      setDadosAnterior(null);
    }
  }, [lojaId]);

  useEffect(() => {
    if (lojaId && (mesAtual || mesAnterior)) {
      carregarComparativo();
    }
  }, [mesAtual, mesAnterior]);

  const fetchClientes = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data } = await supabase
      .from('clientes')
      .select('id, razao_social, nome_fantasia')
      .order('nome_fantasia');
    
    if (data) {
      setClientes(data);
      if (data.length > 0) setLojaId(data[0].id);
    }
  };

  const fetchLancamentosLoja = async (id) => {
    const { data } = await supabase
      .from('dre_mensal')
      .select('mes_referencia')
      .eq('cliente_id', id);
    
    if (data && data.length > 0) {
      // Extrai os meses únicos
      const meses = [...new Set(data.map(d => d.mes_referencia))];
      
      // Ordena cronologicamente (MM-YYYY)
      meses.sort((a, b) => {
        const [mA, yA] = a.split('-');
        const [mB, yB] = b.split('-');
        const dateA = new Date(yA, parseInt(mA)-1);
        const dateB = new Date(yB, parseInt(mB)-1);
        return dateB - dateA; // Descendente (mais recente primeiro)
      });
      
      setMesesDisponiveis(meses);
      if (meses.length >= 1) setMesAtual(meses[0]);
      if (meses.length >= 2) setMesAnterior(meses[1]);
      else setMesAnterior('');
    } else {
      setMesesDisponiveis([]);
      setMesAtual('');
      setMesAnterior('');
      setDadosAtual(null);
      setDadosAnterior(null);
    }
  };

  const carregarComparativo = async () => {
    setLoading(true);
    
    // Busca dados do mes atual
    let dados1 = { obj: null };
    if (mesAtual) {
      const { data } = await supabase.from('dre_mensal').select('*').eq('cliente_id', lojaId).eq('mes_referencia', mesAtual);
      dados1.obj = agruparDados(data || []);
    }
    
    // Busca dados do mes anterior
    let dados2 = { obj: null };
    if (mesAnterior) {
      const { data } = await supabase.from('dre_mensal').select('*').eq('cliente_id', lojaId).eq('mes_referencia', mesAnterior);
      dados2.obj = agruparDados(data || []);
    }
    
    setDadosAtual(dados1.obj);
    setDadosAnterior(dados2.obj);
    setLoading(false);
  };

  const agruparDados = (lancamentos) => {
    const agrupado = {
      receitaBruta: 0,
      impostos: 0,
      taxas: 0,
      cmv: 0,
      despesasOp: 0
    };
    
    lancamentos.forEach(l => {
      const val = Number(l.valor) || 0;
      if (l.categoria === 'receita_bruta') agrupado.receitaBruta += val;
      else if (l.categoria === 'impostos_vendas') agrupado.impostos += val;
      else if (l.categoria === 'taxas_maquininha') agrupado.taxas += val;
      else if (l.categoria === 'custo_mercadorias' || l.categoria === 'cmv') agrupado.cmv += val;
      else if (l.categoria === 'despesa_operacional' || l.categoria === 'despesa_fixa') agrupado.despesasOp += val;
    });
    
    return agrupado;
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const calcDelta = (atual, anterior, isCusto = false) => {
    if (!anterior && !atual) return null;
    if (!anterior && atual) return { text: '+100%', type: isCusto ? 'positive-bad' : 'positive-good' };
    if (anterior && !atual) return { text: '-100%', type: isCusto ? 'negative-good' : 'negative-bad' };
    
    const delta = ((atual - anterior) / anterior) * 100;
    const formatted = (delta > 0 ? '+' : '') + delta.toFixed(1) + '%';
    
    let type = 'neutral';
    if (delta > 0) type = isCusto ? 'positive-bad' : 'positive-good';
    if (delta < 0) type = isCusto ? 'negative-good' : 'negative-bad';
    
    return { text: formatted, type };
  };

  const renderDelta = (atual, anterior, isCusto = false) => {
    const result = calcDelta(atual, anterior, isCusto);
    if (!result) return <span className="text-muted">-</span>;
    return <span className={`delta-badge ${result.type}`}>{result.text}</span>;
  };

  // Valores calculados
  const recAtual = dadosAtual?.receitaBruta || 0;
  const recAnt = dadosAnterior?.receitaBruta || 0;
  
  const deducoesAtual = (dadosAtual?.impostos || 0) + (dadosAtual?.taxas || 0);
  const deducoesAnt = (dadosAnterior?.impostos || 0) + (dadosAnterior?.taxas || 0);
  
  const recLiqAtual = recAtual - deducoesAtual;
  const recLiqAnt = recAnt - deducoesAnt;
  
  const cmvAtual = dadosAtual?.cmv || 0;
  const cmvAnt = dadosAnterior?.cmv || 0;
  
  const margemAtual = recLiqAtual - cmvAtual;
  const margemAnt = recLiqAnt - cmvAnt;
  
  const despAtual = dadosAtual?.despesasOp || 0;
  const despAnt = dadosAnterior?.despesasOp || 0;
  
  const lucroAtual = margemAtual - despAtual;
  const lucroAnt = margemAnt - despAnt;

  return (
    <div className="dre-comparativo-container">
      <header className="dre-header">
        <h1 className="page-title">DRE Comparativo</h1>
        <p className="page-subtitle">Demonstrativo de Resultado com análise de crescimento Mês a Mês.</p>
        
        <div className="dre-filters">
          <select className="custom-select" value={lojaId} onChange={e => setLojaId(e.target.value)}>
            <option value="">Selecione uma Loja...</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id}>{c.nome_fantasia || c.razao_social}</option>
            ))}
          </select>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
            <span>Mês Anterior:</span>
            <select className="custom-select" value={mesAnterior} onChange={e => setMesAnterior(e.target.value)}>
              <option value="">Nenhum</option>
              {mesesDisponiveis.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            
            <span style={{ marginLeft: '8px' }}>Mês Atual:</span>
            <select className="custom-select" value={mesAtual} onChange={e => setMesAtual(e.target.value)}>
              <option value="">Nenhum</option>
              {mesesDisponiveis.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
      </header>

      {loading && <p style={{ color: 'white' }}>Calculando matriz...</p>}

      {!loading && lojaId && (
        <div className="comparative-table-wrapper">
          <table className="comparative-table">
            <thead>
              <tr>
                <th>Estrutura do DRE</th>
                <th>{mesAnterior || 'Mês Anterior'}</th>
                <th>{mesAtual || 'Mês Atual'}</th>
                <th>Δ% vs anterior</th>
              </tr>
            </thead>
            <tbody>
              
              <tr className="group-header">
                <td colSpan={4}>(+) RECEITA OPERACIONAL BRUTA</td>
              </tr>
              <tr>
                <td>Faturamento Total de Vendas</td>
                <td>{formatCurrency(recAnt)}</td>
                <td>{formatCurrency(recAtual)}</td>
                <td>{renderDelta(recAtual, recAnt, false)}</td>
              </tr>

              <tr className="group-header">
                <td colSpan={4}>(-) DEDUÇÕES DA RECEITA</td>
              </tr>
              <tr>
                <td>Impostos sobre Vendas (Simples, ICMS, etc)</td>
                <td className="text-red">{formatCurrency(dadosAnterior?.impostos)}</td>
                <td className="text-red">{formatCurrency(dadosAtual?.impostos)}</td>
                <td>{renderDelta(dadosAtual?.impostos, dadosAnterior?.impostos, true)}</td>
              </tr>
              <tr>
                <td>Taxas de Maquininha (MDR / Antecipação)</td>
                <td className="text-red">{formatCurrency(dadosAnterior?.taxas)}</td>
                <td className="text-red">{formatCurrency(dadosAtual?.taxas)}</td>
                <td>{renderDelta(dadosAtual?.taxas, dadosAnterior?.taxas, true)}</td>
              </tr>

              <tr className="subtotal-row">
                <td className="text-green">= RECEITA LÍQUIDA DE VENDAS</td>
                <td className="text-green">{formatCurrency(recLiqAnt)}</td>
                <td className="text-green">{formatCurrency(recLiqAtual)}</td>
                <td>{renderDelta(recLiqAtual, recLiqAnt, false)}</td>
              </tr>

              <tr className="group-header">
                <td colSpan={4}>(-) CUSTOS DAS VENDAS</td>
              </tr>
              <tr>
                <td>Custo da Mercadoria Vendida (CMV)</td>
                <td className="text-red">{formatCurrency(cmvAnt)}</td>
                <td className="text-red">{formatCurrency(cmvAtual)}</td>
                <td>{renderDelta(cmvAtual, cmvAnt, true)}</td>
              </tr>

              <tr className="subtotal-row" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)' }}>
                <td style={{ color: '#60a5fa' }}>= MARGEM DE CONTRIBUIÇÃO</td>
                <td style={{ color: '#60a5fa' }}>{formatCurrency(margemAnt)}</td>
                <td style={{ color: '#60a5fa' }}>{formatCurrency(margemAtual)}</td>
                <td>{renderDelta(margemAtual, margemAnt, false)}</td>
              </tr>

              <tr className="group-header">
                <td colSpan={4}>(-) DESPESAS OPERACIONAIS FIXAS</td>
              </tr>
              <tr>
                <td>Aluguel, Folha, Água, Luz, Contabilidade</td>
                <td className="text-red">{formatCurrency(despAnt)}</td>
                <td className="text-red">{formatCurrency(despAtual)}</td>
                <td>{renderDelta(despAtual, despAnt, true)}</td>
              </tr>

              <tr className="subtotal-row" style={{ backgroundColor: lucroAtual >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' }}>
                <td style={{ color: lucroAtual >= 0 ? '#10b981' : '#ef4444' }}>= LUCRO LÍQUIDO FINAL</td>
                <td style={{ color: lucroAnt >= 0 ? '#10b981' : '#ef4444' }}>{formatCurrency(lucroAnt)}</td>
                <td style={{ color: lucroAtual >= 0 ? '#10b981' : '#ef4444' }}>{formatCurrency(lucroAtual)}</td>
                <td>{renderDelta(lucroAtual, lucroAnt, false)}</td>
              </tr>

            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
