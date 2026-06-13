import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Criando usuários...");

  // SUPERADMIN — dono do projeto, acesso total
  const superPass = await bcrypt.hash("arthur@superadmin", 12);
  await prisma.user.upsert({
    where: { email: "arthursuperadmin@email.com" },
    update: {},
    create: {
      name: "Arthur",
      email: "arthursuperadmin@email.com",
      password: superPass,
      role: "SUPERADMIN",
    },
  });

  // ADMIN — gerente do armazém, acesso completo ao estoque
  const adminPass = await bcrypt.hash("gerente@123", 12);
  await prisma.user.upsert({
    where: { email: "gerente@estoques.com" },
    update: {},
    create: {
      name: "Gerente",
      email: "gerente@estoques.com",
      password: adminPass,
      role: "ADMIN",
    },
  });

  console.log("Usuários criados com sucesso!");
  console.log("  SUPERADMIN: arthursuperadmin@email.com");
  console.log("  ADMIN: gerente@estoques.com");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
