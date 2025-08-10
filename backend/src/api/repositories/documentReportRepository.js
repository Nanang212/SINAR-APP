// ✅ FINAL VERSION - documentReportRepository.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { deleteReportMedia } = require("../utils/minioHelper");
const { baseUrl } = require("../../config/dotenv");

exports.findAllReports = async (params) => {
  const {
    page = 1,
    limit = 100,
    order = "asc",
    search = "",
    where = {},
    user, // ← user dari req.user
  } = params;

  const take = parseInt(limit, 10);
  const skip = (parseInt(page, 10) - 1) * take;

  // 🛡 Filtering berdasarkan role & category
  let whereClause = { ...where };

  const isAdmin = user?.role?.toLowerCase() === "admin";
  if (!isAdmin && user?.category_id) {
    whereClause = {
      ...whereClause,
      document: {
        kategori: {
          some: { id: user.category_id },
        },
      },
    };
  }
  // 🔍 Search
  if (search && search.trim() !== "") {
    whereClause = {
      ...whereClause,
      OR: [
        {
          description: {
            contains: search.trim(),
            mode: "insensitive",
          },
        },
        {
          original_name: {
            contains: search.trim(),
            mode: "insensitive",
          },
        },
        {
          document: {
            original_name: {
              contains: search.trim(),
              mode: "insensitive",
            },
          },
        },
      ],
    };
  }

  // ⬇ sisanya sama persis kayak punyamu sekarang
  const allReports = await prisma.documentReport.findMany({
    where: whereClause,
    select: {
      id: true,
      type: true,
      content: true,
      original_name: true,
      description: true,
      is_downloaded: true,
      downloaded_at: true,
      created_at: true,
      created_by: true,
      updated_at: true,
      updated_by: true,
      document: {
        select: {
          id: true,
          original_name: true,
          url: true,
        },
      },
      user: {
        select: {
          id: true,
          username: true,
        },
      },
    },
    orderBy: [
      { updated_at: order.toLowerCase() === "desc" ? "desc" : "asc" },
      { id: "desc" },
    ],
  });

  // Group reports by document_id
  const groupedByDocument = {};

  for (const report of allReports) {
    const documentId = report.document?.id;
    if (!documentId) continue;

    const documentKey = String(documentId);
    const type = report.type;

    const reportItem = {
      id: report.id,
      type: report.type,
      content: report.content,
      original_name: report.original_name,
      description: report.description,
      is_downloaded: report.is_downloaded,
      downloaded_at: report.downloaded_at,
      created_at: report.created_at,
      created_by: report.created_by,
      updated_at: report.updated_at,
      updated_by: report.updated_by,
      user: report.user,
      download_url:
        ["AUDIO", "VIDEO"].includes(report.type) && report.id
          ? `${baseUrl}/api/v1/admin/reports/download/${report.id}`
          : null,
      preview_url:
        ["AUDIO", "VIDEO"].includes(report.type) && report.id
          ? `${baseUrl}/api/v1/admin/reports/preview/${report.id}`
          : null,
    };

    if (!groupedByDocument[documentKey]) {
      groupedByDocument[documentKey] = {
        document: {
          id: report.document.id,
          original_name: report.document.original_name,
          url: `${baseUrl}/api/v1/documents/download/${report.document.id}`,
        },
        reports: {
          TEXT: [],
          LINK: [],
          AUDIO: [],
          VIDEO: [],
        },
      };
    }

    groupedByDocument[documentKey].reports[type].push(reportItem);
  }

  // Convert to array and sort by latest updated_at from each document group
  const groupedArray = Object.values(groupedByDocument);
  const sortedGroups = groupedArray.sort((a, b) => {
    // Get the latest updated_at from all reports in each document group
    const getLatestUpdatedAt = (documentGroup) => {
      let latestDate = null;
      Object.values(documentGroup.reports).forEach((reportTypeArray) => {
        reportTypeArray.forEach((report) => {
          if (
            !latestDate ||
            new Date(report.updated_at) > new Date(latestDate)
          ) {
            latestDate = report.updated_at;
          }
        });
      });
      return latestDate ? new Date(latestDate) : new Date(0);
    };

    const aLatestUpdate = getLatestUpdatedAt(a);
    const bLatestUpdate = getLatestUpdatedAt(b);

    if (order.toLowerCase() === "desc") {
      return bLatestUpdate - aLatestUpdate;
    }
    return aLatestUpdate - bLatestUpdate;
  });

  // Apply pagination to grouped documents
  const totalDocuments = sortedGroups.length;
  const paginatedData = sortedGroups.slice(skip, skip + take);

  return {
    total: totalDocuments,
    page: parseInt(page, 10),
    limit: take,
    data: paginatedData,
    totalPages: Math.ceil(totalDocuments / take),
    hasNext: skip + take < totalDocuments,
    hasPrev: parseInt(page, 10) > 1,
  };
};

exports.findReportById = async (id) => {
  const report = await prisma.documentReport.findFirst({
    where: { id },
    select: {
      id: true,
      type: true,
      content: true,
      original_name: true,
      description: true,
      is_downloaded: true,
      downloaded_at: true,
      created_at: true,
      created_by: true,
      updated_at: true,
      updated_by: true,
      document: {
        select: {
          id: true,
          original_name: true,
          url: true,
          kategori: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          username: true,
        },
      },
    },
  });

  if (!report) return null;

  return {
    ...report,
    document: report.document
      ? {
          ...report.document,
          url: `${baseUrl}/api/v1/documents/download/${report.document.id}`,
        }
      : null,
    download_url:
      ["AUDIO", "VIDEO"].includes(report.type) && report.id
        ? `${baseUrl}/api/v1/admin/reports/download/${report.id}`
        : null,
    preview_url:
      ["AUDIO", "VIDEO"].includes(report.type) && report.id
        ? `${baseUrl}/api/v1/admin/reports/preview/${report.id}`
        : null,
  };
};

exports.createReport = async ({ data, createdBy }) => {
  try {
    const allowedTypes = ["TEXT", "LINK", "AUDIO", "VIDEO"];
    if (!allowedTypes.includes(data.type)) {
      throw new Error(`Invalid report type: ${data.type}`);
    }

    const document = await prisma.document.findFirst({
      where: { id: +data.document_id },
      select: { is_downloaded: true },
    });

    if (!document) {
      return { success: false, code: 404, msg: "Document not found" };
    }

    if (!document.is_downloaded) {
      return {
        success: false,
        code: 400,
        msg: "Cannot create report: Document has not been downloaded yet.",
      };
    }

    const reportData = {
      type: data.type,
      content: data.content,
      original_name: data.original_name || null,
      description: data.description || null,
      user_id: data.user_id,
      document_id: parseInt(data.document_id),
      created_by: createdBy || null,
      updated_by: createdBy || null,
    };

    const newReport = await prisma.documentReport.create({
      data: reportData,
      include: {
        document: {
          select: {
            id: true,
            original_name: true,
            url: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return {
      success: true,
      message: "Report created successfully",
      data: {
        ...newReport,
        // Optional: Generate URL secara dinamis
        download_url:
          ["AUDIO", "VIDEO"].includes(data.type) && newReport.id
            ? `${baseUrl}/api/v1/admin/reports/download/${newReport.id}`
            : null,
        preview_url:
          ["AUDIO", "VIDEO"].includes(data.type) && newReport.id
            ? `${baseUrl}/api/v1/admin/reports/preview/${newReport.id}`
            : null,
      },
    };
  } catch (error) {
    console.error("Error in createReport:", error);
    return {
      success: false,
      code: 500,
      msg: error?.message || "Internal server error",
    };
  }
};

exports.updateReport = async (id, data, updatedBy) => {
  try {
    const existing = await prisma.documentReport.findFirst({ where: { id } });
    if (!existing) {
      return { success: false, code: 404, msg: "Report not found" };
    }

    // Validasi tipe baru jika ada
    if (data.type) {
      const allowedTypes = ["TEXT", "LINK", "AUDIO", "VIDEO"];
      if (!allowedTypes.includes(data.type)) {
        throw new Error(`Invalid report type: ${data.type}`);
      }
    }

    // 🔥 HAPUS FILE LAMA di MinIO jika type AUDIO/VIDEO dan content baru masuk
    const isReplacingMedia =
      ["AUDIO", "VIDEO"].includes(existing.type) &&
      data.content &&
      data.content !== existing.content;

    if (isReplacingMedia && existing.content) {
      // Jalankan delete file dari bucketReport
      await deleteReportMedia(existing.content); // pastikan `existing.content` berisi path yg benar (misal: "report/namafile.mp3")
    }

    const updated = await prisma.documentReport.update({
      where: { id },
      data: {
        ...data,
        updated_by: updatedBy || null,
      },
      include: {
        document: {
          select: {
            id: true,
            original_name: true,
            url: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return {
      success: true,
      message: "Report updated successfully",
      data: {
        ...updated,
        download_url:
          ["AUDIO", "VIDEO"].includes(updated.type) && updated.id
            ? `${baseUrl}/api/v1/admin/reports/download/${updated.id}`
            : null,
        preview_url:
          ["AUDIO", "VIDEO"].includes(updated.type) && updated.id
            ? `${baseUrl}/api/v1/admin/reports/preview/${updated.id}`
            : null,
      },
    };
  } catch (error) {
    console.error("Error in updateReport:", error);
    return {
      success: false,
      code: 500,
      msg: error?.message || "Internal server error",
    };
  }
};

exports.deleteReport = async (id) => {
  try {
    const existing = await prisma.documentReport.findFirst({ where: { id } });
    if (!existing) {
      return { success: false, code: 404, msg: "Report not found" };
    }

    const isMedia = ["AUDIO", "VIDEO"].includes(existing.type);
    if (isMedia && existing.content) {
      await deleteReportMedia(existing.content); // ✅ hapus file dari MinIO
    }

    const deleted = await prisma.documentReport.delete({ where: { id } });
    return {
      success: true,
      message: "Report deleted",
      data: deleted,
    };
  } catch (error) {
    console.error("Error in deleteReport:", error);
    return {
      success: false,
      code: 500,
      msg: "Internal server error",
    };
  }
};

exports.markReportAsDownloaded = async (id, updatedBy) => {
  try {
    const updated = await prisma.documentReport.update({
      where: { id },
      data: {
        is_downloaded: true,
        downloaded_at: new Date(),
        updated_by: updatedBy || null,
      },
    });

    return {
      success: true,
      message: "Report marked as downloaded",
      data: updated,
    };
  } catch (error) {
    console.error("Error in markReportAsDownloaded:", error);
    return {
      success: false,
      code: 500,
      msg: "Internal server error",
    };
  }
};
