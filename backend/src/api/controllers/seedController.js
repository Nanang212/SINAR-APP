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
          username: "komdigi",
          name_mentri: "Kementrian Komunikasi Dan Digital",
          password: await bcrypt.hash("komdigi123", 10),
          role_id: userRoleId,
          category_id: categoryMap["Kementrian Komunikasi Dan Digital"],
        },
        {
          username: "kemenkeu",
          name_mentri: "Kementrian Keuangan",
          password: await bcrypt.hash("kemenkeu123", 10),
          role_id: userRoleId,
          category_id: categoryMap["Kementrian Keuangan"],
        },
        {
          username: "setjendpr",
          name_mentri: "Sekretaris Jenderal Dpr",
          password: await bcrypt.hash("setjendpr123", 10),
          role_id: userRoleId,
          category_id: categoryMap["Sekretaris Jenderal Dpr"],
        },
        {
          username: "kemnaker",
          name_mentri: "Kementrian Ketenagakerjaan",
          password: await bcrypt.hash("kemnaker123", 10),
          role_id: userRoleId,
          category_id: categoryMap["Kementrian Ketenagakerjaan"],
        },
        {
          username: "bgn",
          name_mentri: "Badan Gizi Nasional",
          password: await bcrypt.hash("bgn123", 10),
          role_id: userRoleId,
          category_id: categoryMap["Badan Gizi Nasional"],
        },
        {
          username: "lpptvri",
          name_mentri: "Televisi Republik Indonesia",
          password: await bcrypt.hash("lpptvri123", 10),
          role_id: userRoleId,
          category_id: categoryMap["Televisi Republik Indonesia"],
        },
        {
          username: "lpprri",
          name_mentri: "Radio Republik Indonesia",
          password: await bcrypt.hash("lpprri123", 10),
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
