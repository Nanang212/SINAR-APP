const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("user123", 10);
  const adminPassword = await bcrypt.hash("admin123", 10);

  const adminRole = await prisma.role.findFirst({ where: { name: "admin" } });
  const userRole = await prisma.role.findFirst({ where: { name: "user" } });

  const kategoriList = await prisma.kategori.findMany();

  // Admin
  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: adminPassword,
      role_id: adminRole.id,
      is_active: true,
      created_by: 0,
    },
  });

  // User untuk tiap kategori
  for (const kategori of kategoriList) {
    await prisma.user.upsert({
      where: { username: `user_${kategori.name.toLowerCase().replace(/ /g, "_")}` },
      update: {},
      create: {
        username: `user_${kategori.name.toLowerCase().replace(/ /g, "_")}`,
        password,
        role_id: userRole.id,
        category_id: kategori.id,
        is_active: true,
        created_by: 0,
      },
    });
  }

  console.log("✅ Admin & User seeding done.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
