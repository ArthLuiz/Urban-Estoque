# Urban Estoque

Sistema web de controle de almoxarifado para hotelaria. Registra entradas e saídas de produtos, mantém o histórico de movimentações e gera relatórios em PDF por período.

**Acesso:** https://urban-estoque.vercel.app (login restrito)

## Funcionalidades

- Estoque agrupado por categoria, com cadastro e edição de produtos
- Alerta de estoque abaixo do mínimo
- Registro de entradas e saídas com histórico
- Saídas com destino (apartamento, bloco) e nome de quem recebeu
- Bloqueio de saída maior que o estoque disponível
- Relatório em PDF por período, separado em entradas e saídas e agrupado por categoria
- Autenticação com dois níveis de acesso (Super Admin e Admin)
- Layout responsivo para desktop e celular

## Tecnologias

Next.js, React, TypeScript, Tailwind CSS, Prisma ORM, PostgreSQL, NextAuth.js, Zod e jsPDF.
Deploy na Vercel, com banco PostgreSQL no Neon.

## Como rodar localmente

Pré-requisitos: Node.js 18+ e um banco PostgreSQL.

```bash
git clone https://github.com/ArthLuiz/Urban-Estoque.git
cd Urban-Estoque
npm install
```

Crie o arquivo `.env` a partir do exemplo (`copy .env.example .env` no Windows) e preencha:

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | URL de conexão do PostgreSQL |
| `NEXTAUTH_SECRET` | Chave de sessão (gere com `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | `http://localhost:3000` em desenvolvimento |
| `SEED_SUPERADMIN_EMAIL` e `SEED_SUPERADMIN_PASSWORD` | Credenciais do Super Admin |
| `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD` | Credenciais do Admin |

Crie as tabelas e os usuários, e rode o projeto:

```bash
npx prisma db push
npx ts-node --compiler-options "{\"module\":\"CommonJS\"}" prisma/seed.ts
npm run dev
```

O comando do seed usa aspas no formato do `cmd` do Windows. No PowerShell, rode `cmd` antes.

Acesse `http://localhost:3000`.

## Estrutura

- `app/`: páginas e rotas da API
- `components/`: componentes compartilhados
- `lib/`: autenticação, acesso ao banco e logs
- `prisma/`: schema do banco e seed
