import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// As credenciais vêm do .env, nunca do código
function env(nome: string): string {
  const valor = process.env[nome];
  if (!valor) throw new Error(`Variável ${nome} não definida no .env`);
  return valor;
}

async function criarUsuario(nome: string, email: string, senha: string, role: "SUPERADMIN" | "ADMIN") {
  const hash = await bcrypt.hash(senha, 12);
  await prisma.user.upsert({
    where: { email },
    update: { password: hash },
    create: { name: nome, email, password: hash, role },
  });
}

async function main() {
  await criarUsuario("Arthur", env("SEED_SUPERADMIN_EMAIL"), env("SEED_SUPERADMIN_PASSWORD"), "SUPERADMIN");
  await criarUsuario("Gerente", env("SEED_ADMIN_EMAIL"), env("SEED_ADMIN_PASSWORD"), "ADMIN");
  console.log("Usuários criados ou atualizados.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });