<script lang="ts">
  import { onMount } from 'svelte';
  import { reportService, type Report, type PaginationParams } from '$lib/services';

  // Transform API Document to display format
  interface DisplayDocument {
    id: string;
    document_title: string;
    document_original_name: string;
    document_url: string;
    created_at: string;
    textCount: number;
    linkCount: number;
    audioCount: number;
    videoCount: number;
    totalCount: number;
    iconColor: string;
  }

  interface $$Props {
    fetchOnMount?: boolean;
    onRefresh?: () => void;
    onRowClick?: (report: any) => void;
    searchTerm?: string;
    sortOrder?: 'asc' | 'desc';
  }

  let {
    fetchOnMount = false,
    onRefresh,
    onRowClick,
    searchTerm = "",
    sortOrder = 'desc',
  }: $$Props = $props();

  // Component state
  let isLoading = $state(false);
  let error = $state<string | null>(null);
  let apiDocuments = $state<any[]>([]);
  let documents = $state<DisplayDocument[]>([]);

  // Server-side pagination state
  let currentPage = $state(1);
  let pageSize = $state(10);
  let pendingDownloadRefresh = $state(false);

  // Pagination state
  let totalRecords = $state(0);
  let totalPages = $state(0);

  // Backend handles search and sorting
  const paginatedData = $derived(() => documents);
  const filteredTotalRecords = $derived(() => totalRecords);
  const filteredTotalPages = $derived(() => totalPages);

  // Transform API document to display format
  function transformApiDocument(docGroup: any): DisplayDocument {
    const document = docGroup.document;
    const reports = docGroup.reports;
    
    // Count each report type
    const textCount = reports.TEXT?.length || 0;
    const linkCount = reports.LINK?.length || 0;
    const audioCount = reports.AUDIO?.length || 0;
    const videoCount = reports.VIDEO?.length || 0;
    const totalCount = textCount + linkCount + audioCount + videoCount;
    
    // Get latest created_at from all reports for sorting
    let latestCreatedAt = '';
    ['TEXT', 'LINK', 'AUDIO', 'VIDEO'].forEach(type => {
      if (reports[type] && reports[type].length > 0) {
        const latestInType = reports[type].reduce((latest: any, current: any) => 
          new Date(current.created_at) > new Date(latest.created_at) ? current : latest
        );
        if (!latestCreatedAt || new Date(latestInType.created_at) > new Date(latestCreatedAt)) {
          latestCreatedAt = latestInType.created_at;
        }
      }
    });
    
    return {
      id: document.id.toString(),
      document_title: document.original_name || 'Unknown Document',
      document_original_name: document.original_name || 'unknown.file',
      document_url: document.url || '',
      created_at: latestCreatedAt ? formatDate(latestCreatedAt) : '-',
      textCount,
      linkCount,
      audioCount,
      videoCount,
      totalCount,
      iconColor: getIconColorByDocument(document.original_name || '')
    };
  }

  function formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  }

  function getIconColorByDocument(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return "text-red-500";
      case 'doc':
      case 'docx':
        return "text-blue-500";
      case 'xls':
      case 'xlsx':
        return "text-green-500";
      case 'ppt':
      case 'pptx':
        return "text-orange-500";
      default:
        return "text-gray-500";
    }
  }

  // Fetch reports with server-side pagination, search and sort
  async function fetchReports(page: number = 1, search: string = '', order: 'asc' | 'desc' = 'desc') {
    console.log(`Starting fetchReports with pagination - Page: ${page}, Search: "${search}", Order: ${order}`);
    isLoading = true;
    error = null;

    try {
      // Use backend pagination with search and sort
      console.log("Calling reportService.getPaginatedReports() with backend pagination, search and sort...");
      const params: PaginationParams = {
        page: page,
        limit: pageSize,
        search: search,
        order: order,
      };
      
      const response = await reportService.getPaginatedReports(params);
      console.log("API Response:", response);
      
      if (response.status === true && response.data) {
        console.log("API Response data:", response.data);
        
        const paginatedData = response.data;
        if (paginatedData.data && Array.isArray(paginatedData.data)) {
          console.log("Processing", paginatedData.data.length, "grouped report documents...");
          
          // Store original API data and transform to display format
          apiDocuments = paginatedData.data; // Store original API documents
          documents = paginatedData.data.map(transformApiDocument);
          
          // Use pagination info from API response
          totalRecords = paginatedData.total || 0;
          totalPages = paginatedData.totalPages || Math.ceil(totalRecords / pageSize);
          currentPage = page;
          
          console.log("Documents loaded - Total:", totalRecords, "Current Page:", currentPage, "Total Pages:", totalPages);
          error = null; // Clear any previous errors
        } else {
          console.error("Invalid response format - expected nested data with data array:", paginatedData);
          error = "Invalid response format";
          documents = [];
          totalRecords = 0;
          totalPages = 0;
        }
      } else {
        console.error("Failed to fetch reports:", response.message);
        error = response.message || "Failed to fetch reports";
        documents = [];
        totalRecords = 0;
        totalPages = 0;
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      error = errorMessage;
      documents = [];
      totalRecords = 0;
      totalPages = 0;
    } finally {
      isLoading = false;
      console.log("fetchReports completed, isLoading:", isLoading);
    }
  }

  // Handle refresh
  async function handleRefresh() {
    await fetchReports(currentPage, searchTerm, sortOrder);
    onRefresh?.();
  }

  // Fetch on mount if required
  onMount(() => {
    if (fetchOnMount) {
      fetchReports(1, searchTerm, sortOrder);
    }

    // Add window focus listener to refresh data after download
    const handleWindowFocus = async () => {
      if (pendingDownloadRefresh) {
        console.log('Window regained focus, refreshing report data after download...');
        pendingDownloadRefresh = false;
        await fetchReports(currentPage, searchTerm, sortOrder);
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    
    return () => {
      window.removeEventListener('focus', handleWindowFocus);
    };
  });

  // Public method to fetch reports (called from parent)
  export function loadReports() {
    return fetchReports(1, searchTerm, sortOrder);
  }

  // Public method to set search parameters (called from parent)
  export function setSearchParams(search: string, order: 'asc' | 'desc') {
    currentPage = 1; // Reset to page 1 when search/sort changes
    fetchReports(1, search, order);
  }

  async function handlePageChange(newPage: number) {
    if (newPage >= 1 && newPage <= filteredTotalPages()) {
      await fetchReports(newPage, searchTerm, sortOrder);
    }
  }

  function handleRowClick(document: DisplayDocument) {
    // Find the corresponding API document
    const apiDocument = apiDocuments.find(apiDoc => apiDoc.document.id.toString() === document.id);
    
    if (apiDocument && onRowClick) {
      onRowClick(apiDocument);
    }
  }

  // Format media counts untuk display (hanya yang > 0)
  function formatMediaCounts(document: DisplayDocument): string {
    const counts = [];
    
    if (document.textCount > 0) {
      counts.push(`${document.textCount} Text${document.textCount > 1 ? 's' : ''}`);
    }
    if (document.linkCount > 0) {
      counts.push(`${document.linkCount} Link${document.linkCount > 1 ? 's' : ''}`);
    }
    if (document.audioCount > 0) {
      counts.push(`${document.audioCount} Audio${document.audioCount > 1 ? 's' : ''}`);
    }
    if (document.videoCount > 0) {
      counts.push(`${document.videoCount} Video${document.videoCount > 1 ? 's' : ''}`);
    }
    
    return counts.length > 0 ? counts.join(', ') : 'No media content';
  }

  // Get media counts with colors untuk badges
  function getMediaCountBadges(document: DisplayDocument) {
    const badges = [];
    
    if (document.textCount > 0) {
      badges.push({
        text: `${document.textCount} Text${document.textCount > 1 ? 's' : ''}`,
        color: 'text-amber-800',
        bg: 'bg-amber-100'
      });
    }
    if (document.linkCount > 0) {
      badges.push({
        text: `${document.linkCount} Link${document.linkCount > 1 ? 's' : ''}`,
        color: 'text-purple-800',
        bg: 'bg-purple-100'
      });
    }
    if (document.audioCount > 0) {
      badges.push({
        text: `${document.audioCount} Audio${document.audioCount > 1 ? 's' : ''}`,
        color: 'text-blue-800',
        bg: 'bg-blue-100'
      });
    }
    if (document.videoCount > 0) {
      badges.push({
        text: `${document.videoCount} Video${document.videoCount > 1 ? 's' : ''}`,
        color: 'text-red-800',
        bg: 'bg-red-100'
      });
    }
    
    return badges;
  }

</script>

<div class="h-full flex flex-col pl-2 sm:pl-4 lg:pl-6 pr-2 sm:pr-4 lg:pr-8 pb-4 sm:pb-6 pt-8 sm:pt-12">
  <!-- Error State -->
  {#if error}
    <div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
      <div class="flex">
        <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Error loading reports</h3>
          <p class="mt-1 text-sm text-red-700">{error}</p>
          <button onclick={handleRefresh} class="mt-2 text-sm font-medium text-red-800 hover:text-red-900 underline">
            Try again
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Loading State -->
  {#if isLoading}
    <div class="flex justify-center items-center py-12">
      <div class="flex items-center space-x-2">
        <svg class="w-6 h-6 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span class="text-gray-700">Loading reports...</span>
      </div>
    </div>
  {:else}
    <!-- Data Table -->
    <div class="flex-1 pr-0 sm:pr-4 overflow-auto">
      <div class="mt-16 sm:mt-8">
      <table class="min-w-full divide-y divide-gray-200 border border-gray-200">
      <thead class="bg-gray-50 sticky top-6 sm:top-2 z-10">
        <tr>
          <th class="px-3 sm:px-4 lg:px-6 py-4 sm:py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-r border-gray-200 min-w-[220px] sm:min-w-[180px]">
            Document
          </th>
          <th class="px-3 sm:px-4 lg:px-6 py-4 sm:py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-r border-gray-200 min-w-[200px] sm:min-w-[160px]">
            Media Content
          </th>
          <th class="px-3 sm:px-4 lg:px-6 py-4 sm:py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-r border-gray-200 min-w-[170px] sm:min-w-[140px]">
            Latest Report
          </th>
          <th class="px-3 sm:px-4 lg:px-6 py-4 sm:py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 min-w-[130px] sm:min-w-[90px]">
            Actions
          </th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        {#each paginatedData() as document (document.id)}
          <tr class="hover:bg-gray-50 cursor-pointer border-b border-gray-200" onclick={() => handleRowClick(document)}>
            <!-- Document Column -->
            <td class="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-r border-gray-200">
              <div class="flex items-center">
                <svg class="h-6 w-6 sm:h-8 sm:w-8 {document.iconColor} mr-2 sm:mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 2v10H4V5h12z" clip-rule="evenodd" />
                  <path d="M6 7h8v1H6V7zM6 9h8v1H6V9zM6 11h6v1H6v-1zM6 13h4v1H6v-1z" />
                </svg>
                <div class="min-w-0 flex-1">
                  <div class="text-sm font-medium text-gray-900 truncate" title={document.document_original_name}>
                    {document.document_original_name}
                  </div>
                </div>
              </div>
            </td>
            
            <!-- Media Content Column -->
            <td class="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-r border-gray-200">
              <div class="flex flex-wrap gap-1">
                {#if getMediaCountBadges(document).length > 0}
                  {#each getMediaCountBadges(document) as badge}
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {badge.bg} {badge.color}">
                      {badge.text}
                    </span>
                  {/each}
                {:else}
                  <span class="text-xs text-gray-500 italic">No media content</span>
                {/if}
              </div>
            </td>
            
            <!-- Latest Report Date -->
            <td class="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 border-r border-gray-200">
              <div class="hidden sm:block">{document.created_at}</div>
              <div class="sm:hidden">{document.created_at.split(' ')[0]}</div>
            </td>
            
            <!-- Actions -->
            <td class="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-medium">
              <div class="flex items-center justify-center space-x-1 sm:space-x-2" onclick={(e) => e.stopPropagation()}>
                <!-- View Details Button -->
                <div class="relative group">
                  <button
                    onclick={() => console.log('View details', document)}
                    class="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                    aria-label="View details"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <div class="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-5">
                    View Details
                  </div>
                </div>

                <!-- Divider -->
                <div class="h-6 w-px bg-gray-300"></div>

                <!-- Download Document Button -->
                <div class="relative group">
                  <button
                    onclick={() => window.open(document.document_url, '_blank')}
                    class="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50 transition-colors"
                    aria-label="Download document"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-4-4m4 4l4-4m5-7V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-1" />
                    </svg>
                  </button>
                  <div class="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-5">
                    Download Document
                  </div>
                </div>
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
      </table>
      </div>
    </div>

    <!-- Empty State -->
    {#if paginatedData().length === 0 && !isLoading}
      <div class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No reports found</h3>
        <p class="mt-1 text-sm text-gray-500">No reports available on this page.</p>
      </div>
    {/if}

    <!-- Pagination -->
    <div class="flex-shrink-0 flex flex-col sm:flex-row items-center justify-between mt-4 sm:mt-6 pt-4 border-t border-gray-200 bg-white gap-4 sm:gap-0">
      <div class="text-xs sm:text-sm text-gray-700 order-2 sm:order-1">
        <span class="hidden sm:inline">
          Showing <span class="font-medium">{Math.min((currentPage - 1) * pageSize + 1, filteredTotalRecords())}</span>
          to
          <span class="font-medium">{Math.min(currentPage * pageSize, filteredTotalRecords())}</span>
          of <span class="font-medium">{filteredTotalRecords()}</span> results
        </span>
        <span class="sm:hidden">
          {Math.min((currentPage - 1) * pageSize + 1, filteredTotalRecords())}-{Math.min(currentPage * pageSize, filteredTotalRecords())} of {filteredTotalRecords()}
        </span>
      </div>

      <div class="flex items-center space-x-1 sm:space-x-2 order-1 sm:order-2">
        <!-- Desktop: Show all buttons -->
        <div class="hidden sm:flex items-center space-x-2">
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

          <span class="px-3 py-1 text-sm text-white bg-blue-600 border border-blue-600 rounded-md">
            {currentPage} of {Math.max(1, filteredTotalPages())}
          </span>

          <button
            onclick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= filteredTotalPages()}
            class="px-3 py-1 text-sm text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>

          <button
            onclick={() => handlePageChange(filteredTotalPages())}
            disabled={currentPage >= filteredTotalPages()}
            class="px-3 py-1 text-sm text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Last
          </button>
        </div>
        
        <!-- Mobile: Show compact buttons -->
        <div class="flex sm:hidden items-center space-x-1">
          <button
            onclick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            class="p-2 text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous page"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <span class="px-3 py-1 text-sm text-white bg-blue-600 border border-blue-600 rounded-md min-w-[80px] text-center">
            {currentPage}/{Math.max(1, filteredTotalPages())}
          </span>

          <button
            onclick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= filteredTotalPages()}
            class="p-2 text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next page"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>