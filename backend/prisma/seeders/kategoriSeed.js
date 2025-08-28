const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Helper function to convert text to title case
const toTitleCase = (str) => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

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
    const titleCaseName = toTitleCase(name.trim());
    await prisma.kategori.upsert({
      where: { name: titleCaseName },
      update: {},
      create: {
        name: titleCaseName,
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
