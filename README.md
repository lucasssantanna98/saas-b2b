# 🚀 CRM Financeiro & CFO Virtual (SaaS B2B)

Um SaaS B2B moderno e poderoso desenvolvido especificamente para **Consultores Comerciais de Meios de Pagamento** (como representantes do Mercado Pago, Stone, PagSeguro, etc). 

A plataforma não é apenas um sistema de gestão, mas sim uma **ferramenta de vendas e auditoria financeira**. Ela permite mapear o DRE (Demonstrativo de Resultados) de lojas físicas, calcular o ponto de equilíbrio real e, o mais importante, utilizar **Inteligência Artificial (Google Gemini)** para provar ao lojista o quanto ele está perdendo dinheiro com taxas bancárias altas.

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=googlebard&logoColor=white)

---

## 🔥 Principais Funcionalidades

### 1. Dashboard de Business Intelligence (BI) Premium
* **Cards de Indicadores**: Funil financeiro que vai do Faturamento Bruto até a Margem de Lucro Líquido final.
* **Raio-X de Custos (Pizza)**: Mostra visualmente para o dono da loja quais despesas (Impostos, Custos Variáveis, Aluguel, etc) estão devorando a maior fatia da receita.
* **Evolução Histórica (Barras)**: Acompanha o Faturamento vs Lucro mês a mês.

### 2. Análise de Ponto de Equilíbrio (Break-Even)
O sistema possui um motor matemático voltado para o Varejo Físico que calcula automaticamente o Ponto de Equilíbrio.
Um gráfico de linhas exclusivo cruza três indicadores vitais:
1. **Faturamento** (Verde)
2. **Custos Totais** (Vermelho - Fixos + Variáveis)
3. **Margem de Contribuição** (Azul Tracejado)

### 3. CFO Virtual (Inteligência Artificial)
A "Arma Secreta" do consultor. Integrado com a última geração do **Google Gemini AI**, o sistema possui uma Engenharia de Prompt que age como um Diretor Financeiro implacável.
* Lê os dados do DRE lançado.
* Gera um relatório de **Diagnóstico**, alertas de **Vazamento de Caixa** (focando agressivamente em taxas de maquininha) e um **Plano de Ação**.
* **Sistema Antibloqueio (Fallback):** Tenta até 4 motores diferentes do Gemini (Flash e Pro) em cascata para garantir que a resposta seja gerada mesmo se os servidores do Google estiverem sobrecarregados.

### 4. Exportação de Relatório Executivo em PDF
Com apenas um clique, a tela (Dark Mode) é otimizada para o padrão A4. Elementos visuais não essenciais (botões, filtros) são ocultados magicamente e o navegador imprime um Relatório Vetorial impecável para ser enviado via WhatsApp ao lojista, sem perder qualidade de imagem.

---

## 🛠️ Tecnologias Utilizadas

* **Frontend:** React + Vite
* **Estilização:** CSS Vanilla Moderno (Dark Mode, Glassmorphism, CSS Grid)
* **Gráficos:** Recharts (SVG responsivo)
* **Impressão (PDF):** react-to-print (v3.0+)
* **Inteligência Artificial:** @google/generative-ai (Modelos `gemini-flash-latest`, `gemini-pro`)
* **Backend / Banco de Dados:** Supabase (PostgreSQL)

---

## ⚙️ Instalação e Uso Local

Para rodar o projeto localmente em sua máquina, siga os passos abaixo.

### Pré-requisitos
* Node.js instalado (v18+)
* Projeto no Supabase criado (com tabela `dre_mensal` e `clientes`)
* Chave de API do Google AI Studio (iniciando em `AIzaSy...` ou a nova geração `AQ...`)

### 1. Clonar e Instalar
Abra seu terminal e rode:
```bash
npm install
```

### 2. Configurar Variáveis de Ambiente
Crie um arquivo chamado `.env.local` na raiz do projeto e insira suas credenciais:
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anon_do_supabase
VITE_GEMINI_API_KEY=sua_chave_do_google_ai_studio
```

### 3. Rodar o Servidor
```bash
npm run dev
```
Acesse `http://localhost:5173/dashboard` no seu navegador.

---

## ☁️ Deploy (Vercel)
O projeto foi totalmente otimizado para deploy Serverless na Vercel. 
**Importante:** Ao subir para a Vercel, certifique-se de configurar as mesmas três variáveis de ambiente (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` e `VITE_GEMINI_API_KEY`) no painel **Settings > Environment Variables** do seu projeto na Vercel para que a API da IA e o Banco de Dados funcionem em produção.

---
*Desenvolvido com foco em alta conversão de vendas B2B.*
