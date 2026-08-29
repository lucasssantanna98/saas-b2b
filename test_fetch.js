const supabaseUrl = 'https://rnxzlxyvctbirqhcltok.supabase.co';
const supabaseAnonKey = 'sb_publishable_7PIdi3Vjp1SDYknC29T9IA_B-ZXlp3R';

async function testSupabase() {
  console.log("Fetching clientes...");
  
  const resCli = await fetch(`${supabaseUrl}/rest/v1/clientes?select=*`, {
    headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${supabaseAnonKey}` }
  });
  const clientes = await resCli.json();
  console.log("Clientes count:", clientes.length);

  if (clientes.length === 0) return;
  const cid = clientes[0].id;

  const payload = {
        cliente_id: cid,
        mes_referencia: '2026-08',
        vendas_cartao: 100,
        vendas_pix_dinheiro: 0,
        taxas_maquininha: 0,
        impostos_vendas: 0,
        custo_mercadorias: 0,
        despesas_ponto: 0,
        folha_pagamento: 0,
        despesas_gerais: 0,
        impostos_ir_csll: 0,
        pro_labore: 0
  };

  console.log("Inserindo dre_mensal:", payload);
  const resDre = await fetch(`${supabaseUrl}/rest/v1/dre_mensal`, {
    method: 'POST',
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(payload)
  });
  
  if (!resDre.ok) {
    const errorText = await resDre.text();
    console.error("INSERT ERROR:", resDre.status, errorText);
  } else {
    const data = await resDre.json();
    console.log("INSERT SUCCESS:", data);
  }
}

testSupabase();
