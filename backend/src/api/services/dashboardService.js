const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getDocumentStatsByMonth = async (year) => {
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year + 1, 0, 1);

  console.log(`Fetching document stats for year: ${year}`);
  console.log(
    `Date range: ${startOfYear.toISOString()} to ${endOfYear.toISOString()}`
  );

  // Ambil semua dokumen dalam tahun tersebut
  const documents = await prisma.document.findMany({
    where: {
      uploaded_at: {
        gte: startOfYear,
        lt: endOfYear,
      },
      is_active: true,
    },
    select: {
      uploaded_at: true,
    },
  });

  console.log(`Found ${documents.length} documents for year ${year}`);

  // Buat array untuk 12 bulan dengan nilai default 0
  const monthlyData = Array.from({ length: 12 }, (_, index) => ({
    month: index + 1,
    month_name: getMonthName(index + 1),
    total_documents: 0,
  }));

  // Hitung dokumen per bulan
  documents.forEach((doc) => {
    const month = doc.uploaded_at.getMonth() + 1; // getMonth() returns 0-11, so add 1
    const monthIndex = month - 1;
    monthlyData[monthIndex].total_documents++;
  });

  const totalDocumentsYear = monthlyData.reduce(
    (sum, month) => sum + month.total_documents,
    0
  );

  console.log(`Total documents processed: ${totalDocumentsYear}`);
  console.log(
    "Monthly breakdown:",
    monthlyData.map((m) => `${m.month_name}: ${m.total_documents}`)
  );

  return {
    year,
    monthly_stats: monthlyData,
    total_documents_year: totalDocumentsYear,
  };
};

const getReportStatsByMonth = async (year) => {
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year + 1, 0, 1);

  console.log(`📊 Fetching report stats for year: ${year}`);
  console.log(
    `📅 Date range: ${startOfYear.toISOString()} to ${endOfYear.toISOString()}`
  );

  // Ambil semua reports yang dibuat dalam tahun itu
  const reports = await prisma.documentReport.findMany({
    where: {
      created_at: {
        gte: startOfYear,
        lt: endOfYear,
      },
    },
    select: {
      created_at: true,
      type: true,
    },
  });

  console.log(`🧾 Found ${reports.length} reports for year ${year}`);

  // Cari semua tipe laporan unik (TEXT, LINK, AUDIO, VIDEO, dsb)
  const allTypes = [...new Set(reports.map((r) => r.type))];

  // Buat struktur data bulanan
  const monthlyStats = Array.from({ length: 12 }, (_, index) => ({
    month: index + 1,
    month_name: getMonthName(index + 1),
    total_items: 0,
    by_type: Object.fromEntries(allTypes.map((type) => [type, 0])),
  }));

  // Hitung jumlah laporan per bulan dan per tipe
  for (const report of reports) {
    const monthIndex = report.created_at.getMonth(); // 0-11
    monthlyStats[monthIndex].total_items++;
    monthlyStats[monthIndex].by_type[report.type]++;
  }

  const totalItemsYear = monthlyStats.reduce(
    (sum, m) => sum + m.total_items,
    0
  );

  console.log(`📈 Total reports: ${totalItemsYear}`);
  console.log("📅 Monthly breakdown:");
  monthlyStats.forEach((m) => {
    console.log(`- ${m.month_name}: ${m.total_items}`);
  });

  return {
    year,
    monthly_stats: monthlyStats,
    types: allTypes,
    total_items_year: totalItemsYear,
  };
};

const getUserStats = async () => {
  console.log('👥 Fetching user statistics');
  
  // Hitung total user aktif dan non-aktif
  const userStats = await prisma.user.groupBy({
    by: ['is_active'],
    _count: {
      id: true
    }
  });

  // Hitung user berdasarkan role
  const usersByRole = await prisma.user.groupBy({
    by: ['role_id'],
    _count: {
      id: true
    }
  });

  // Get role names
  const roles = await prisma.role.findMany({
    select: {
      id: true,
      name: true
    }
  });

  const roleMap = Object.fromEntries(roles.map(r => [r.id, r.name]));

  let totalActive = 0;
  let totalInactive = 0;

  userStats.forEach(stat => {
    if (stat.is_active) {
      totalActive = stat._count.id;
    } else {
      totalInactive = stat._count.id;
    }
  });

  const byRole = usersByRole.map(stat => ({
    role_id: stat.role_id,
    role_name: roleMap[stat.role_id] || 'Unknown',
    total_users: stat._count.id
  }));

  const totalUsers = totalActive + totalInactive;

  console.log(`👥 Total users: ${totalUsers} (Active: ${totalActive}, Inactive: ${totalInactive})`);
  console.log('📊 Users by role:', byRole);

  return {
    total_users: totalUsers,
    active_users: totalActive,
    inactive_users: totalInactive,
    by_role: byRole
  };
};

const getMonthName = (monthNumber) => {
  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  return months[monthNumber - 1];
};

module.exports = {
  getDocumentStatsByMonth,
  getReportStatsByMonth,
  getUserStats,
};

