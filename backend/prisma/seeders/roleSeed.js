const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const roles = ["admin", "user"];

  for (const name of roles) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: {
        name,
        is_active: true,
        created_by: 0,
      },
    });
  }

  console.log("✅ Role seeding done.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
