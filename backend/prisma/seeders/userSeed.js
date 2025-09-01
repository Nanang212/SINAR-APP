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
      username: 'Komdigi-1',
      name_mentri: 'kementrian komunikasi dan digital',
      password: await bcrypt.hash('Hu8aj72HG', 10),
      role_id: userRole.id,
      category_id: categoryMap['kementrian komunikasi dan digital']
    },
    {
      username: 'Komdigi-2',
      name_mentri: 'kementrian komunikasi dan digital',
      password: await bcrypt.hash('Hu9bf72WM', 10),
      role_id: userRole.id,
      category_id: categoryMap['kementrian komunikasi dan digital']
    },
    {
      username: 'Kemenkeu-1',
      name_mentri: 'kementrian keuangan',
      password: await bcrypt.hash('Mq7afPP02', 10),
      role_id: userRole.id,
      category_id: categoryMap['kementrian keuangan']
    },
    {
      username: 'Kemenkeu-2',
      name_mentri: 'kementrian keuangan',
      password: await bcrypt.hash('Mq6ajF2sP', 10),
      role_id: userRole.id,
      category_id: categoryMap['kementrian keuangan']
    },
    {
      username: 'Setjendpr-1',
      name_mentri: 'sekretaris jenderal DPR',
      password: await bcrypt.hash('kT8bR6aQ1', 10),
      role_id: userRole.id,
      category_id: categoryMap['sekretaris jenderal DPR']
    },
    {
      username: 'Setjendpr-2',
      name_mentri: 'sekretaris jenderal DPR',
      password: await bcrypt.hash('G9tP4eLm7', 10),
      role_id: userRole.id,
      category_id: categoryMap['sekretaris jenderal DPR']
    },
    {
      username: 'Kemnaker-1',
      name_mentri: 'kementrian ketenagakerjaan',
      password: await bcrypt.hash('d3Vq6NfX2', 10),
      role_id: userRole.id,
      category_id: categoryMap['kementrian ketenagakerjaan']
    },
    {
      username: 'Kemnaker-2',
      name_mentri: 'kementrian ketenagakerjaan',
      password: await bcrypt.hash('M1yR8zQw5', 10),
      role_id: userRole.id,
      category_id: categoryMap['kementrian ketenagakerjaan']
    },
    {
      username: 'Userbgn-1',
      name_mentri: 'badan gizi nasional',
      password: await bcrypt.hash('s5Kc9JtU4', 10),
      role_id: userRole.id,
      category_id: categoryMap['badan gizi nasional']
    },
    {
      username: 'Userbgn-2',
      name_mentri: 'badan gizi nasional',
      password: await bcrypt.hash('Q2nW7hBp6', 10),
      role_id: userRole.id,
      category_id: categoryMap['badan gizi nasional']
    },
    {
      username: 'Lpptvri-1',
      name_mentri: 'televisi republik indonesia',
      password: await bcrypt.hash('x8Dk1ZrF3', 10),
      role_id: userRole.id,
      category_id: categoryMap['televisi republik indonesia']
    },
    {
      username: 'Lpptvri-2',
      name_mentri: 'televisi republik indonesia',
      password: await bcrypt.hash('H4uM9yTq2', 10),
      role_id: userRole.id,
      category_id: categoryMap['televisi republik indonesia']
    },
    {
      username: 'Lpprri-1',
      name_mentri: 'radio republik indonesia',
      password: await bcrypt.hash('a6Rj3GvP7', 10),
      role_id: userRole.id,
      category_id: categoryMap['radio republik indonesia']
    },
    {
      username: 'Lpprri-2',
      name_mentri: 'radio republik indonesia',
      password: await bcrypt.hash('L7cQ2zXk5', 10),
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
