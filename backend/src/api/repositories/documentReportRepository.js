// ✅ FINAL VERSION - documentReportRepository.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { findAllBuilder } = require("../utils/query");

// ✅ Find All Reports
exports.findAllReports = async (params) => {
  return await findAllBuilder({
    model: prisma.documentReport,
    params: {
      ...params,
      where: {
        ...params?.where,
      },
    },
    customSelect: {
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
  });
};

// 🔍 Find Report by ID
exports.findReportById = async (id) => {
  return await prisma.documentReport.findFirst({
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
};

// ➕ Create Report
exports.createReport = async ({ data, createdBy }) => {
  try {
    const allowedTypes = ["TEXT", "LINK", "AUDIO", "VIDEO"];
    if (!allowedTypes.includes(data.type)) {
      throw new Error(`Invalid report type: ${data.type}`);
    }

    const newReport = await prisma.documentReport.create({
      data: {
        type: data.type, // ✅ now string not enum
        content: data.content,
        original_name: data.original_name,
        description: data.description,
        user_id: data.user_id,
        document_id: parseInt(data.document_id),
        created_by: createdBy || null,
        updated_by: createdBy || null,
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
      message: "Report created successfully",
      data: newReport,
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

// ✏️ Update Report
exports.updateReport = async (id, data, updatedBy) => {
  try {
    const existing = await prisma.documentReport.findFirst({ where: { id } });
    if (!existing) {
      return { success: false, code: 404, msg: "Report not found" };
    }

    if (data.type) {
      const allowedTypes = ["TEXT", "LINK", "AUDIO", "VIDEO"];
      if (!allowedTypes.includes(data.type)) {
        throw new Error(`Invalid report type: ${data.type}`);
      }
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
      data: updated,
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

// ❌ Delete Report
exports.deleteReport = async (id) => {
  try {
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

// ✅ Mark Report as Downloaded
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
