import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rnxzlxyvctbirqhcltok.supabase.co';
const supabaseAnonKey = 'sb_publishable_7PIdi3Vjp1SDYknC29T9IA_B-ZXlp3R';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabase() {
  console.log("Fetching clientes...");
  const { data: clientes, error: cliErr } = await supabase.from('clientes').select('*');
  if (cliErr) {
    console.error("Erro clientes:", cliErr);
    return;
  }
  console.log("Clientes:", clientes);

  if (clientes.length === 0) {
    console.log("No clientes found.");
    return;
  }

  const cid = clientes[0].id;
  console.log("Testando insert em dre_mensal com cliente_id:", cid);

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

  const { data, error } = await supabase.from('dre_mensal').insert([payload]);
  if (error) {
    console.error("INSERT ERROR:", error);
  } else {
    console.log("INSERT SUCCESS:", data);
  }
}

testSupabase();
