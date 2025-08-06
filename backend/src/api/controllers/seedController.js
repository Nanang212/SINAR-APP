const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const response = require("../utils/response");

const prisma = new PrismaClient();

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
      const categories = [
        { name: "kementrian komunikasi dan digital" },
        { name: "kementrian keuangan" },
        { name: "sekretaris jenderal DPR" },
        { name: "kementrian ketenagakerjaan" },
        { name: "badan gizi nasional" },
        { name: "televisi republik indonesia" },
        { name: "radio republik indonesia" },
      ];

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
          name_mentri: "kementrian komunikasi dan digital",
          password: await bcrypt.hash("komdigi123", 10),
          role_id: userRoleId,
          category_id: categoryMap["kementrian komunikasi dan digital"],
        },
        {
          username: "kemenkeu",
          name_mentri: "kementrian keuangan",
          password: await bcrypt.hash("kemenkeu123", 10),
          role_id: userRoleId,
          category_id: categoryMap["kementrian keuangan"],
        },
        {
          username: "setjendpr",
          name_mentri: "sekretaris jenderal DPR",
          password: await bcrypt.hash("setjendpr123", 10),
          role_id: userRoleId,
          category_id: categoryMap["sekretaris jenderal DPR"],
        },
        {
          username: "kemnaker",
          name_mentri: "kementrian ketenagakerjaan",
          password: await bcrypt.hash("kemnaker123", 10),
          role_id: userRoleId,
          category_id: categoryMap["kementrian ketenagakerjaan"],
        },
        {
          username: "bgn",
          name_mentri: "badan gizi nasional",
          password: await bcrypt.hash("bgn123", 10),
          role_id: userRoleId,
          category_id: categoryMap["badan gizi nasional"],
        },
        {
          username: "lpptvri",
          name_mentri: "televisi republik indonesia",
          password: await bcrypt.hash("lpptvri123", 10),
          role_id: userRoleId,
          category_id: categoryMap["televisi republik indonesia"],
        },
        {
          username: "lpprri",
          name_mentri: "radio republik indonesia",
          password: await bcrypt.hash("lpprri123", 10),
          role_id: userRoleId,
          category_id: categoryMap["radio republik indonesia"],
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
