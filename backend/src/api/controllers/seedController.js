const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const response = require("../utils/response");

const prisma = new PrismaClient();

// Helper function to convert text to title case
const toTitleCase = (str) => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const seedController = {
  async truncateAndSeed(req, res) {
    try {
      // ===== TRUNCATE TABLES & RESET IDENTITY =====
      await prisma.$executeRawUnsafe(
        `TRUNCATE TABLE "DocumentReport" RESTART IDENTITY CASCADE`
      );
      await prisma.$executeRawUnsafe(
        `TRUNCATE TABLE "Document" RESTART IDENTITY CASCADE`
      );
      await prisma.$executeRawUnsafe(
        `TRUNCATE TABLE "User" RESTART IDENTITY CASCADE`
      );
      await prisma.$executeRawUnsafe(
        `TRUNCATE TABLE "Kategori" RESTART IDENTITY CASCADE`
      );
      await prisma.$executeRawUnsafe(
        `TRUNCATE TABLE "Role" RESTART IDENTITY CASCADE`
      );

      // ===== SEED ROLES =====
      const roles = [{ name: "admin" }, { name: "user" }];

      const createdRoles = await prisma.role.createMany({
        data: roles,
      });

      // ===== SEED CATEGORIES =====
      const categoriesRaw = [
        "kementrian komunikasi dan digital",
        "kementrian keuangan",
        "sekretaris jenderal DPR",
        "kementrian ketenagakerjaan",
        "badan gizi nasional",
        "televisi republik indonesia",
        "radio republik indonesia",
      ];

      const categories = categoriesRaw.map(name => ({
        name: toTitleCase(name.trim())
      }));

      const createdCategories = await prisma.kategori.createMany({
        data: categories,
      });

      // ===== FETCH CATEGORIES & ROLES (FOR ID MAPPING) =====
      const [allRoles, allCategories] = await Promise.all([
        prisma.role.findMany(),
        prisma.kategori.findMany(),
      ]);

      const categoryMap = {};
      allCategories.forEach((cat) => {
        categoryMap[cat.name] = cat.id;
      });

      const adminRoleId = allRoles.find((role) => role.name === "admin").id;
      const userRoleId = allRoles.find((role) => role.name === "user").id;

      // ===== SEED USERS =====
      const adminUsers = [
        {
          username: "sinar1",
          name_mentri: "Admin Sinar 1",
          password: await bcrypt.hash("sinar123", 10),
          role_id: adminRoleId,
          category_id: null,
        },
        {
          username: "sinar2",
          name_mentri: "Admin Sinar 2",
          password: await bcrypt.hash("sinar123", 10),
          role_id: adminRoleId,
          category_id: null,
        },
      ];

      const regularUsers = [
        {
          username: "Komdigi-1",
          name_mentri: "Kementrian Komunikasi Dan Digital",
          password: await bcrypt.hash("Hu8aj72HG", 10),
          role_id: userRoleId,
          category_id: categoryMap["Kementrian Komunikasi Dan Digital"],
        },
        {
          username: "Komdigi-2",
          name_mentri: "Kementrian Komunikasi Dan Digital",
          password: await bcrypt.hash("Hu9bf72WM", 10),
          role_id: userRoleId,
          category_id: categoryMap["Kementrian Komunikasi Dan Digital"],
        },
        {
          username: "Kemenkeu-1",
          name_mentri: "Kementrian Keuangan",
          password: await bcrypt.hash("Mq7afPP02", 10),
          role_id: userRoleId,
          category_id: categoryMap["Kementrian Keuangan"],
        },
        {
          username: "Kemenkeu-2",
          name_mentri: "Kementrian Keuangan",
          password: await bcrypt.hash("Mq6ajF2sP", 10),
          role_id: userRoleId,
          category_id: categoryMap["Kementrian Keuangan"],
        },
        {
          username: "Setjendpr-1",
          name_mentri: "Sekretaris Jenderal Dpr",
          password: await bcrypt.hash("kT8bR6aQ1", 10),
          role_id: userRoleId,
          category_id: categoryMap["Sekretaris Jenderal Dpr"],
        },
        {
          username: "Setjendpr-2",
          name_mentri: "Sekretaris Jenderal Dpr",
          password: await bcrypt.hash("G9tP4eLm7", 10),
          role_id: userRoleId,
          category_id: categoryMap["Sekretaris Jenderal Dpr"],
        },
        {
          username: "Kemnaker-1",
          name_mentri: "Kementrian Ketenagakerjaan",
          password: await bcrypt.hash("d3Vq6NfX2", 10),
          role_id: userRoleId,
          category_id: categoryMap["Kementrian Ketenagakerjaan"],
        },
        {
          username: "Kemnaker-2",
          name_mentri: "Kementrian Ketenagakerjaan",
          password: await bcrypt.hash("M1yR8zQw5", 10),
          role_id: userRoleId,
          category_id: categoryMap["Kementrian Ketenagakerjaan"],
        },
        {
          username: "Userbgn-1",
          name_mentri: "Badan Gizi Nasional",
          password: await bcrypt.hash("s5Kc9JtU4", 10),
          role_id: userRoleId,
          category_id: categoryMap["Badan Gizi Nasional"],
        },
        {
          username: "Userbgn-2",
          name_mentri: "Badan Gizi Nasional",
          password: await bcrypt.hash("Q2nW7hBp6", 10),
          role_id: userRoleId,
          category_id: categoryMap["Badan Gizi Nasional"],
        },
        {
          username: "Lpptvri-1",
          name_mentri: "Televisi Republik Indonesia",
          password: await bcrypt.hash("x8Dk1ZrF3", 10),
          role_id: userRoleId,
          category_id: categoryMap["Televisi Republik Indonesia"],
        },
        {
          username: "Lpptvri-2",
          name_mentri: "Televisi Republik Indonesia",
          password: await bcrypt.hash("H4uM9yTq2", 10),
          role_id: userRoleId,
          category_id: categoryMap["Televisi Republik Indonesia"],
        },
        {
          username: "Lpprri-1",
          name_mentri: "Radio Republik Indonesia",
          password: await bcrypt.hash("a6Rj3GvP7", 10),
          role_id: userRoleId,
          category_id: categoryMap["Radio Republik Indonesia"],
        },
        {
          username: "Lpprri-2",
          name_mentri: "Radio Republik Indonesia",
          password: await bcrypt.hash("L7cQ2zXk5", 10),
          role_id: userRoleId,
          category_id: categoryMap["Radio Republik Indonesia"],
        },
      ];

      const allUsers = [...adminUsers, ...regularUsers];

      await prisma.user.createMany({
        data: allUsers,
      });

      // ===== SUCCESS RESPONSE =====
      return response.successCreate(
        res,
        "Database truncated and seeded successfully",
        {
          roles: createdRoles.count,
          categories: createdCategories.count,
          users: allUsers.length,
        }
      );
    } catch (error) {
      console.error("Truncate and seed error:", error);
      return response.error(res, "Failed to truncate and seed database", 500);
    }
  },
};

module.exports = seedController;
