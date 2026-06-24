# CRM Focus Digital

CRM web para gestão da carteira de clientes da Focus Digital (tráfego pago e
assessoria estratégica). **Fase 1**: cadastro e organização de clientes,
diferenciação entre clientes diretos e via parceria B2B, histórico de status,
controle de contratos, agências parceiras, multiusuário e importação via CSV.

## Stack

- **Next.js 14** (App Router, React + TypeScript) — frontend e backend num só projeto
- **PostgreSQL** + **Prisma** (ORM)
- **Auth.js (NextAuth v5)** — login multiusuário (credenciais)
- **Tailwind CSS** — interface limpa e funcional
- **PapaParse** — importação de CSV com mapeamento de colunas

## Modelo de dados

| Tabela | Função |
|---|---|
| `users` | Você + colaboradores (login) |
| `partner_agencies` | Agências parceiras B2B |
| `clients` | Núcleo: clientes (direto ou via parceria), com `valorMensal` já previsto para o financeiro futuro |
| `client_services` | Serviços contratados (Meta Ads, Google Ads, Outros) |
| `client_contacts` | Contatos (telefone, e-mail, WhatsApp) |
| `client_status_history` | Linha do tempo de mudanças de status |
| `client_notes` | Diário de interações datadas |

O esquema completo está em [`prisma/schema.prisma`](prisma/schema.prisma).

## Rodando localmente

1. **Instale as dependências**
   ```bash
   npm install
   ```

2. **Configure as variáveis de ambiente** — copie `.env.example` para `.env` e
   preencha:
   ```bash
   cp .env.example .env
   ```
   - `DATABASE_URL`: connection string do Postgres (local ou Neon/Supabase)
   - `AUTH_SECRET`: gere com `openssl rand -base64 32`

3. **Crie as tabelas e o primeiro usuário**
   ```bash
   npm run db:push      # cria o schema no banco
   npm run db:seed      # cria o usuário admin inicial
   ```
   Usuário padrão: `admin@focusdigital.com` / senha `focus123`
   (defina `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` para personalizar).

4. **Inicie**
   ```bash
   npm run dev
   ```
   Acesse http://localhost:3000

## Importando sua planilha

Acesse **Importar CSV**, faça o upload da planilha (primeira linha = nomes das
colunas), revise para qual campo cada coluna será mapeada (o sistema já tenta
adivinhar) e confirme. O arquivo [`exemplo-clientes.csv`](exemplo-clientes.csv)
mostra o formato esperado. Agências parceiras citadas no CSV são criadas
automaticamente se ainda não existirem.

## Deploy (custo inicial R$ 0)

### Banco de dados — Neon (ou Supabase)
1. Crie um projeto em [neon.tech](https://neon.tech) (free tier).
2. Copie a connection string e use como `DATABASE_URL`.

### Aplicação — Vercel
1. Suba este repositório no GitHub e importe em [vercel.com](https://vercel.com).
2. Configure as variáveis de ambiente no projeto da Vercel:
   - `DATABASE_URL` (a do Neon)
   - `AUTH_SECRET`
   - `AUTH_URL` (a URL pública da Vercel)
3. O build roda `prisma generate` automaticamente. Após o primeiro deploy,
   aplique o schema e crie o usuário rodando localmente apontando para o banco
   de produção:
   ```bash
   DATABASE_URL="<url-do-neon>" npm run db:push
   DATABASE_URL="<url-do-neon>" npm run db:seed
   ```

## Roadmap (fora do escopo da Fase 1)

Já previsto na modelagem para evolução futura:
- **Financeiro**: faturas, pagamentos, inadimplência (base: `clients.valorMensal`
  e `partner_agencies.percentualComissao`)
- Relatórios e dashboards
- Permissões diferenciadas (admin vs colaborador)
- Integrações (WhatsApp, etc.)
