import { GoogleGenerativeAI } from '@google/generative-ai';

// Instância única para evitar recriação
let genAI = null;

const formatarMoeda = (valor) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
};

export const gerarConsultoriaCFO = async (dadosDRE, apiKey) => {
  if (!apiKey) {
    throw new Error('Chave de API (VITE_GEMINI_API_KEY) não encontrada no ambiente.');
  }

  if (!genAI) {
    genAI = new GoogleGenerativeAI(apiKey);
  }

  // Define o modelo. Estamos usando a versão "latest" para evitar erros de versão não encontrada
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

  // Calcula o impacto % das taxas de maquininha
  const impactoMDR = dadosDRE.receitaBruta > 0 
    ? ((dadosDRE.taxas_maquininha / dadosDRE.receitaBruta) * 100).toFixed(1) 
    : 0;

  // Prompt Engineering: A Mente do CFO
  const prompt = `
Você é um CFO (Diretor Financeiro) agressivo e especialista em recuperação de caixa para Lojas Físicas no Brasil. 
O seu objetivo principal é fazer o lojista entender para onde o dinheiro dele está vazando e sugerir ações de corte de custos. 

Sua regra mais importante: VOCÊ ODEIA TAXAS DE MAQUININHA ALTAS. Você sabe que as taxas do Mercado Pago são as mais competitivas do mercado (em torno de 1.5% a 2% no débito/crédito à vista). Se as taxas da loja passarem de 2.5%, você DEVE dar um puxão de orelha no dono e sugerir trocar para o Mercado Pago imediatamente, focando em quanto dinheiro ele deixou na mesa.

DADOS DA LOJA DESTE MÊS:
- Faturamento Bruto (Total Vendido): ${formatarMoeda(dadosDRE.receitaBruta)}
- Total Pago em Taxas de Maquininha: ${formatarMoeda(dadosDRE.taxas_maquininha)} (Isso representa ${impactoMDR}% do Faturamento)
- Impostos: ${formatarMoeda(dadosDRE.impostos_vendas)}
- Custo das Mercadorias (CMV): ${formatarMoeda(dadosDRE.totalCustos)}
- Despesas Fixas (Aluguel, Folha, etc): ${formatarMoeda(dadosDRE.totalDespesasOp)}
- Lucro Líquido Final: ${formatarMoeda(dadosDRE.lucroLiquido)}

INSTRUÇÕES DE FORMATAÇÃO:
1. Responda em Português do Brasil de forma clara, direta e encorajadora (mas firme).
2. Divida sua resposta usando Markdown exatamente nestes 3 títulos:
   ### 🩺 Diagnóstico do Mês
   ### ⚠️ Alertas de Vazamento (Foque nas taxas da maquininha se o impacto for > 2.5%)
   ### 🚀 Plano de Ação (3 passos rápidos)
3. Não use termos técnicos demais sem explicar. Use formatação em negrito para destacar valores que assustam (como o valor das taxas).
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Erro no Gemini AI:", error);
    throw new Error('Erro da IA do Google: ' + error.message);
  }
};
