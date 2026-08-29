import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { supabase } from '../../services/supabase';

const parseNum = (val) => Number(String(val).replace(',', '.'));

export function DreModal({ isOpen, onClose, clienteId, lancamentoAtual, onSalvarSucesso }) {
  const [isLoading, setIsLoading] = useState(false);
  const [mesReferencia, setMesReferencia] = useState('');
  
  // States (Grupos do DRE)
  const [receitas, setReceitas] = useState({ vendas: 0, servicos: 0 });
  const [deducoes, setDeducoes] = useState({ devolucoes: 0, impostos: 0, taxas: 0 });
  const [custos, setCustos] = useState({ mercadorias: 0, fretes: 0 });
  const [despesas, setDespesas] = useState({ vendas: 0, adm: 0 });
  const [financeiro, setFinanceiro] = useState({ desp_fin: 0, rec_fin: 0 });
  const [outros, setOutros] = useState({ impostos_ir: 0, pro_labore: 0 });

  useEffect(() => {
    if (isOpen) {
      if (lancamentoAtual) {
        setMesReferencia(lancamentoAtual.mes_referencia);
        setReceitas({ vendas: lancamentoAtual.receita_vendas || 0, servicos: lancamentoAtual.receita_servicos || 0 });
        setDeducoes({ devolucoes: lancamentoAtual.deducoes_devolucoes || 0, impostos: lancamentoAtual.deducoes_impostos || 0, taxas: lancamentoAtual.deducoes_taxas || 0 });
        setCustos({ mercadorias: lancamentoAtual.custo_mercadorias || 0, fretes: lancamentoAtual.custo_fretes || 0 });
        setDespesas({ vendas: lancamentoAtual.despesas_vendas || 0, adm: lancamentoAtual.despesas_administrativas || 0 });
        setFinanceiro({ desp_fin: lancamentoAtual.despesas_financeiras || 0, rec_fin: lancamentoAtual.receitas_financeiras || 0 });
        setOutros({ impostos_ir: lancamentoAtual.impostos_ir_csll || 0, pro_labore: lancamentoAtual.pro_labore || 0 });
      } else {
        // Reset defaults if new
        setMesReferencia(new Date().toISOString().slice(0, 7)); // YYYY-MM
        setReceitas({ vendas: 0, servicos: 0 });
        setDeducoes({ devolucoes: 0, impostos: 0, taxas: 0 });
        setCustos({ mercadorias: 0, fretes: 0 });
        setDespesas({ vendas: 0, adm: 0 });
        setFinanceiro({ desp_fin: 0, rec_fin: 0 });
        setOutros({ impostos_ir: 0, pro_labore: 0 });
      }
    }
  }, [isOpen, lancamentoAtual]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const payload = {
        cliente_id: clienteId,
        mes_referencia: mesReferencia,
        receita_vendas: parseNum(receitas.vendas),
        receita_servicos: parseNum(receitas.servicos),
        deducoes_devolucoes: parseNum(deducoes.devolucoes),
        deducoes_impostos: parseNum(deducoes.impostos),
        deducoes_taxas: parseNum(deducoes.taxas),
        custo_mercadorias: parseNum(custos.mercadorias),
        custo_fretes: parseNum(custos.fretes),
        despesas_vendas: parseNum(despesas.vendas),
        despesas_administrativas: parseNum(despesas.adm),
        despesas_financeiras: parseNum(financeiro.desp_fin),
        receitas_financeiras: parseNum(financeiro.rec_fin),
        impostos_ir_csll: parseNum(outros.impostos_ir),
        pro_labore: parseNum(outros.pro_labore)
      };

      // Tenta remover o atual para evitar dupes do mesmo mes
      await supabase.from('dre_mensal').delete().match({ cliente_id: clienteId, mes_referencia: mesReferencia });
      const { error } = await supabase.from('dre_mensal').insert([payload]);
      
      if (error) throw error;
      
      alert('Lançamentos salvos com sucesso!');
      onSalvarSucesso();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar. Verifique se o banco de dados foi atualizado.');
    } finally {
      setIsLoading(false);
    }
  };

  const Section = ({ title, children, color }) => (
    <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: '8px', borderLeft: `4px solid var(--accent-${color})` }}>
      <h4 style={{ color: `var(--accent-${color})`, marginBottom: '16px' }}>{title}</h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {children}
      </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Lançamentos Financeiros (DRE)">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Mês de Referência</label>
          <input type="month" className="form-input" value={mesReferencia} onChange={e => setMesReferencia(e.target.value)} required />
        </div>

        <Section title="1. Receitas" color="blue">
          <div><label>Vendas Mercado Livre</label><input type="text" className="form-input" value={receitas.vendas} onChange={e => setReceitas({...receitas, vendas: e.target.value})} /></div>
          <div><label>Outras / Serviços</label><input type="text" className="form-input" value={receitas.servicos} onChange={e => setReceitas({...receitas, servicos: e.target.value})} /></div>
        </Section>

        <Section title="2. Deduções (Saídas)" color="danger">
          <div><label>Devoluções</label><input type="text" className="form-input" value={deducoes.devolucoes} onChange={e => setDeducoes({...deducoes, devolucoes: e.target.value})} /></div>
          <div><label>Taxas Mercado Livre</label><input type="text" className="form-input" value={deducoes.taxas} onChange={e => setDeducoes({...deducoes, taxas: e.target.value})} /></div>
          <div><label>Impostos (Simples, ICMS)</label><input type="text" className="form-input" value={deducoes.impostos} onChange={e => setDeducoes({...deducoes, impostos: e.target.value})} /></div>
        </Section>

        <Section title="3. Custos Diretos (CMV)" color="danger">
          <div><label>Custo das Mercadorias</label><input type="text" className="form-input" value={custos.mercadorias} onChange={e => setCustos({...custos, mercadorias: e.target.value})} /></div>
          <div><label>Custo com Fretes</label><input type="text" className="form-input" value={custos.fretes} onChange={e => setCustos({...custos, fretes: e.target.value})} /></div>
        </Section>

        <Section title="4. Despesas Operacionais" color="danger">
          <div><label>Despesas de Vendas (Ads)</label><input type="text" className="form-input" value={despesas.vendas} onChange={e => setDespesas({...despesas, vendas: e.target.value})} /></div>
          <div><label>Administrativas (Aluguel, Salário)</label><input type="text" className="form-input" value={despesas.adm} onChange={e => setDespesas({...despesas, adm: e.target.value})} /></div>
        </Section>

        <Section title="5. Financeiro e Outros" color="purple">
          <div><label>Despesas Financeiras (Juros)</label><input type="text" className="form-input" value={financeiro.desp_fin} onChange={e => setFinanceiro({...financeiro, desp_fin: e.target.value})} /></div>
          <div><label>Receitas Financeiras (Rendimentos)</label><input type="text" className="form-input" value={financeiro.rec_fin} onChange={e => setFinanceiro({...financeiro, rec_fin: e.target.value})} /></div>
          <div><label>Pró-Labore</label><input type="text" className="form-input" value={outros.pro_labore} onChange={e => setOutros({...outros, pro_labore: e.target.value})} /></div>
          <div><label>IR / CSLL (Lucro Real)</label><input type="text" className="form-input" value={outros.impostos_ir} onChange={e => setOutros({...outros, impostos_ir: e.target.value})} /></div>
        </Section>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={isLoading} style={{ backgroundColor: 'var(--accent-green)' }}>
            {isLoading ? 'Salvando...' : 'Salvar Lançamentos'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
