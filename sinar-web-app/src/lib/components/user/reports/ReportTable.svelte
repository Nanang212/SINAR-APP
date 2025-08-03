<script lang="ts">
  import { onMount } from "svelte";
  import ConfirmationModal from '@/lib/components/ui/ConfirmationModal.svelte';
  import { modalToastStore } from '@/lib/stores/modal-toast';

  interface Report {
    id: string;
    title: string;
    filename: string;
    original_name: string;
    url: string;
    is_downloaded: boolean;
    created_at: string;
    username_created: string;
    description: string | null;
    iconColor: string;
  }

  interface $$Props {
    fetchOnMount?: boolean;
    onDelete?: (report: Report) => void;
    onRefresh?: () => void;
    onRowClick?: (report: any) => void;
  }

  let {
    fetchOnMount = false,
    onDelete,
    onRefresh,
    onRowClick,
  }: $$Props = $props();

  // Component state
  let isLoading = $state(false);
  let error = $state<string | null>(null);
  let reports = $state<Report[]>([]);
  let apiReports = $state<any[]>([]);

  // Transform API report to table format
  function transformApiReport(apiReport: any): Report {
    try {
      return {
        id: apiReport.id.toString(),
        title: apiReport.title || "Untitled",
        filename: apiReport.filename || "Unknown file",
        original_name: apiReport.original_name || apiReport.filename || "Unknown file",
        url: apiReport.url || "",
        is_downloaded: apiReport.is_downloaded || false,
        created_at: apiReport.created_at,
        username_created: apiReport.username_created || "Unknown",
        description: apiReport.description,
        iconColor: getIconColor(apiReport.filename || apiReport.original_name || ""),
      };
    } catch (error) {
      console.error("Error transforming report:", error, apiReport);
      return {
        id: apiReport.id?.toString() || "unknown",
        title: "Error loading report",
        filename: "unknown",
        original_name: "unknown",
        url: "",
        is_downloaded: false,
        created_at: new Date().toISOString(),
        username_created: "Unknown",
        description: null,
        iconColor: "text-gray-500",
      };
    }
  }

  // Get icon color based on file extension
  function getIconColor(filename: string): string {
    const extension = filename.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "pdf":
        return "text-red-500";
      case "doc":
      case "docx":
        return "text-blue-500";
      case "xls":
      case "xlsx":
        return "text-green-500";
      case "ppt":
      case "pptx":
        return "text-orange-500";
      default:
        return "text-gray-500";
    }
  }

  // Fetch all reports (mock data for now)
  async function fetchReports() {
    console.log("Starting fetchReports...");
    isLoading = true;
    error = null;

    try {
      // Mock data for demonstration
      const mockReports = [
        {
          id: 1,
          title: "Monthly Sales Report",
          filename: "sales_report_jan.pdf",
          original_name: "sales_report_jan.pdf",
          url: "/reports/sales_report_jan.pdf",
          is_downloaded: true,
          created_at: "2024-01-15T10:30:00Z",
          username_created: "john_doe",
          description: "Monthly sales analysis for January 2024",
        },
        {
          id: 2,
          title: "Financial Summary Q1",
          filename: "financial_q1.xlsx",
          original_name: "financial_summary_q1_2024.xlsx",
          url: "/reports/financial_q1.xlsx",
          is_downloaded: false,
          created_at: "2024-03-31T15:45:00Z",
          username_created: "jane_smith",
          description: "Quarterly financial summary",
        },
        {
          id: 3,
          title: "Project Status Report",
          filename: "project_status.docx",
          original_name: "project_status_march.docx",
          url: "/reports/project_status.docx",
          is_downloaded: true,
          created_at: "2024-03-20T09:15:00Z",
          username_created: "bob_wilson",
          description: null,
        }
      ];

      apiReports = mockReports;
      reports = mockReports.map(transformApiReport);
      totalRecords = mockReports.length;
      error = null;
    } catch (err) {
      error = err instanceof Error ? err.message : "Unknown error occurred";
      reports = [];
      apiReports = [];
      totalRecords = 0;
      console.error("Fetch Error:", err);
    } finally {
      isLoading = false;
    }
  }

  // Handle refresh
  async function handleRefresh() {
    await fetchReports();
    onRefresh?.();
  }

  // Fetch on mount if required
  onMount(() => {
    if (fetchOnMount) {
      fetchReports();
    }

    // Add window focus listener to refresh data after download
    const handleWindowFocus = async () => {
      if (pendingDownloadRefresh) {
        console.log('Window regained focus, refreshing report data after download...');
        pendingDownloadRefresh = false;
        await fetchReports();
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    
    return () => {
      window.removeEventListener('focus', handleWindowFocus);
    };
  });

  // Public method to fetch reports (called from parent)
  export function loadReports() {
    return fetchReports();
  }

  // Public method to set search term (called from parent)
  export function setSearchTerm(term: string) {
    searchTerm = term;
    currentPage = 1; // Reset to first page when searching
  }

  // Table state
  let searchTerm = $state("");
  let sortField = $state<keyof Report | null>(null);
  let sortDirection = $state<"asc" | "desc">("asc");
  let currentPage = $state(1);
  let pageSize = $state(10);

  // Modal state
  let showDeleteModal = $state(false);
  let reportToDelete = $state<Report | null>(null);
  let isDeleting = $state(false);

  // Pagination state
  let totalRecords = $state(0);

  // Client-side filtering and pagination
  const filteredData = $derived(() => {
    let filtered = reports;

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (report) =>
          report.title.toLowerCase().includes(term) ||
          report.original_name.toLowerCase().includes(term) ||
          report.username_created.toLowerCase().includes(term) ||
          (report.description && report.description.toLowerCase().includes(term))
      );
    }

    return filtered;
  });

  const paginatedData = $derived(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredData().slice(startIndex, endIndex);
  });

  const totalPages = $derived(() =>
    Math.ceil(filteredData().length / pageSize)
  );

  function handleSearchChange(event: Event) {
    const input = event.target as HTMLInputElement;
    searchTerm = input.value;
    currentPage = 1; // Reset to first page when searching
  }

  function handlePageChange(newPage: number) {
    if (newPage >= 1 && newPage <= totalPages()) {
      currentPage = newPage;
    }
  }

  function handleSort(field: keyof Report) {
    if (sortField === field) {
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      sortField = field;
      sortDirection = "asc";
    }
  }

  function getSortIcon(field: keyof Report) {
    if (sortField !== field) return "↕";
    return sortDirection === "asc" ? "↑" : "↓";
  }

  function handleDelete(report: Report) {
    reportToDelete = report;
    showDeleteModal = true;
  }

  async function confirmDelete() {
    if (!reportToDelete) return;

    isDeleting = true;
    try {
      // Mock delete - replace with actual API call
      modalToastStore.success('Report deleted successfully!');
      
      // Calculate if current page will be empty after deletion
      const remainingRecords = totalRecords - 1;
      const maxPageAfterDelete = Math.ceil(remainingRecords / pageSize);
      
      // If current page would be empty after delete, go to previous page
      if (currentPage > maxPageAfterDelete && maxPageAfterDelete > 0) {
        currentPage = maxPageAfterDelete;
      }
      
      // Refresh the report list after successful deletion
      await fetchReports();
      onDelete?.(reportToDelete);
    } catch (error) {
      console.error('Delete failed:', error);
      modalToastStore.error('Failed to delete report: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      isDeleting = false;
      showDeleteModal = false;
      reportToDelete = null;
    }
  }

  function cancelDelete() {
    showDeleteModal = false;
    reportToDelete = null;
  }

  function handleRowClick(report: Report) {
    // Find the corresponding API report
    const apiReport = apiReports.find(apiReport => apiReport.id.toString() === report.id);
    if (apiReport && onRowClick) {
      onRowClick(apiReport);
    }
  }

  // Track if we need to refresh after download
  let pendingDownloadRefresh = $state(false);

  async function handleDownload(report: Report) {
    try {
      // Mock download - replace with actual download logic
      console.log('Downloading report:', report.original_name);
      modalToastStore.success('Report downloaded successfully!');
      pendingDownloadRefresh = true;
    } catch (error) {
      console.error('Download failed:', error);
      modalToastStore.error('Download failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
  }
</script>

<div class="pl-6 pr-8 pb-6 pt-12">
  <!-- Loading State -->
  {#if isLoading}
    <div class="flex justify-center items-center py-12">
      <div class="flex items-center space-x-2">
        <svg
          class="w-6 h-6 text-blue-600 animate-spin"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        <span class="text-gray-700">Loading reports...</span>
      </div>
    </div>
  {:else}
    <!-- Data Table -->
    <div class="mt-8 pr-4">
      <table class="w-full divide-y divide-gray-200 border border-gray-200">
        <thead class="bg-gray-50 sticky top-[60px] z-10">
          <tr>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 bg-gray-50 border-r border-gray-200"
              onclick={() => handleSort("title")}
            >
              <div class="flex items-center space-x-1">
                <span>Report</span>
                <span class="text-gray-400">{getSortIcon("title")}</span>
              </div>
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 bg-gray-50 border-r border-gray-200"
              onclick={() => handleSort("username_created")}
            >
              <div class="flex items-center space-x-1">
                <span>Created By</span>
                <span class="text-gray-400"
                  >{getSortIcon("username_created")}</span
                >
              </div>
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 bg-gray-50 border-r border-gray-200"
              onclick={() => handleSort("is_downloaded")}
            >
              <div class="flex items-center space-x-1">
                <span>Downloaded</span>
                <span class="text-gray-400">{getSortIcon("is_downloaded")}</span
                >
              </div>
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 bg-gray-50 border-r border-gray-200"
              onclick={() => handleSort("created_at")}
            >
              <div class="flex items-center space-x-1">
                <span>Created Date</span>
                <span class="text-gray-400">{getSortIcon("created_at")}</span>
              </div>
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {#each paginatedData() as report (report.id)}
            <tr class="hover:bg-gray-50 cursor-pointer border-b border-gray-200" onclick={() => handleRowClick(report)}>
              <td class="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                <div class="flex items-center">
                  <svg
                    class="h-8 w-8 {report.iconColor} mr-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 2v10H4V5h12z"
                      clip-rule="evenodd"
                    />
                    <path d="M6 7h8v1H6V7zM6 9h8v1H6V9zM6 11h6v1H6v-1zM6 13h4v1H6v-1z" />
                  </svg>
                  <div>
                    <div class="text-sm font-medium text-gray-900">
                      {report.title}
                    </div>
                    <div class="text-sm text-gray-500">{report.original_name}</div>
                    {#if report.description}
                      <div class="text-xs text-gray-400 mt-1">{report.description}</div>
                    {/if}
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                <div class="text-sm text-gray-900">{report.username_created}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {report.is_downloaded
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'}"
                >
                  {report.is_downloaded ? "Downloaded" : "Not Downloaded"}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                {formatDate(report.created_at)}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex items-center" onclick={(e) => e.stopPropagation()}>
                  <div class="relative group">
                    <button
                      onclick={() => handleDownload(report)}
                      class="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                      aria-label="Download report"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-4-4m4 4l4-4m5-7V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-1" />
                      </svg>
                    </button>
                    <div class="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      Download
                    </div>
                  </div>
                  
                  <!-- Divider -->
                  <div class="h-4 w-px bg-gray-300 mx-2"></div>
                  
                  <div class="relative group">
                    <button
                      class="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                      onclick={() => handleDelete(report)}
                      aria-label="Delete report"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    <div class="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      Delete
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Empty State -->
    {#if paginatedData().length === 0}
      <div class="text-center py-12">
        <svg
          class="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">
          No reports found
        </h3>
        <p class="mt-1 text-sm text-gray-500">
          {searchTerm
            ? "Try adjusting your search terms."
            : "Get started by creating some reports."}
        </p>
      </div>
    {/if}

    <!-- Pagination -->
    <div class="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 bg-white sticky bottom-0 z-10">
      <div class="text-sm text-gray-700">
        Showing <span class="font-medium">{Math.min((currentPage - 1) * pageSize + 1, filteredData().length)}</span>
        to
        <span class="font-medium"
          >{Math.min(currentPage * pageSize, filteredData().length)}</span
        >
        of <span class="font-medium">{filteredData().length}</span> results
        {#if searchTerm.trim()}
          <span class="text-gray-500">(filtered from {totalRecords} total)</span>
        {/if}
      </div>

      <div class="flex items-center space-x-2">
        <button
          onclick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          class="px-3 py-1 text-sm text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          First
        </button>

        <button
          onclick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          class="px-3 py-1 text-sm text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        <span
          class="px-3 py-1 text-sm text-white bg-blue-600 border border-blue-600 rounded-md"
        >
          {currentPage} of {Math.max(1, totalPages())}
        </span>

        <button
          onclick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages()}
          class="px-3 py-1 text-sm text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>

        <button
          onclick={() => handlePageChange(totalPages())}
          disabled={currentPage >= totalPages()}
          class="px-3 py-1 text-sm text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Last
        </button>
      </div>
    </div>
  {/if}
</div>

<!-- Delete Confirmation Modal -->
<ConfirmationModal
  isOpen={showDeleteModal}
  title="Delete Report"
  message={`Are you sure you want to delete "${reportToDelete?.title}"? This action cannot be undone.`}
  confirmText="Delete"
  cancelText="Cancel"
  confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
  onConfirm={confirmDelete}
  onCancel={cancelDelete}
  isLoading={isDeleting}
/>