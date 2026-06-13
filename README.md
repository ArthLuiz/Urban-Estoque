# Urban Estoque

Sistema web de controle de almoxarifado desenvolvido para hotelaria. Permite gerenciar entradas e saídas de produtos em tempo real, com histórico completo de movimentações e alertas de estoque mínimo.

## Funcionalidades

- Controle de estoque em tempo real
- Registro de entradas e saídas com histórico
- Alertas automáticos de estoque abaixo do mínimo
- Autenticação segura com níveis de acesso (Super Admin / Admin)
- Interface responsiva para desktop e mobile

## Tecnologias

- **Next.js 16** com App Router e TypeScript
- **PostgreSQL** via Prisma ORM
- **NextAuth.js** para autenticação com JWT
- **Tailwind CSS** para estilização
- **Railway** para hospedagem do banco de dados
- **Vercel** para deploy da aplicação

## Como rodar localmente

**Pré-requisitos:** Node.js 18+ e uma instância PostgreSQL

```bash
# Clone o repositório
git clone https://github.com/ArthLuiz/Urban-Estoque.git
cd Urban-Estoque

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais

# Inicialize o banco de dados
npx prisma db push
npx ts-node --compiler-options "{\"module\":\"CommonJS\"}" prisma/seed.ts

# Rode o projeto
npm run dev
```

Acesse `http://localhost:3000`
