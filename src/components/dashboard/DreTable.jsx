import React from 'react';
import './DreTable.css';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export function DreTable({ dados }) {
  if (!dados) return null;

  return (
    <div className="dre-table-container glass-panel">
      <h3 className="chart-title" style={{ marginBottom: '16px' }}>Demonstração do Resultado do Exercício (DRE) - Loja Física</h3>
      <table className="dre-table">
        <tbody>
          {/* RECEITA BRUTA */}
          <tr className="dre-row-total text-blue">
            <td>RECEITA OPERACIONAL BRUTA</td>
            <td className="text-right">{formatCurrency(dados.receitaBruta)}</td>
          </tr>
          <tr className="dre-row-detail">
            <td className="indent-1">Vendas no Cartão (Crédito/Débito)</td>
            <td className="text-right">{formatCurrency(dados.vendas_cartao)}</td>
          </tr>
          <tr className="dre-row-detail">
            <td className="indent-1">Vendas no PIX e Dinheiro</td>
            <td className="text-right">{formatCurrency(dados.vendas_pix_dinheiro)}</td>
          </tr>

          {/* DEDUÇÕES */}
          <tr className="dre-row-subtotal text-danger">
            <td>(-) DEDUÇÕES DA RECEITA BRUTA</td>
            <td className="text-right">- {formatCurrency(dados.totalDeducoes)}</td>
          </tr>
          <tr className="dre-row-detail">
            <td className="indent-1">Taxas da Maquininha (MDR / Antecipação)</td>
            <td className="text-right">{formatCurrency(dados.taxas_maquininha)}</td>
          </tr>
          <tr className="dre-row-detail">
            <td className="indent-1">Impostos sobre Vendas (Simples/ICMS)</td>
            <td className="text-right">{formatCurrency(dados.impostos_vendas)}</td>
          </tr>

          {/* RECEITA LÍQUIDA */}
          <tr className="dre-row-total text-green">
            <td>= RECEITA OPERACIONAL LÍQUIDA</td>
            <td className="text-right">{formatCurrency(dados.receitaLiquida)}</td>
          </tr>

          {/* CUSTOS */}
          <tr className="dre-row-subtotal text-danger">
            <td>(-) CUSTO DAS VENDAS (CMV)</td>
            <td className="text-right">- {formatCurrency(dados.totalCustos)}</td>
          </tr>
          <tr className="dre-row-detail">
            <td className="indent-1">Custo das Mercadorias Vendidas (Insumos)</td>
            <td className="text-right">{formatCurrency(dados.custo_mercadorias)}</td>
          </tr>

          {/* LUCRO BRUTO */}
          <tr className="dre-row-total">
            <td>= RESULTADO OPERACIONAL BRUTO (Lucro Bruto)</td>
            <td className="text-right">{formatCurrency(dados.lucroBruto)}</td>
          </tr>

          {/* DESPESAS OPERACIONAIS */}
          <tr className="dre-row-subtotal text-danger">
            <td>(-) DESPESAS OPERACIONAIS</td>
            <td className="text-right">- {formatCurrency(dados.totalDespesasOp)}</td>
          </tr>
          <tr className="dre-row-detail">
            <td className="indent-1">Aluguel e Custos do Ponto Físico</td>
            <td className="text-right">{formatCurrency(dados.despesas_ponto)}</td>
          </tr>
          <tr className="dre-row-detail">
            <td className="indent-1">Folha de Pagamento (Funcionários)</td>
            <td className="text-right">{formatCurrency(dados.folha_pagamento)}</td>
          </tr>
          <tr className="dre-row-detail">
            <td className="indent-1">Despesas Gerais (Contador, Manutenção)</td>
            <td className="text-right">{formatCurrency(dados.despesas_gerais)}</td>
          </tr>

          {/* RESULTADO FINANCEIRO E IMPOSTOS */}
          <tr className="dre-row-subtotal">
            <td>(-) PROVISÕES E RETIRADAS</td>
            <td className="text-right">- {formatCurrency(dados.totalProvisoes)}</td>
          </tr>
          <tr className="dre-row-detail text-danger">
            <td className="indent-1">Impostos sobre Lucro (IR/CSLL)</td>
            <td className="text-right">{formatCurrency(dados.impostos_ir_csll)}</td>
          </tr>
          <tr className="dre-row-detail text-danger">
            <td className="indent-1">Retirada dos Sócios (Pró-Labore)</td>
            <td className="text-right">{formatCurrency(dados.pro_labore)}</td>
          </tr>

          {/* LUCRO LIQUIDO */}
          <tr className="dre-row-total highlight text-green">
            <td>= RESULTADO LÍQUIDO DO EXERCÍCIO</td>
            <td className="text-right">{formatCurrency(dados.lucroLiquido)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
