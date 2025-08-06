const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const adminRole = await prisma.role.findFirst({ where: { name: "admin" } });
  const userRole = await prisma.role.findFirst({ where: { name: "user" } });

  // Create category mapping for easier access
  const categories = await prisma.kategori.findMany();
  const categoryMap = {};
  categories.forEach(cat => {
    categoryMap[cat.name] = cat.id;
  });

  // Admin users
  const adminUsers = [
    {
      username: 'sinar1',
      name_mentri: 'Admin Sinar 1',
      password: await bcrypt.hash('sinar123', 10),
      role_id: adminRole.id,
      category_id: null
    },
    {
      username: 'sinar2',
      name_mentri: 'Admin Sinar 2',
      password: await bcrypt.hash('sinar123', 10),
      role_id: adminRole.id,
      category_id: null
    }
  ];

  // Regular users
  const regularUsers = [
    {
      username: 'komdigi',
      name_mentri: 'kementrian komunikasi dan digital',
      password: await bcrypt.hash('komdigi123', 10),
      role_id: userRole.id,
      category_id: categoryMap['kementrian komunikasi dan digital']
    },
    {
      username: 'kemenkeu',
      name_mentri: 'kementrian keuangan',
      password: await bcrypt.hash('kemenkeu123', 10),
      role_id: userRole.id,
      category_id: categoryMap['kementrian keuangan']
    },
    {
      username: 'setjendpr',
      name_mentri: 'sekretaris jenderal DPR',
      password: await bcrypt.hash('setjendpr123', 10),
      role_id: userRole.id,
      category_id: categoryMap['sekretaris jenderal DPR']
    },
    {
      username: 'kemnaker',
      name_mentri: 'kementrian ketenagakerjaan',
      password: await bcrypt.hash('kemnaker123', 10),
      role_id: userRole.id,
      category_id: categoryMap['kementrian ketenagakerjaan']
    },
    {
      username: 'bgn',
      name_mentri: 'badan gizi nasional',
      password: await bcrypt.hash('bgn123', 10),
      role_id: userRole.id,
      category_id: categoryMap['badan gizi nasional']
    },
    {
      username: 'lpptvri',
      name_mentri: 'televisi republik indonesia',
      password: await bcrypt.hash('lpptvri123', 10),
      role_id: userRole.id,
      category_id: categoryMap['televisi republik indonesia']
    },
    {
      username: 'lpprri',
      name_mentri: 'radio republik indonesia',
      password: await bcrypt.hash('lpprri123', 10),
      role_id: userRole.id,
      category_id: categoryMap['radio republik indonesia']
    }
  ];

  const allUsers = [...adminUsers, ...regularUsers];

  for (const user of allUsers) {
    await prisma.user.upsert({
      where: { username: user.username },
      update: {},
      create: {
        username: user.username,
        password: user.password,
        role_id: user.role_id,
        category_id: user.category_id,
        name_mentri: user.name_mentri,
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
