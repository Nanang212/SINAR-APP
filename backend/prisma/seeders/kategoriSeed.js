const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const categories = [
    "kementrian komunikasi dan digital",
    "kementrian keuangan",
    "sekretaris jenderal DPR",
    "kementrian ketenagakerjaan",
    "badan gizi nasional",
    "televisi republik indonesia",
    "radio republik indonesia",
  ];

  for (const name of categories) {
    await prisma.kategori.upsert({
      where: { name },
      update: {},
      create: {
        name,
        is_active: true,
        created_by: 0,
      },
    });
  }

  console.log("✅ Kategori seeding done.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
