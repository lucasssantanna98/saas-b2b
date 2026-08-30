# Sant'Anna Analytics - Plataforma de Gestão B2B

O **Sant'Anna Analytics** é um SaaS corporativo completo, desenvolvido para consultorias B2B. Ele permite que múltiplos consultores/gestores financeiros gerenciem e visualizem os indicadores e DREs de seus clientes de forma totalmente isolada e segura.

## 🚀 Arquitetura e Tecnologia
- **Frontend:** React (Vite)
- **Roteamento:** React Router v6
- **Estilização:** CSS puro e focado em alta performance (Tema Dark Corporate)
- **Backend & Auth:** Supabase (Autenticação, Banco de Dados, Políticas RLS)
- **Componentes:** Lucide React (Ícones), Recharts (BI)

## 💎 Funcionalidades Principais (SaaS V2)

### 1. Sistema Multi-Tenant e RLS Avançado
- Autenticação baseada em Sessões JWT.
- Cada conta de Gestor só consegue acessar, visualizar e editar os lançamentos de suas próprias lojas através de **Row Level Security (RLS)** do PostgreSQL, garantindo isolamento total de clientes.

### 2. O Dashboard do Gestor
O centro de controle operacional onde o consultor pode:
- Alternar a visualização entre lojas específicas ou um modo "Consolidado" (somatória de todas as lojas que ele gerencia).
- Cadastrar Novas Lojas (CNPJ).
- Registrar lançamentos financeiros agrupados por categorias (Receita Bruta, Impostos, CMV, Despesas).
- Exportar o panorama executivo da loja para **PDF**.

### 3. DRE Comparativo Inteligente
- Uma aba inteira dedicada à visão de **Demonstração do Resultado do Exercício**.
- Permite comparar a performance lado a lado entre **dois meses** diferentes.
- Cálculo automático de **Δ% de Variação (Crescimento/Queda)** colorido (Verde/Vermelho), aplicando a lógica invertida para Custos (aumentar custo é ruim).

### 4. Painel do Super Administrador (God Mode)
- Identificação de E-mail oficial (`lucass.santanna98@gmail.com`).
- Quebra de barreira RLS permitindo acesso irrestrito aos dados de todos os gestores do SaaS.
- **Painel de Gestão:** Visualização de todos os gestores cadastrados, data de último login, e métricas de conversão (quantas lojas cada gestor trouxe para a plataforma).
- **Provisão de Contas:** Criação e onboarding direto de novos consultores por dentro do sistema, fechando a plataforma contra cadastros externos.

## 🛠 Como executar o projeto (Localmente)

1. Instale as dependências:
```bash
npm install
```

2. Crie um arquivo `.env.local` na raiz do projeto com suas chaves do Supabase:
```env
VITE_SUPABASE_URL=sua-url-do-supabase
VITE_SUPABASE_ANON_KEY=sua-anon-key-do-supabase
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

## 📊 Lógica Matemática do Dashboard (DRE)

Para garantir que a plataforma sirva como uma verdadeira ferramenta de consultoria financeira, todos os cálculos automatizados do painel seguem os padrões contábeis gerenciais:

1. **Faturamento Bruto (Receita Operacional Bruta)**: 
   `= Vendas Cartão + Vendas Pix/Dinheiro`
2. **Deduções da Receita**: 
   `= Taxas de Maquininha (MDR) + Impostos sobre Vendas (Simples Nacional/ICMS)`
3. **Receita Líquida**: 
   `= Faturamento Bruto - Deduções`
4. **Lucro Bruto (Margem de Contribuição Bruta)**: 
   `= Receita Líquida - CMV (Custo da Mercadoria Vendida)`
5. **Despesas Operacionais (Custos Fixos)**: 
   `= Aluguel/Despesas do Ponto + Folha de Pagamento + Despesas Gerais`
6. **Provisões Retidas**: 
   `= Impostos sobre Lucro (IR/CSLL) + Pró-Labore`
7. **Lucro Líquido Final**: 
   `= Lucro Bruto - Despesas Operacionais - Provisões Retidas`
8. **Margem Líquida (%)**: 
   `= (Lucro Líquido / Faturamento Bruto) * 100`

### ⚖️ Cálculo do Ponto de Equilíbrio (Break-Even Point)
O Ponto de Equilíbrio calcula quanto a loja precisa faturar *apenas para pagar as contas* (Lucro zero).
- **Índice de Margem de Contribuição (IMC)**: `(Faturamento Bruto - Custos Variáveis Totais) / Faturamento Bruto`
- **Ponto de Equilíbrio (R$)**: `Despesas Operacionais Totais / IMC`

## 🔒 Setup de Banco de Dados e Regras (Supabase)

Para inicializar a arquitetura, execute os seguintes scripts SQL no seu editor do Supabase:

```sql
-- Políticas de RLS para Clientes
CREATE POLICY "Acesso Total para Admin e Restrito para Gestores" 
ON public.clientes FOR ALL USING (
  auth.uid() = user_id 
  OR (auth.jwt() ->> 'email') = 'lucass.santanna98@gmail.com'
);

-- Políticas de RLS para DRE
CREATE POLICY "Acesso Total para Admin e Restrito para Gestores" 
ON public.dre_mensal FOR ALL USING (
  auth.uid() = user_id 
  OR (auth.jwt() ->> 'email') = 'lucass.santanna98@gmail.com'
);

-- View para Painel de Gestão
CREATE OR REPLACE VIEW public.vw_gestores WITH (security_invoker=false) AS
SELECT id, email, created_at, last_sign_in_at 
FROM auth.users;

GRANT SELECT ON public.vw_gestores TO authenticated;
```

---
*Desenvolvido em parceria exclusiva para a Sant'Anna Analytics.*
