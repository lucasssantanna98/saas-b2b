import React from 'react';
import './DreTable.css';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export function DreTable({ dados }) {
  if (!dados) return null;

  return (
    <div className="dre-table-container glass-panel">
      <h3 className="chart-title" style={{ marginBottom: '16px' }}>Demonstração do Resultado do Exercício (DRE)</h3>
      <table className="dre-table">
        <tbody>
          {/* RECEITA BRUTA */}
          <tr className="dre-row-total text-blue">
            <td>RECEITA OPERACIONAL BRUTA</td>
            <td className="text-right">{formatCurrency(dados.receitaBruta)}</td>
          </tr>
          <tr className="dre-row-detail">
            <td className="indent-1">Venda de Produtos (Marketplace)</td>
            <td className="text-right">{formatCurrency(dados.receita_vendas)}</td>
          </tr>
          <tr className="dre-row-detail">
            <td className="indent-1">Prestação de Serviços / Outros</td>
            <td className="text-right">{formatCurrency(dados.receita_servicos)}</td>
          </tr>

          {/* DEDUÇÕES */}
          <tr className="dre-row-subtotal text-danger">
            <td>(-) DEDUÇÕES DA RECEITA BRUTA</td>
            <td className="text-right">- {formatCurrency(dados.totalDeducoes)}</td>
          </tr>
          <tr className="dre-row-detail">
            <td className="indent-1">Devoluções / Vendas Canceladas</td>
            <td className="text-right">{formatCurrency(dados.deducoes_devolucoes)}</td>
          </tr>
          <tr className="dre-row-detail">
            <td className="indent-1">Impostos (Simples, ICMS, etc)</td>
            <td className="text-right">{formatCurrency(dados.deducoes_impostos)}</td>
          </tr>
          <tr className="dre-row-detail">
            <td className="indent-1">Taxas de Plataforma (Mercado Livre)</td>
            <td className="text-right">{formatCurrency(dados.deducoes_taxas)}</td>
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
            <td className="indent-1">Custo das Mercadorias Vendidas</td>
            <td className="text-right">{formatCurrency(dados.custo_mercadorias)}</td>
          </tr>
          <tr className="dre-row-detail">
            <td className="indent-1">Custo com Fretes Diretos</td>
            <td className="text-right">{formatCurrency(dados.custo_fretes)}</td>
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
            <td className="indent-1">Despesas com Vendas (Ads, Embalagens)</td>
            <td className="text-right">{formatCurrency(dados.despesas_vendas)}</td>
          </tr>
          <tr className="dre-row-detail">
            <td className="indent-1">Despesas Administrativas (Fixas)</td>
            <td className="text-right">{formatCurrency(dados.despesas_administrativas)}</td>
          </tr>

          {/* RESULTADO FINANCEIRO */}
          <tr className="dre-row-subtotal">
            <td>(+/-) RESULTADO FINANCEIRO LÍQUIDO</td>
            <td className="text-right">{formatCurrency(dados.resultadoFinanceiro)}</td>
          </tr>
          <tr className="dre-row-detail text-danger">
            <td className="indent-1">(-) Despesas Financeiras</td>
            <td className="text-right">{formatCurrency(dados.despesas_financeiras)}</td>
          </tr>
          <tr className="dre-row-detail text-green">
            <td className="indent-1">(+) Receitas Financeiras</td>
            <td className="text-right">{formatCurrency(dados.receitas_financeiras)}</td>
          </tr>

          {/* LAIR */}
          <tr className="dre-row-total">
            <td>= RESULTADO ANTES DOS IMPOSTOS (LAIR)</td>
            <td className="text-right">{formatCurrency(dados.lair)}</td>
          </tr>

          {/* IMPOSTOS E PRO LABORE */}
          <tr className="dre-row-detail text-danger">
            <td>(-) Provisão para IR / CSLL</td>
            <td className="text-right">{formatCurrency(dados.impostos_ir_csll)}</td>
          </tr>
          <tr className="dre-row-detail text-danger">
            <td>(-) Pró-Labore / Distribuição</td>
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
