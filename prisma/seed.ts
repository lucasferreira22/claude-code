import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@focusdigital.com")
    .toLowerCase();
  const senha = process.env.SEED_ADMIN_PASSWORD ?? "focus123";
  const nome = process.env.SEED_ADMIN_NAME ?? "Administrador";

  const senhaHash = await bcrypt.hash(senha, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, nome, senhaHash },
  });

  console.log(`Usuário pronto: ${user.email}`);
  console.log(`Senha (se recém-criado): ${senha}`);
  console.log("Altere a senha em produção definindo SEED_ADMIN_PASSWORD.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
