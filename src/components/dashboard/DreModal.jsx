import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { supabase } from '../../services/supabase';

const parseNum = (val) => Number(String(val).replace(',', '.'));

// A definição de Section precisava estar FORA do componente DreModal para não perder o foco
const Section = ({ title, children, color }) => (
  <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: '8px', borderLeft: `4px solid var(--accent-${color})` }}>
    <h4 style={{ color: `var(--accent-${color})`, marginBottom: '16px' }}>{title}</h4>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
      {children}
    </div>
  </div>
);

export function DreModal({ isOpen, onClose, clienteId, lancamentoAtual, onSalvarSucesso }) {
  const [isLoading, setIsLoading] = useState(false);
  const [mesReferencia, setMesReferencia] = useState('');
  
  const [receitas, setReceitas] = useState({ cartao: 0, pix_dinheiro: 0 });
  const [deducoes, setDeducoes] = useState({ taxas_maquininha: 0, impostos_vendas: 0 });
  const [custos, setCustos] = useState({ mercadorias: 0 });
  const [despesas, setDespesas] = useState({ ponto: 0, folha: 0, gerais: 0 });
  const [outros, setOutros] = useState({ impostos_ir: 0, pro_labore: 0 });

  useEffect(() => {
    if (isOpen) {
      if (lancamentoAtual) {
        setMesReferencia(lancamentoAtual.mes_referencia);
        setReceitas({ cartao: lancamentoAtual.vendas_cartao || 0, pix_dinheiro: lancamentoAtual.vendas_pix_dinheiro || 0 });
        setDeducoes({ taxas_maquininha: lancamentoAtual.taxas_maquininha || 0, impostos_vendas: lancamentoAtual.impostos_vendas || 0 });
        setCustos({ mercadorias: lancamentoAtual.custo_mercadorias || 0 });
        setDespesas({ ponto: lancamentoAtual.despesas_ponto || 0, folha: lancamentoAtual.folha_pagamento || 0, gerais: lancamentoAtual.despesas_gerais || 0 });
        setOutros({ impostos_ir: lancamentoAtual.impostos_ir_csll || 0, pro_labore: lancamentoAtual.pro_labore || 0 });
      } else {
        setMesReferencia(new Date().toISOString().slice(0, 7));
        setReceitas({ cartao: 0, pix_dinheiro: 0 });
        setDeducoes({ taxas_maquininha: 0, impostos_vendas: 0 });
        setCustos({ mercadorias: 0 });
        setDespesas({ ponto: 0, folha: 0, gerais: 0 });
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
        vendas_cartao: parseNum(receitas.cartao),
        vendas_pix_dinheiro: parseNum(receitas.pix_dinheiro),
        taxas_maquininha: parseNum(deducoes.taxas_maquininha),
        impostos_vendas: parseNum(deducoes.impostos_vendas),
        custo_mercadorias: parseNum(custos.mercadorias),
        despesas_ponto: parseNum(despesas.ponto),
        folha_pagamento: parseNum(despesas.folha),
        despesas_gerais: parseNum(despesas.gerais),
        impostos_ir_csll: parseNum(outros.impostos_ir),
        pro_labore: parseNum(outros.pro_labore)
      };

      await supabase.from('dre_mensal').delete().match({ cliente_id: clienteId, mes_referencia: mesReferencia });
      const { error } = await supabase.from('dre_mensal').insert([payload]);
      
      if (error) throw error;
      
      alert('Lançamentos salvos com sucesso!');
      onSalvarSucesso();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar. Verifique se o banco de dados foi atualizado com a nova tabela de Varejo Físico.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Lançamentos Financeiros - Varejo Físico">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Mês de Referência</label>
          <input type="month" className="form-input" value={mesReferencia} onChange={e => setMesReferencia(e.target.value)} required />
        </div>

        <Section title="1. Receita Bruta (Meios de Pagamento)" color="blue">
          <div><label>Vendas Cartão (Onde a Maquininha atua)</label><input type="text" className="form-input" value={receitas.cartao} onChange={e => setReceitas({...receitas, cartao: e.target.value})} /></div>
          <div><label>Vendas PIX / Dinheiro</label><input type="text" className="form-input" value={receitas.pix_dinheiro} onChange={e => setReceitas({...receitas, pix_dinheiro: e.target.value})} /></div>
        </Section>

        <Section title="2. Deduções (A Dor do Lojista)" color="danger">
          <div><label>Taxas da Maquininha (MDR)</label><input type="text" className="form-input" value={deducoes.taxas_maquininha} onChange={e => setDeducoes({...deducoes, taxas_maquininha: e.target.value})} /></div>
          <div><label>Impostos (Simples Nacional / ICMS)</label><input type="text" className="form-input" value={deducoes.impostos_vendas} onChange={e => setDeducoes({...deducoes, impostos_vendas: e.target.value})} /></div>
        </Section>

        <Section title="3. Custos Diretos (CMV)" color="danger">
          <div><label>Custo das Mercadorias / Insumos</label><input type="text" className="form-input" value={custos.mercadorias} onChange={e => setCustos({...custos, mercadorias: e.target.value})} /></div>
        </Section>

        <Section title="4. Despesas Operacionais (Ponto Físico)" color="danger">
          <div><label>Aluguel, Água, Luz, Internet</label><input type="text" className="form-input" value={despesas.ponto} onChange={e => setDespesas({...despesas, ponto: e.target.value})} /></div>
          <div><label>Folha de Pagamento (Funcionários)</label><input type="text" className="form-input" value={despesas.folha} onChange={e => setDespesas({...despesas, folha: e.target.value})} /></div>
          <div><label>Despesas Gerais (Manutenção, Contador)</label><input type="text" className="form-input" value={despesas.gerais} onChange={e => setDespesas({...despesas, gerais: e.target.value})} /></div>
        </Section>

        <Section title="5. Provisões e Retiradas" color="purple">
          <div><label>Pró-Labore (Retirada dos Sócios)</label><input type="text" className="form-input" value={outros.pro_labore} onChange={e => setOutros({...outros, pro_labore: e.target.value})} /></div>
          <div><label>Provisão IR / CSLL</label><input type="text" className="form-input" value={outros.impostos_ir} onChange={e => setOutros({...outros, impostos_ir: e.target.value})} /></div>
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
