<script lang="ts">
  import { onMount } from "svelte";
  import { reportService, type ReportDocument, type ReportItem } from '$lib/services/reports/report.service';
  import ConfirmationModal from '@/lib/components/ui/ConfirmationModal.svelte';
  import { modalToastStore } from '@/lib/stores/modal-toast';

  interface $$Props {
    fetchOnMount?: boolean;
    onDelete?: (report: ReportItem) => void;
    onRefresh?: () => void;
    onRowClick?: (report: ReportItem) => void;
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
  let reportDocuments = $state<ReportDocument[]>([]);

  // Get total reports count for a document
  function getTotalReportsCount(doc: ReportDocument): number {
    return (doc.reports.TEXT?.length || 0) +
           (doc.reports.LINK?.length || 0) +
           (doc.reports.AUDIO?.length || 0) +
           (doc.reports.VIDEO?.length || 0);
  }

  // Get report types summary for a document
  function getReportTypesSummary(doc: ReportDocument): string {
    const types: string[] = [];
    if (doc.reports.TEXT?.length) types.push(`${doc.reports.TEXT.length} Text`);
    if (doc.reports.LINK?.length) types.push(`${doc.reports.LINK.length} Link`);
    if (doc.reports.AUDIO?.length) types.push(`${doc.reports.AUDIO.length} Audio`);
    if (doc.reports.VIDEO?.length) types.push(`${doc.reports.VIDEO.length} Video`);
    return types.join(', ');
  }

  // Get latest report date for sorting
  function getLatestReportDate(doc: ReportDocument): string {
    const allReports = [
      ...(doc.reports.TEXT || []),
      ...(doc.reports.LINK || []),
      ...(doc.reports.AUDIO || []),
      ...(doc.reports.VIDEO || [])
    ];
    
    if (allReports.length === 0) return '';
    
    const latestReport = allReports.reduce((latest, current) => 
      new Date(current.created_at) > new Date(latest.created_at) ? current : latest
    );
    
    return latestReport.created_at;
  }

  // Fetch all reports using the new grouped format
  async function fetchReports() {
    console.log("Starting fetchReports...");
    isLoading = true;
    error = null;

    try {
      const response = await reportService.getAllReportsAdmin();
      
      if (response.status && response.data) {
        reportDocuments = response.data;
        error = null;
      } else {
        error = response.message || 'Failed to fetch reports';
        reportDocuments = [];
      }
    } catch (err) {
      error = err instanceof Error ? err.message : "Unknown error occurred";
      reportDocuments = [];
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
  });

  // Public method to fetch reports (called from parent)
  export function loadReports() {
    return fetchReports();
  }

  // Public method to set search term (called from parent)
  export function setSearchTerm(term: string) {
    searchTerm = term;
    currentPage = 1;
  }

  // Modal state
  let showDeleteModal = $state(false);
  let reportToDelete = $state<ReportItem | null>(null);
  let isDeleting = $state(false);
  
  // Detail modal state
  let showDetailModal = $state(false);
  let selectedDocument = $state<ReportDocument | null>(null);
  
  // Table state
  let searchTerm = $state("");
  let sortField = $state<string | null>(null);
  let sortDirection = $state<"asc" | "desc">("asc");
  let currentPage = $state(1);
  let pageSize = $state(10);

  // Client-side filtering and sorting
  const filteredData = $derived(() => {
    let filtered = reportDocuments;

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((doc: ReportDocument) => {
        // Search in document name
        if (doc.document.original_name.toLowerCase().includes(term)) {
          return true;
        }
        
        // Search in all report content and users
        const allReports = [
          ...(doc.reports.TEXT || []),
          ...(doc.reports.LINK || []),
          ...(doc.reports.AUDIO || []),
          ...(doc.reports.VIDEO || [])
        ];
        
        return allReports.some(report => 
          report.content.toLowerCase().includes(term) ||
          report.user.username.toLowerCase().includes(term) ||
          (report.description && report.description.toLowerCase().includes(term))
        );
      });
    }

    // Apply sorting
    if (sortField) {
      filtered = [...filtered].sort((a: ReportDocument, b: ReportDocument) => {
        let aVal: any, bVal: any;
        
        switch (sortField) {
          case 'document_name':
            aVal = a.document.original_name;
            bVal = b.document.original_name;
            break;
          case 'total_reports':
            aVal = getTotalReportsCount(a);
            bVal = getTotalReportsCount(b);
            break;
          case 'created_at':
            aVal = getLatestReportDate(a);
            bVal = getLatestReportDate(b);
            break;
          default:
            return 0;
        }

        if (aVal === bVal) return 0;
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return -1;
        if (bVal == null) return 1;

        let comparison = 0;
        if (aVal > bVal) comparison = 1;
        if (aVal < bVal) comparison = -1;

        return sortDirection === "desc" ? comparison * -1 : comparison;
      });
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
    currentPage = 1;
  }

  function handlePageChange(newPage: number) {
    if (newPage >= 1 && newPage <= totalPages()) {
      currentPage = newPage;
    }
  }

  function handleSort(field: string) {
    if (sortField === field) {
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      sortField = field;
      sortDirection = "asc";
    }
  }

  function getSortIcon(field: string) {
    if (sortField !== field) return "↕";
    return sortDirection === "asc" ? "↑" : "↓";
  }

  function handleDelete(report: ReportItem) {
    reportToDelete = report;
    showDeleteModal = true;
  }

  async function confirmDelete() {
    if (!reportToDelete) return;

    isDeleting = true;
    try {
      const response = await reportService.deleteReport(reportToDelete.id);
      
      if (response.status) {
        modalToastStore.success('Report deleted successfully!');
        await fetchReports();
        onDelete?.(reportToDelete);
      } else {
        modalToastStore.error(response.message || 'Failed to delete report');
      }
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

  function handleRowClick(doc: ReportDocument) {
    // For now, just show details when row is clicked
    handleShowDetails(doc);
  }
  
  function handleShowDetails(doc: ReportDocument) {
    selectedDocument = doc;
    showDetailModal = true;
  }
  
  function closeDetailModal() {
    showDetailModal = false;
    selectedDocument = null;
  }

  async function handleDownload(report: ReportItem) {
    try {
      if (report.type === 'VIDEO') {
        await reportService.downloadVideo(report.id, report.original_name);
      } else if (report.type === 'AUDIO') {
        await reportService.downloadAudio(report.id, report.original_name);
      } else if (report.download_url) {
        window.open(report.download_url, '_blank');
      }
      modalToastStore.success('Download started successfully!');
    } catch (error) {
      console.error('Download failed:', error);
      modalToastStore.error('Download failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  function handlePreview(report: ReportItem) {
    if (report.preview_url) {
      window.open(report.preview_url, '_blank');
    } else if (report.type === 'LINK') {
      window.open(report.content, '_blank');
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
    <!-- Search Input -->
    <div class="mb-6">
      <div class="relative">
        <input
          type="text"
          placeholder="Search reports..."
          class="w-full px-4 py-2 pl-10 pr-4 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          bind:value={searchTerm}
          oninput={handleSearchChange}
        />
        <div class="absolute inset-y-0 left-0 flex items-center pl-3">
          <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
    </div>

    <!-- Data Table -->
    {#if filteredData().length > 0}
      <div class="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th 
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                  onclick={() => handleSort('document_name')}
                >
                  <div class="flex items-center space-x-1">
                    <span>Document Name</span>
                    <span class="text-gray-400">{getSortIcon('document_name')}</span>
                  </div>
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Document ID
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Report Types
                </th>
                <th 
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                  onclick={() => handleSort('total_reports')}
                >
                  <div class="flex items-center space-x-1">
                    <span>Total Reports</span>
                    <span class="text-gray-400">{getSortIcon('total_reports')}</span>
                  </div>
                </th>
                <th 
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                  onclick={() => handleSort('created_at')}
                >
                  <div class="flex items-center space-x-1">
                    <span>Latest Report</span>
                    <span class="text-gray-400">{getSortIcon('created_at')}</span>
                  </div>
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {#each paginatedData() as doc (doc.document.id)}
                <tr class="hover:bg-gray-50 cursor-pointer" onclick={() => handleRowClick(doc)}>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">
                      {doc.document.original_name}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-500">
                      {doc.document.id}
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex flex-wrap gap-1">
                      {#if doc.reports.TEXT?.length}
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {doc.reports.TEXT.length} Text
                        </span>
                      {/if}
                      {#if doc.reports.LINK?.length}
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {doc.reports.LINK.length} Link
                        </span>
                      {/if}
                      {#if doc.reports.AUDIO?.length}
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {doc.reports.AUDIO.length} Audio
                        </span>
                      {/if}
                      {#if doc.reports.VIDEO?.length}
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {doc.reports.VIDEO.length} Video
                        </span>
                      {/if}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">
                      {getTotalReportsCount(doc)}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">
                      {#if getLatestReportDate(doc)}
                        {formatDate(getLatestReportDate(doc))}
                      {:else}
                        -
                      {/if}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onclick={(e) => e.stopPropagation()}>
                    <div class="flex items-center justify-end space-x-2">
                      <button
                        onclick={() => handleShowDetails(doc)}
                        class="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        title="View Details"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      
                      {#if doc.document.url}
                        <a
                          href={doc.document.url}
                          target="_blank"
                          class="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                          title="View Document"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      {/if}
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
        
        <!-- Pagination -->
        {#if totalPages() > 1}
          <div class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div class="flex-1 flex justify-between sm:hidden">
              <button
                onclick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onclick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages()}
                class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p class="text-sm text-gray-700">
                  Showing <span class="font-medium">{(currentPage - 1) * pageSize + 1}</span> to <span class="font-medium">{Math.min(currentPage * pageSize, filteredData().length)}</span> of{' '}
                  <span class="font-medium">{filteredData().length}</span> results
                </p>
              </div>
              <div>
                <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onclick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span class="sr-only">Previous</span>
                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                  </button>
                  
                  {#each Array.from({ length: totalPages() }, (_, i) => i + 1) as page}
                    {#if page === 1 || page === totalPages() || (page >= currentPage - 2 && page <= currentPage + 2)}
                      <button
                        onclick={() => handlePageChange(page)}
                        class="relative inline-flex items-center px-4 py-2 border text-sm font-medium {page === currentPage ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}"
                      >
                        {page}
                      </button>
                    {:else if page === currentPage - 3 || page === currentPage + 3}
                      <span class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                        ...
                      </span>
                    {/if}
                  {/each}
                  
                  <button
                    onclick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages()}
                    class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span class="sr-only">Next</span>
                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        {/if}
      </div>
    {/if}

    <!-- Empty State -->
    {#if filteredData().length === 0}
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
  {/if}
</div>

<!-- Delete Confirmation Modal -->
{#if showDeleteModal}
  <div class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
    <!-- Background overlay with backdrop blur -->
    <div class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity" onclick={cancelDelete}></div>
    
    <!-- Modal panel -->
    <div class="relative bg-white rounded-lg shadow-xl max-w-lg w-full">
      <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
        <div class="sm:flex sm:items-start">
          <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
            <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L1.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
            <h3 class="text-lg leading-6 font-medium text-gray-900">
              Delete Report
            </h3>
            <div class="mt-2">
              <p class="text-sm text-gray-500">
                Are you sure you want to delete this {reportToDelete?.type?.toLowerCase()} report? This action cannot be undone.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
        <button
          onclick={confirmDelete}
          disabled={isDeleting}
          class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {#if isDeleting}
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Deleting...
          {:else}
            Delete
          {/if}
        </button>
        <button
          onclick={cancelDelete}
          disabled={isDeleting}
          class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Document Detail Modal -->
{#if showDetailModal && selectedDocument}
  <div class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
    <!-- Background overlay with backdrop blur -->
    <div class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity" onclick={closeDetailModal}></div>
    
    <!-- Modal panel -->
    <div class="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
      <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
        <!-- Modal Header -->
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center space-x-3">
            <svg class="h-8 w-8 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 2v10H4V5h12z" clip-rule="evenodd" />
              <path d="M6 7h8v1H6V7zM6 9h8v1H6V9zM6 11h6v1H6v-1zM6 13h4v1H6v-1z" />
            </svg>
            <div>
              <h3 class="text-lg font-medium text-gray-900">Document Reports</h3>
              <p class="text-sm text-gray-500">{selectedDocument.document.original_name}</p>
            </div>
          </div>
          <button
            onclick={closeDetailModal}
            class="rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <span class="sr-only">Close</span>
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Document Information -->
        <div class="bg-gray-50 p-4 rounded-lg mb-6">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Document Name</label>
              <p class="mt-1 text-sm text-gray-900">{selectedDocument.document.original_name}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Document ID</label>
              <p class="mt-1 text-sm text-gray-900">{selectedDocument.document.id}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Total Reports</label>
              <p class="mt-1 text-sm text-gray-900">{getTotalReportsCount(selectedDocument)}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Document URL</label>
              {#if selectedDocument.document.url}
                <a 
                  href={selectedDocument.document.url} 
                  target="_blank" 
                  class="mt-1 text-sm text-blue-600 hover:text-blue-800 underline break-all"
                >
                  View Document
                </a>
              {:else}
                <p class="mt-1 text-sm text-gray-500">-</p>
              {/if}
            </div>
          </div>
        </div>

        <!-- Reports List -->
        <div class="space-y-6 max-h-[50vh] overflow-y-auto">
            <!-- Text Reports -->
            {#if selectedDocument.reports.TEXT?.length}
              <div>
                <h4 class="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <svg class="h-4 w-4 text-gray-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd" />
                  </svg>
                  Text Reports ({selectedDocument.reports.TEXT.length})
                </h4>
                <div class="space-y-3">
                  {#each selectedDocument.reports.TEXT as report (report.id)}
                    <div class="border border-gray-200 rounded-md p-3 hover:bg-gray-50">
                      <div class="flex justify-between items-start">
                        <div class="flex-1">
                          <p class="text-sm text-gray-900 mb-2">{report.content}</p>
                          {#if report.description}
                            <p class="text-xs text-gray-500 mb-2">{report.description}</p>
                          {/if}
                          <div class="flex items-center space-x-4 text-xs text-gray-500">
                            <span>By: {report.user.username}</span>
                            <span>Created: {formatDate(report.created_at)}</span>
                            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {report.is_downloaded ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                              {report.is_downloaded ? 'Downloaded' : 'Not Downloaded'}
                            </span>
                          </div>
                        </div>
                        <div class="flex items-center space-x-1 ml-4">
                          {#if report.preview_url}
                            <button
                              onclick={() => handlePreview(report)}
                              class="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                              title="Preview"
                            >
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </button>
                          {/if}
                          <button
                            onclick={() => handleDelete(report)}
                            class="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                            title="Delete"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}

            <!-- Link Reports -->
            {#if selectedDocument.reports.LINK?.length}
              <div>
                <h4 class="text-sm font-medium text-blue-700 mb-3 flex items-center">
                  <svg class="h-4 w-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clip-rule="evenodd" />
                  </svg>
                  Link Reports ({selectedDocument.reports.LINK.length})
                </h4>
                <div class="space-y-3">
                  {#each selectedDocument.reports.LINK as report (report.id)}
                    <div class="border border-gray-200 rounded-md p-3 hover:bg-gray-50">
                      <div class="flex justify-between items-start">
                        <div class="flex-1">
                          <a href={report.content} target="_blank" class="text-sm text-blue-600 hover:text-blue-800 underline break-all">
                            {report.content}
                          </a>
                          {#if report.description}
                            <p class="text-xs text-gray-500 mt-2">{report.description}</p>
                          {/if}
                          <div class="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>By: {report.user.username}</span>
                            <span>Created: {formatDate(report.created_at)}</span>
                            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {report.is_downloaded ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                              {report.is_downloaded ? 'Downloaded' : 'Not Downloaded'}
                            </span>
                          </div>
                        </div>
                        <div class="flex items-center space-x-1 ml-4">
                          <button
                            onclick={() => handlePreview(report)}
                            class="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                            title="Open Link"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </button>
                          <button
                            onclick={() => handleDelete(report)}
                            class="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                            title="Delete"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}

            <!-- Audio Reports -->
            {#if selectedDocument.reports.AUDIO?.length}
              <div>
                <h4 class="text-sm font-medium text-green-700 mb-3 flex items-center">
                  <svg class="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.824L4.207 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.207l4.176-3.824zm2.617 5.924a3 3 0 000 4V9z" clip-rule="evenodd" />
                  </svg>
                  Audio Reports ({selectedDocument.reports.AUDIO.length})
                </h4>
                <div class="space-y-3">
                  {#each selectedDocument.reports.AUDIO as report (report.id)}
                    <div class="border border-gray-200 rounded-md p-3 hover:bg-gray-50">
                      <div class="flex justify-between items-start">
                        <div class="flex-1">
                          <p class="text-sm font-medium text-gray-900">{report.original_name || `Audio Report ${report.id}`}</p>
                          {#if report.description}
                            <p class="text-xs text-gray-500 mt-1">{report.description}</p>
                          {/if}
                          <div class="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>By: {report.user.username}</span>
                            <span>Created: {formatDate(report.created_at)}</span>
                            {#if report.file_size}
                              <span>Size: {(report.file_size / 1024 / 1024).toFixed(2)} MB</span>
                            {/if}
                            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {report.is_downloaded ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                              {report.is_downloaded ? 'Downloaded' : 'Not Downloaded'}
                            </span>
                          </div>
                        </div>
                        <div class="flex items-center space-x-1 ml-4">
                          {#if report.preview_url}
                            <button
                              onclick={() => handlePreview(report)}
                              class="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50"
                              title="Preview"
                            >
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8M8 10V4a2 2 0 012-2h4a2 2 0 012 2v6" />
                              </svg>
                            </button>
                          {/if}
                          <button
                            onclick={() => handleDownload(report)}
                            class="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                            title="Download"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-4-4m4 4l4-4m5-7V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-1" />
                            </svg>
                          </button>
                          <button
                            onclick={() => handleDelete(report)}
                            class="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                            title="Delete"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}

            <!-- Video Reports -->
            {#if selectedDocument.reports.VIDEO?.length}
              <div>
                <h4 class="text-sm font-medium text-purple-700 mb-3 flex items-center">
                  <svg class="h-4 w-4 text-purple-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                  </svg>
                  Video Reports ({selectedDocument.reports.VIDEO.length})
                </h4>
                <div class="space-y-3">
                  {#each selectedDocument.reports.VIDEO as report (report.id)}
                    <div class="border border-gray-200 rounded-md p-3 hover:bg-gray-50">
                      <div class="flex justify-between items-start">
                        <div class="flex-1">
                          <p class="text-sm font-medium text-gray-900">{report.original_name || `Video Report ${report.id}`}</p>
                          {#if report.description}
                            <p class="text-xs text-gray-500 mt-1">{report.description}</p>
                          {/if}
                          <div class="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>By: {report.user.username}</span>
                            <span>Created: {formatDate(report.created_at)}</span>
                            {#if report.file_size}
                              <span>Size: {(report.file_size / 1024 / 1024).toFixed(2)} MB</span>
                            {/if}
                            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {report.is_downloaded ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                              {report.is_downloaded ? 'Downloaded' : 'Not Downloaded'}
                            </span>
                          </div>
                        </div>
                        <div class="flex items-center space-x-1 ml-4">
                          {#if report.preview_url}
                            <button
                              onclick={() => handlePreview(report)}
                              class="text-purple-600 hover:text-purple-800 p-1 rounded hover:bg-purple-50"
                              title="Preview"
                            >
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8M8 10V4a2 2 0 012-2h4a2 2 0 012 2v6" />
                              </svg>
                            </button>
                          {/if}
                          <button
                            onclick={() => handleDownload(report)}
                            class="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                            title="Download"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-4-4m4 4l4-4m5-7V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-1" />
                            </svg>
                          </button>
                          <button
                            onclick={() => handleDelete(report)}
                            class="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                            title="Delete"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}

            <!-- Empty state if no reports -->
            {#if getTotalReportsCount(selectedDocument) === 0}
              <div class="text-center py-8">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 class="mt-2 text-sm font-medium text-gray-900">No reports found</h3>
                <p class="mt-1 text-sm text-gray-500">This document doesn't have any reports yet.</p>
              </div>
            {/if}
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            onclick={closeDetailModal}
            class="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Close
          </button>
        </div>
    </div>
  </div>
{/if}