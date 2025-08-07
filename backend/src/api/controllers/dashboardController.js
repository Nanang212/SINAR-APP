const dashboardService = require("../services/dashboardService");
const { successUpdate, errorStatus } = require("../utils/response");

exports.getDocumentStatsByMonth = async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    
    const stats = await dashboardService.getDocumentStatsByMonth(currentYear);
    
    successUpdate(res, "Successfully fetched document statistics by month", stats);
  } catch (err) {
    console.error("getDocumentStatsByMonth Error:", err);
    errorStatus(res, err.code || 500, err.message);
  }
};

exports.getReportStatsByMonth = async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    
    const stats = await dashboardService.getReportStatsByMonth(currentYear);
    
    successUpdate(res, "Successfully fetched report statistics by month", stats);
  } catch (err) {
    console.error("getReportStatsByMonth Error:", err);
    errorStatus(res, err.code || 500, err.message);
  }
};

exports.getUserStats = async (req, res) => {
  try {
    const stats = await dashboardService.getUserStats();
    
    successUpdate(res, "Successfully fetched user statistics", stats);
  } catch (err) {
    console.error("getUserStats Error:", err);
    errorStatus(res, err.code || 500, err.message);
  }
};

exports.getDashboardOverview = async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    
    const [documentStats, reportStats, userStats] = await Promise.all([
      dashboardService.getDocumentStatsByMonth(currentYear),
      dashboardService.getReportStatsByMonth(currentYear),
      dashboardService.getUserStats()
    ]);
    
    const overview = {
      documentStatsByMonth: documentStats,
      reportStatsByMonth: reportStats,
      userStats: userStats,
      year: currentYear
    };
    
    successUpdate(res, "Successfully fetched dashboard overview", overview);
  } catch (err) {
    console.error("getDashboardOverview Error:", err);
    errorStatus(res, err.code || 500, err.message);
  }
};