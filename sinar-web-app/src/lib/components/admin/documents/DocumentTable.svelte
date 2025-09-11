<script lang="ts">
  import { onMount } from "svelte";
  import {
    documentService,
    type Document as ApiDocument,
    type PaginatedDocumentsResponse,
    type PaginationParams,
  } from "@/lib/services";
  import ConfirmationModal from '@/lib/components/ui/ConfirmationModal.svelte';
  import { modalToastStore } from '@/lib/stores/modal-toast';
  import Loading from '$lib/components/ui/loading.svelte';
  import ReportDetailModal from '$lib/components/ui/ReportDetailModal.svelte';

  interface Document {
    id: string;
    title: string;
    filename: string;
    original_name: string;
    url: string;
    is_downloaded: boolean;
    is_report: boolean;
    uploaded_at: string;
    username_upload: string;
    remark: string | null;
    iconColor: string;
  }

  interface $$Props {
    fetchOnMount?: boolean;
    onDelete?: (document: Document) => void;
    onRefresh?: () => void;
    onRowClick?: (document: ApiDocument) => void;
    searchTerm?: string;
    sortOrder?: 'asc' | 'desc';
  }

  let {
    fetchOnMount = false,
    onDelete,
    onRefresh,
    onRowClick,
    searchTerm = "",
    sortOrder = 'desc',
  }: $$Props = $props();

  // Component state
  let isLoading = $state(false);
  let error = $state<string | null>(null);
  let documents = $state<Document[]>([]);
  let apiDocuments = $state<ApiDocument[]>([]);

  // Server-side pagination state
  let currentPage = $state(1);
  let pageSize = $state(10);
  let totalRecords = $state(0);
  let totalPages = $state(0);

  // Transform API document to table format
  function transformApiDocument(apiDoc: ApiDocument): Document {
    try {
      return {
        id: apiDoc.id.toString(),
        title: apiDoc.title || "Untitled",
        filename: apiDoc.filename || "Unknown file",
        original_name:
          apiDoc.original_name || apiDoc.filename || "Unknown file",
        url: apiDoc.url || "",
        is_downloaded: apiDoc.is_downloaded || false,
        is_report: apiDoc.is_report || false,
        uploaded_at: apiDoc.uploaded_at,
        username_upload: apiDoc.username_upload || "Unknown",
        remark: apiDoc.remark,
        iconColor: getIconColor(apiDoc.filename || apiDoc.original_name || ""),
      };
    } catch (error) {
      console.error("Error transforming document:", error, apiDoc);
      return {
        id: apiDoc.id?.toString() || "unknown",
        title: "Error loading document",
        filename: "unknown",
        original_name: "unknown",
        url: "",
        is_downloaded: false,
        is_report: false,
        uploaded_at: new Date().toISOString(),
        username_upload: "Unknown",
        remark: null,
        iconColor: "text-gray-500",
      };
    }
  }

  // Get icon color based on file extension
  function getIconColor(filename: string | null | undefined): string {
    if (!filename || typeof filename !== 'string') {
      return "text-gray-500";
    }
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

  // Fetch documents with server-side pagination
  async function fetchDocuments(page: number = 1, search: string = '', order: 'asc' | 'desc' = 'desc', startDate: string | null = null, endDate: string | null = null) {
    console.log("Starting fetchDocuments with server-side pagination...");
    isLoading = true;
    error = null;

    try {
      const params: PaginationParams = {
        page: page,
        limit: pageSize,
        search: search.trim(),
        order: order,
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      };

      console.log("Calling documentService.getPaginatedDocuments() with params:", params);
      const response = await documentService.getPaginatedDocuments(params);
      console.log("API Response:", response);

      if (response.status === true && response.data) {
        // Handle both direct array and nested object response structures
        let documentsData: ApiDocument[] = [];
        let total = 0;
        
        if (Array.isArray(response.data)) {
          // Direct array response
          documentsData = response.data;
          total = response.data.length;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          // Nested object response
          documentsData = response.data.data;
          total = response.data.total || 0;
          totalPages = Math.ceil(total / pageSize);
        }

        console.log("Processing", documentsData.length, "documents...");
        apiDocuments = documentsData;
        documents = documentsData.map(transformApiDocument);
        totalRecords = total;
        
        console.log("Server-side pagination - Total records:", totalRecords);
        console.log("Server-side pagination - Total pages:", totalPages);
        error = null;
      } else {
        error = response.message || "Failed to fetch documents";
        documents = [];
        apiDocuments = [];
        totalRecords = 0;
        totalPages = 0;
        console.warn("API Error:", response.status, response.message);
      }
    } catch (err) {
      error = err instanceof Error ? err.message : "Unknown error occurred";
      documents = [];
      apiDocuments = [];
      totalRecords = 0;
      totalPages = 0;
      console.error("Fetch Error:", err);
    } finally {
      isLoading = false;
      console.log("fetchDocuments completed, isLoading:", isLoading);
    }
  }

  // Handle refresh
  async function handleRefresh() {
    await fetchDocuments(currentPage, searchTerm, sortOrder);
    onRefresh?.();
  }

  // Fetch on mount if required
  onMount(() => {
    if (fetchOnMount) {
      fetchDocuments(1, searchTerm, sortOrder);
    }

    // Add window focus listener to refresh data after download
    const handleWindowFocus = async () => {
      if (pendingDownloadRefresh) {
        console.log('Window regained focus, refreshing document data after download...');
        pendingDownloadRefresh = false;
        await fetchDocuments(currentPage, searchTerm, sortOrder);
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    
    return () => {
      window.removeEventListener('focus', handleWindowFocus);
    };
  });

  // Public method to fetch documents (called from parent)
  export function loadDocuments() {
    return fetchDocuments(1, searchTerm, sortOrder);
  }

  // Public method to set search and sort parameters (called from parent)
  export function setSearchParams(term: string, order: 'asc' | 'desc') {
    searchTerm = term;
    sortOrder = order;
    currentPage = 1; // Reset to first page when searching
    fetchDocuments(1, term, order);
  }

  // Public method to set date range filter (called from parent)
  export function setDateRange(startDate: string | null, endDate: string | null) {
    currentPage = 1; // Reset to page 1 when date filter changes
    fetchDocuments(1, searchTerm, sortOrder, startDate, endDate);
  }

  // Modal state
  let showDeleteModal = $state(false);
  let documentToDelete = $state<Document | null>(null);
  let isDeleting = $state(false);

  function handlePageChange(newPage: number) {
    if (newPage >= 1 && newPage <= totalPages) {
      currentPage = newPage;
      fetchDocuments();
    }
  }

  function handleDelete(doc: Document) {
    documentToDelete = doc;
    showDeleteModal = true;
  }

  async function confirmDelete() {
    if (!documentToDelete) return;

    isDeleting = true;
    try {
      const response = await documentService.deleteDocument(documentToDelete.id);
      
      if (response.status) {
        modalToastStore.success('Document deleted successfully!');
        
        // Calculate if current page will be empty after deletion
        const remainingRecords = totalRecords - 1;
        const maxPageAfterDelete = Math.ceil(remainingRecords / pageSize);
        
        // If current page would be empty after delete, go to previous page
        if (currentPage > maxPageAfterDelete && maxPageAfterDelete > 0) {
          currentPage = maxPageAfterDelete;
        }
        
        // Refresh the document list after successful deletion
        await fetchDocuments(currentPage, searchTerm, sortOrder);
        onDelete?.(documentToDelete);
      } else {
        modalToastStore.error('Failed to delete document: ' + response.message);
      }
    } catch (error) {
      console.error('Delete failed:', error);
      modalToastStore.error('Failed to delete document: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      isDeleting = false;
      showDeleteModal = false;
      documentToDelete = null;
    }
  }

  function cancelDelete() {
    showDeleteModal = false;
    documentToDelete = null;
  }

  function handleRowClick(doc: Document) {
    // Find the corresponding API document
    const apiDoc = apiDocuments.find(apiDoc => apiDoc.id.toString() === doc.id);
    if (apiDoc && onRowClick) {
      onRowClick(apiDoc);
    }
  }

  // Track if we need to refresh after download
  let pendingDownloadRefresh = $state(false);

  // Preview state
  let isPreviewOpen = $state(false);
  let previewContent = $state<string>('');
  let previewTitle = $state<string>('');
  let isLoadingPreview = $state(false);

  // Report detail modal state
  let isReportDetailOpen = $state(false);
  let reportDetailData = $state<any>(null);

  async function handlePreview(doc: Document) {
    try {
      // Check if document is previewable (only .doc/.docx files)
      const fileName = doc.original_name.toLowerCase();
      if (!fileName.endsWith('.doc') && !fileName.endsWith('.docx')) {
        modalToastStore.error('Preview is only available for Word documents (.doc/.docx)');
        return;
      }

      isLoadingPreview = true;
      const result = await documentService.previewDocument(doc.id);
      
      if (result.status && result.data) {
        previewContent = cleanMammothHTML(result.data);
        previewTitle = doc.title;
        isPreviewOpen = true;
      } else {
        modalToastStore.error(result.message || 'Failed to preview document');
      }
    } catch (error) {
      console.error('Preview failed:', error);
      modalToastStore.error('Preview failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      isLoadingPreview = false;
    }
  }

  function closePreview() {
    isPreviewOpen = false;
    previewContent = '';
    previewTitle = '';
  }

  function transformToReportData(apiDoc: ApiDocument): any {
    // Transform the reports into the format expected by ReportDetailModal
    const reports = apiDoc.reports || [];
    
    const reportsByType = {
      TEXT: reports.filter(r => r.type === 'TEXT'),
      LINK: reports.filter(r => r.type === 'LINK'), 
      AUDIO: reports.filter(r => r.type === 'AUDIO'),
      VIDEO: reports.filter(r => r.type === 'VIDEO'),
    };

    return {
      document: {
        id: apiDoc.id,
        original_name: apiDoc.original_name,
        url: apiDoc.url,
        uploaded_at: apiDoc.uploaded_at,
        title: apiDoc.title,
        remark: apiDoc.remark,
      },
      reports: reportsByType
    };
  }

  function handleDetail(doc: Document) {
    // Find the original API document
    const apiDoc = apiDocuments.find(d => d.id.toString() === doc.id);
    if (!apiDoc) {
      modalToastStore.error('Document not found');
      return;
    }

    // Transform to report data format
    reportDetailData = transformToReportData(apiDoc);
    isReportDetailOpen = true;
  }

  function closeReportDetail() {
    isReportDetailOpen = false;
    reportDetailData = null;
  }

  // Check if document can be previewed
  function canPreview(fileName: string | null | undefined): boolean {
    if (!fileName || typeof fileName !== 'string') {
      return false;
    }
    const name = fileName.toLowerCase();
    return name.endsWith('.doc') || name.endsWith('.docx');
  }

  // Clean HTML from Mammoth for better Word-like rendering
  function cleanMammothHTML(html: string): string {
    if (!html) return html;
    
    try {
      // Create a temporary div to manipulate HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      // Remove problematic inline styles
      const allElements = tempDiv.querySelectorAll('*');
      allElements.forEach(element => {
        try {
          const style = element.getAttribute('style');
          if (style) {
            // Keep only essential styles, remove others
            let cleanStyle = '';
            
            // Preserve text alignment
            if (style.includes('text-align:')) {
              const alignMatch = style.match(/text-align:\s*([^;]+)/);
              if (alignMatch) {
                cleanStyle += `text-align: ${alignMatch[1]};`;
              }
            }
            
            // Preserve bold/italic
            if (style.includes('font-weight:') && (style.includes('bold') || style.includes('700'))) {
              cleanStyle += 'font-weight: bold;';
            }
            if (style.includes('font-style:') && style.includes('italic')) {
              cleanStyle += 'font-style: italic;';
            }
            
            // Preserve text decoration (underline, etc.)
            if (style.includes('text-decoration:')) {
              const decorationMatch = style.match(/text-decoration:\s*([^;]+)/);
              if (decorationMatch) {
                cleanStyle += `text-decoration: ${decorationMatch[1]};`;
              }
            }
            
            // Preserve colors only if they're not default black
            if (style.includes('color:') && !style.includes('color: rgb(0, 0, 0)') && !style.includes('color:#000') && !style.includes('color: #000')) {
              const colorMatch = style.match(/color:\s*([^;]+)/);
              if (colorMatch && colorMatch[1].trim() !== 'black') {
                cleanStyle += `color: ${colorMatch[1]};`;
              }
            }
            
            // Set cleaned style or remove if empty
            if (cleanStyle.trim()) {
              element.setAttribute('style', cleanStyle);
            } else {
              element.removeAttribute('style');
            }
          }
        } catch (err) {
          console.warn('Error processing element style:', err);
        }
      });
      
      // Remove empty paragraphs that Mammoth sometimes creates
      const allPs = tempDiv.querySelectorAll('p');
      allPs.forEach(p => {
        try {
          // Remove if paragraph is completely empty (no text and no child elements)
          const hasText = p.textContent?.trim();
          const hasChildren = p.children.length > 0;
          
          if (!hasText && !hasChildren) {
            p.remove();
          }
        } catch (err) {
          console.warn('Error processing paragraph:', err);
        }
      });
      
      return tempDiv.innerHTML;
      
    } catch (error) {
      console.error('Error cleaning Mammoth HTML:', error);
      // Return original HTML if cleaning fails
      return html;
    }
  }

  async function handleDownload(doc: Document) {
    try {
      await documentService.downloadDocument(doc.id, doc.original_name);
      console.log('Document downloaded successfully, will refresh when window regains focus...');
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

<div class="h-full flex flex-col pl-2 sm:pl-4 lg:pl-6 pr-2 sm:pr-4 lg:pr-8 pb-4 sm:pb-6 pt-4 sm:pt-6 md:pt-8 lg:pt-10 xl:pt-12">

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
        <span class="text-gray-700">Loading documents...</span>
      </div>
    </div>
  {:else}
    <!-- Data Table -->
    <div class="flex-1 pr-0 sm:pr-4 overflow-auto">
      <div class="mt-2 sm:mt-4">
        <!-- Desktop Table (hidden on mobile/tablet) -->
        <table class="hidden lg:table w-full table-fixed divide-y divide-gray-200 border border-gray-200">
          <thead class="bg-gray-50 sticky top-0 z-10">
            <tr>
              <!-- Document Column -->
              <th class="px-3 sm:px-4 lg:px-6 py-4 sm:py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-r border-gray-200 w-1/3">
                Document
              </th>
              <th class="px-3 sm:px-4 lg:px-6 py-4 sm:py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-r border-gray-200 w-1/8">
                Uploaded By
              </th>
              <th class="px-3 sm:px-4 lg:px-6 py-4 sm:py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-r border-gray-200 w-1/6">
                Status
              </th>
              <th class="px-3 sm:px-4 lg:px-6 py-4 sm:py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-r border-gray-200 w-1/6">
                Upload Date
              </th>
              <th class="px-3 sm:px-4 lg:px-6 py-4 sm:py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 w-1/6">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each documents as doc (doc.id)}
              <tr class="hover:bg-gray-50 cursor-pointer border-b border-gray-200" onclick={() => handleRowClick(doc)}>
                <!-- Document Cell -->
                <td class="px-3 sm:px-6 py-4 border-r border-gray-200">
                  <div class="flex items-center">
                    <svg class="h-6 w-6 sm:h-8 sm:w-8 {doc.iconColor} mr-2 sm:mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 2v10H4V5h12z" clip-rule="evenodd" />
                      <path d="M6 7h8v1H6V7zM6 9h8v1H6V9zM6 11h6v1H6v-1zM6 13h4v1H6v-1z" />
                    </svg>
                    <div class="min-w-0 flex-1">
                      <div class="text-sm font-medium text-gray-900 break-words" title={doc.title}>
                        {doc.title}
                      </div>
                      <div class="text-xs sm:text-sm text-gray-500 break-words" title={doc.original_name}>
                        {doc.original_name}
                      </div>
                      <!-- Mobile: Show upload info -->
                      <div class="md:hidden text-xs text-gray-400 mt-1">
                        {doc.username_upload} • {formatDate(doc.uploaded_at).split(' ')[0]}
                      </div>
                      {#if doc.remark}
                        <div class="text-xs text-gray-400 mt-1 line-clamp-2" title={doc.remark}>
                          {doc.remark}
                        </div>
                      {/if}
                    </div>
                  </div>
                </td>
                <!-- Uploaded By Cell (Desktop only) -->
                <td class="hidden md:table-cell px-6 py-4 whitespace-nowrap border-r border-gray-200">
                  <div class="text-sm text-gray-900">{doc.username_upload}</div>
                </td>
                <!-- Downloaded Status Cell (Large screens only) -->
                <td class="hidden lg:table-cell px-6 py-4 whitespace-nowrap border-r border-gray-200">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {doc.is_downloaded ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                    {doc.is_downloaded ? "Downloaded" : "Not Downloaded"}
                  </span>
                </td>
                <!-- Upload Date Cell (Small screens and up) -->
                <td class="hidden sm:table-cell px-3 sm:px-6 py-4 text-sm text-gray-900 border-r border-gray-200">
                  <div class="sm:whitespace-nowrap">
                    <div class="font-medium">{formatDate(doc.uploaded_at).split(' ')[0]}</div>
                    <div class="text-xs text-gray-500 hidden lg:block">{formatDate(doc.uploaded_at).split(' ')[1]}</div>
                  </div>
                </td>
                <!-- Actions Cell -->
                <td class="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex items-center justify-center space-x-1" onclick={(e) => e.stopPropagation()}>
                    <!-- Detail Button -->
                    <div class="relative group">
                      <button
                        onclick={() => handleDetail(doc)}
                        class="text-blue-600 hover:text-blue-800 p-2 rounded-md hover:bg-blue-50 transition-colors"
                        aria-label="View details"
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                      <div class="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        Detail
                      </div>
                    </div>

                    <!-- Download Button -->
                    <div class="relative group">
                      <button 
                        onclick={() => handleDownload(doc)} 
                        class="text-green-600 hover:text-green-800 p-2 rounded-md hover:bg-green-50 transition-colors" 
                        aria-label="Download document"
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-4-4m4 4l4-4m5-7V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-1" />
                        </svg>
                      </button>
                      <div class="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        Download
                      </div>
                    </div>

                    <!-- Delete Button -->
                    <div class="relative group">
                      <button 
                        onclick={() => handleDelete(doc)} 
                        class="text-red-600 hover:text-red-800 p-2 rounded-md hover:bg-red-50 transition-colors" 
                        aria-label="Delete document"
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      <div class="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        Delete
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
        
        <!-- Mobile/Tablet Card Layout (visible on mobile/tablet) -->
        <div class="lg:hidden space-y-8 sm:space-y-8 md:space-y-10 mt-20 sm:mt-12 md:mt-14">
          {#each documents as doc (doc.id)}
            <div class="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onclick={() => handleRowClick(doc)}>
              <!-- Document Header -->
              <div class="flex items-start space-x-3 mb-3 sm:mb-4">
                <svg class="h-8 w-8 {doc.iconColor} mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 2v10H4V5h12z" clip-rule="evenodd" />
                  <path d="M6 7h8v1H6V7zM6 9h8v1H6V9zM6 11h6v1H6v-1zM6 13h4v1H6v-1z" />
                </svg>
                <div class="flex-1 min-w-0">
                  <h3 class="text-sm font-medium text-gray-900 break-words" title={doc.title}>
                    {doc.title}
                  </h3>
                  <p class="text-xs text-gray-500 break-words mt-1" title={doc.original_name}>
                    {doc.original_name}
                  </p>
                </div>
                <!-- Mobile Action Buttons -->
                <div class="flex-shrink-0 flex items-center space-x-2" onclick={(e) => e.stopPropagation()}>
                  <!-- Detail Button -->
                  <button
                    onclick={() => handleDetail(doc)}
                    class="text-blue-600 hover:text-blue-800 p-2 rounded-md hover:bg-blue-50 transition-colors"
                    aria-label="View details"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  <!-- Download Button -->
                  <button
                    onclick={() => handleDownload(doc)}
                    class="text-green-600 hover:text-green-800 p-2 rounded-md hover:bg-green-50 transition-colors"
                    aria-label="Download document"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-4-4m4 4l4-4m5-7V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-1" />
                    </svg>
                  </button>
                  <!-- Delete Button -->
                  <button
                    onclick={() => handleDelete(doc)}
                    class="text-red-600 hover:text-red-800 p-2 rounded-md hover:bg-red-50 transition-colors"
                    aria-label="Delete document"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <!-- Document Info -->
              <div class="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
                <div>
                  <span class="font-medium">Uploaded by:</span> {doc.username_upload}
                </div>
                <div>
                  <span class="font-medium">Date:</span> {formatDate(doc.uploaded_at).split(' ')[0]}
                </div>
                <div>
                  <span class="font-medium">Status:</span>
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {doc.is_report ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                    {doc.is_report ? 'Reported' : 'Not Reported'}
                  </span>
                </div>
                <div>
                  <span class="font-medium">Downloads:</span>
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {doc.is_downloaded ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                    {doc.is_downloaded ? 'Downloaded' : 'Not Downloaded'}
                  </span>
                </div>
              </div>
              
              <!-- Remark Section -->
              {#if doc.remark}
                <div class="mt-3 pt-3 border-t border-gray-100">
                  <span class="font-medium text-xs text-gray-700">Remark:</span>
                  <p class="text-xs text-gray-600 mt-1 line-clamp-2">{doc.remark}</p>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    </div>

    <!-- Empty State -->
    {#if documents.length === 0}
      <div class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No documents found</h3>
        <p class="mt-1 text-sm text-gray-500">
          {searchTerm ? "Try adjusting your search terms." : "Get started by adding some documents."}
        </p>
      </div>
    {/if}

    <!-- Pagination -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6 pt-4 border-t border-gray-200 bg-white sticky bottom-0 z-10">
      <!-- Results Info -->
      <div class="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
        <span class="hidden sm:inline">Showing </span>
        <span class="font-medium">{Math.min((currentPage - 1) * pageSize + 1, totalRecords)}</span>
        <span class="hidden sm:inline"> to </span>
        <span class="sm:hidden">-</span>
        <span class="font-medium">{Math.min(currentPage * pageSize, totalRecords)}</span>
        <span class="hidden sm:inline"> of </span>
        <span class="sm:hidden">/</span>
        <span class="font-medium">{totalRecords}</span>
        <span class="hidden sm:inline"> results</span>
        {#if searchTerm.trim()}
          <span class="text-gray-500 block sm:inline"> (filtered)</span>
        {/if}
      </div>

      <!-- Pagination Controls -->
      <div class="flex items-center justify-center space-x-1 sm:space-x-2">
        <!-- Mobile: Simplified pagination -->
        <div class="flex sm:hidden items-center space-x-2">
          <button onclick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} class="px-3 py-1 text-sm text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
            ←
          </button>
          <span class="px-3 py-1 text-sm text-white bg-blue-600 border border-blue-600 rounded-md">
            {currentPage}/{totalPages}
          </span>
          <button onclick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages} class="px-3 py-1 text-sm text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
            →
          </button>
        </div>

        <!-- Desktop: Full pagination -->
        <div class="hidden sm:flex items-center space-x-2">
          <button onclick={() => handlePageChange(1)} disabled={currentPage === 1} class="px-3 py-1 text-sm text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
            First
          </button>
          <button onclick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} class="px-3 py-1 text-sm text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
            Previous
          </button>
          <span class="px-3 py-1 text-sm text-white bg-blue-600 border border-blue-600 rounded-md">
            {currentPage} of {Math.max(1, totalPages)}
          </span>
          <button onclick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages} class="px-3 py-1 text-sm text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
            Next
          </button>
          <button onclick={() => handlePageChange(totalPages)} disabled={currentPage >= totalPages} class="px-3 py-1 text-sm text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
            Last
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<!-- Delete Confirmation Modal -->
<ConfirmationModal
  isOpen={showDeleteModal}
  title="Delete Document"
  message={`Are you sure you want to delete "${documentToDelete?.title}"? This action cannot be undone.`}
  confirmText="Delete"
  cancelText="Cancel"
  confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
  onConfirm={confirmDelete}
  onCancel={cancelDelete}
  isLoading={isDeleting}
/>

<!-- Loading Overlay for Preview -->
{#if isLoadingPreview}
  <Loading overlay={true} text="Loading preview..." />
{/if}

<!-- Document Preview Modal -->
{#if isPreviewOpen}
  <!-- Add custom CSS for Word-like styling -->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Times+New+Roman:wght@400;700&display=swap');
    
    .document-content {
      /* Page setup like A4 */
      width: 21cm;
      min-height: 29.7cm;
      margin: 2cm auto;
      padding: 2.54cm;
      background: white;
      box-shadow: 0 0 20px rgba(0,0,0,0.15);
      
      /* Document properties */
      font-family: 'Times New Roman', 'Liberation Serif', serif;
      font-size: 11pt;
      line-height: 1.08;
      color: #000000;
      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    .document-content h1,
    .document-content h2,
    .document-content h3,
    .document-content h4,
    .document-content h5,
    .document-content h6 {
      font-family: 'Times New Roman', 'Liberation Serif', serif !important;
      font-weight: bold !important;
      margin: 0 0 0 0 !important;
      margin-bottom: 0.25em !important;
      margin-top: 1em !important;
      color: #000000 !important;
      page-break-after: avoid !important;
    }
    
    .document-content h1 { 
      font-size: 18pt !important; 
      margin-top: 0 !important;
    }
    .document-content h2 { font-size: 16pt !important; }
    .document-content h3 { font-size: 14pt !important; }
    .document-content h4 { font-size: 12pt !important; }
    
    .document-content p {
      font-family: 'Times New Roman', 'Liberation Serif', serif !important;
      font-size: 11pt !important;
      line-height: 1.08 !important;
      margin: 0 0 0 0 !important;
      margin-bottom: 8pt !important;
      text-align: left !important;
      text-indent: 0 !important;
      color: #000000 !important;
      orphans: 2 !important;
      widows: 2 !important;
    }
    
    .document-content p.center,
    .document-content p[align="center"] {
      text-align: center !important;
    }
    
    .document-content p.right,
    .document-content p[align="right"] {
      text-align: right !important;
    }
    
    .document-content strong,
    .document-content b {
      font-weight: bold !important;
    }
    
    .document-content em,
    .document-content i {
      font-style: italic !important;
    }
    
    .document-content ul,
    .document-content ol {
      margin: 6pt 0 6pt 24pt !important;
      padding: 0 !important;
    }
    
    .document-content li {
      font-family: 'Times New Roman', Times, serif !important;
      font-size: 12pt !important;
      line-height: 1.15 !important;
      margin: 0 0 3pt 0 !important;
    }
    
    .document-content table {
      border-collapse: collapse !important;
      width: 100% !important;
      margin: 6pt 0 !important;
    }
    
    .document-content td,
    .document-content th {
      border: 1px solid #000 !important;
      padding: 3pt 6pt !important;
      font-family: 'Times New Roman', Times, serif !important;
      font-size: 12pt !important;
      vertical-align: top !important;
    }
    
    .document-content th {
      background-color: #f0f0f0 !important;
      font-weight: bold !important;
    }
    
    .document-content img {
      max-width: 100% !important;
      height: auto !important;
      display: block !important;
      margin: 6pt 0 !important;
    }
    
    .document-content blockquote {
      margin: 6pt 24pt !important;
      padding: 0 !important;
      font-style: italic !important;
    }
    
    /* Center alignment */
    .document-content .center,
    .document-content [style*="text-align: center"],
    .document-content [align="center"] {
      text-align: center !important;
    }
    
    /* Right alignment */
    .document-content .right,
    .document-content [style*="text-align: right"],
    .document-content [align="right"] {
      text-align: right !important;
    }
    
    /* Aggressive override for Mammoth HTML output */
    .document-content *[style] {
      font-family: 'Times New Roman', 'Liberation Serif', serif !important;
    }
    
    .document-content span[style*="font-family"] {
      font-family: 'Times New Roman', 'Liberation Serif', serif !important;
    }
    
    .document-content div[style*="font-family"] {
      font-family: 'Times New Roman', 'Liberation Serif', serif !important;
    }
    
    .document-content p[style*="font-family"] {
      font-family: 'Times New Roman', 'Liberation Serif', serif !important;
    }
    
    /* Fix font sizes from Mammoth */
    .document-content *[style*="font-size"] {
      font-size: 11pt !important;
    }
    
    .document-content h1[style*="font-size"] {
      font-size: 18pt !important;
    }
    
    .document-content h2[style*="font-size"] {
      font-size: 16pt !important;
    }
    
    .document-content h3[style*="font-size"] {
      font-size: 14pt !important;
    }
    
    /* Fix line heights from Mammoth */
    .document-content *[style*="line-height"] {
      line-height: 1.08 !important;
    }
    
    /* Fix margins from Mammoth */
    .document-content *[style*="margin"] {
      margin-top: 0 !important;
      margin-bottom: 8pt !important;
    }
    
    .document-content h1[style*="margin"],
    .document-content h2[style*="margin"],
    .document-content h3[style*="margin"],
    .document-content h4[style*="margin"] {
      margin-top: 1em !important;
      margin-bottom: 0.25em !important;
    }
    
    /* Override any color styles */
    .document-content *:not([style*="color: rgb"]) {
      color: #000000 !important;
    }
    
    /* Remove web-specific styling */
    .document-content * {
      max-width: none !important;
      box-sizing: border-box !important;
    }
    
    /* Fix list styling */
    .document-content ul[style],
    .document-content ol[style] {
      margin-left: 24pt !important;
      margin-bottom: 8pt !important;
    }
    
    .document-content li[style] {
      margin-bottom: 3pt !important;
      font-size: 11pt !important;
      line-height: 1.08 !important;
    }
  </style>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" onclick={closePreview}>
    <div class="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] mx-4 flex flex-col" onclick={(e) => e.stopPropagation()}>
      <!-- Modal Header -->
      <div class="flex items-center justify-between p-4 border-b border-gray-200">
        <div class="flex-1 min-w-0">
          <h3 class="text-lg font-medium text-gray-900 truncate">
            Preview: {previewTitle}
          </h3>
        </div>
        <button
          onclick={closePreview}
          class="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close preview"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <!-- Modal Content -->
      <div class="flex-1 overflow-auto" style="background: #f5f5f5;">
        <!-- A4 Document Paper with Word-like styling -->
        <div class="document-content">
          {@html previewContent}
        </div>
      </div>
      
      <!-- Modal Footer -->
      <div class="flex items-center justify-end p-4 border-t border-gray-200">
        <button
          onclick={closePreview}
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 border border-transparent rounded-md transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Report Detail Modal -->
<ReportDetailModal 
  isOpen={isReportDetailOpen}
  reportData={reportDetailData}
  onClose={closeReportDetail}
  modalType="document"
/>