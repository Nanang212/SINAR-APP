<script lang="ts">
  import { onMount } from "svelte";
  import {
    documentService,
    type Document as ApiDocument,
    type PaginatedDocumentsResponse,
    type PaginationParams,
  } from "@/lib/services";
  import { modalToastStore } from '@/lib/stores/modal-toast';

  interface Document {
    id: string;
    title: string;
    filename: string;
    original_name: string;
    url: string;
    is_downloaded: boolean;
    uploaded_at: string;
    username_upload: string;
    remark: string | null;
    iconColor: string;
  }

  interface $$Props {
    fetchOnMount?: boolean;
    onRefresh?: () => void;
    onRowClick?: (document: ApiDocument) => void;
    searchTerm?: string;
  }

  let {
    fetchOnMount = false,
    onRefresh,
    onRowClick,
    searchTerm = "",
  }: $$Props = $props();

  // Component state
  let isLoading = $state(false);
  let error = $state<string | null>(null);
  let documents = $state<Document[]>([]);
  let apiDocuments = $state<ApiDocument[]>([]);

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
        uploaded_at: new Date().toISOString(),
        username_upload: "Unknown",
        remark: null,
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

  // Fetch all documents from API for client-side filtering
  async function fetchDocuments() {
    console.log("Starting fetchDocuments for client-side filtering...");
    isLoading = true;
    error = null;

    try {
      console.log("Calling documentService.getPaginatedDocuments() with large limit...");
      const response = await documentService.getPaginatedDocuments({
        page: 1,
        limit: 1000 // Get all documents for client-side filtering
      });
      console.log("API Response:", response);
      
      if (response.status === true && response.data) {
        const paginatedData = response.data;
        console.log("PaginatedData:", paginatedData);
        
        if (paginatedData.data && Array.isArray(paginatedData.data)) {
          console.log("Processing", paginatedData.data.length, "documents...");
          apiDocuments = paginatedData.data; // Store original API documents
          documents = paginatedData.data.map(transformApiDocument);
          totalRecords = paginatedData.total || 0;
          console.log("Transformed documents:", documents);
          error = null; // Clear any previous errors
        } else {
          console.error("Invalid response format - paginatedData:", paginatedData);
          error = "Invalid response format";
          documents = [];
          apiDocuments = [];
          totalRecords = 0;
        }
      } else {
        error = response.message || "Failed to fetch documents";
        documents = [];
        apiDocuments = [];
        totalRecords = 0;
        console.warn(
          "API Error - Status:",
          response.status,
          "Message:",
          response.message
        );
      }
    } catch (err) {
      error = err instanceof Error ? err.message : "Unknown error occurred";
      documents = [];
      apiDocuments = [];
      totalRecords = 0;
      console.error("Fetch Error:", err);
    } finally {
      isLoading = false;
      console.log("fetchDocuments completed, isLoading:", isLoading);
    }
  }

  // Handle refresh
  async function handleRefresh() {
    await fetchDocuments();
    onRefresh?.();
  }

  // Fetch on mount if required
  onMount(() => {
    if (fetchOnMount) {
      fetchDocuments();
    }

    // Add window focus listener to refresh data after download
    const handleWindowFocus = async () => {
      if (pendingDownloadRefresh) {
        console.log('Window regained focus, refreshing document data after download...');
        pendingDownloadRefresh = false;
        await fetchDocuments();
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    
    return () => {
      window.removeEventListener('focus', handleWindowFocus);
    };
  });

  // Public method to fetch documents (called from parent)
  export function loadDocuments() {
    return fetchDocuments();
  }

  // Public method to set search term (called from parent)
  export function setSearchTerm(term: string) {
    // Search is handled by parent through searchTerm prop
  }

  // Table state
  let sortField = $state<keyof Document | null>(null);
  let sortDirection = $state<"asc" | "desc">("asc");
  let currentPage = $state(1);
  let pageSize = $state(10);

  // Pagination state
  let totalRecords = $state(0);

  // Client-side filtering and pagination
  const filteredData = $derived(() => {
    let filtered = documents;

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.title.toLowerCase().includes(term) ||
          doc.original_name.toLowerCase().includes(term) ||
          doc.username_upload.toLowerCase().includes(term) ||
          (doc.remark && doc.remark.toLowerCase().includes(term))
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

  function handlePageChange(newPage: number) {
    if (newPage >= 1 && newPage <= totalPages()) {
      currentPage = newPage;
    }
  }

  function handleSort(field: keyof Document) {
    if (sortField === field) {
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      sortField = field;
      sortDirection = "asc";
    }
  }

  function getSortIcon(field: keyof Document) {
    if (sortField !== field) return "↕";
    return sortDirection === "asc" ? "↑" : "↓";
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

  // Preview state
  let isPreviewOpen = $state(false);
  let previewContent = $state<string>('');
  let previewTitle = $state<string>('');
  let isLoadingPreview = $state(false);

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

  // Check if document can be previewed
  function canPreview(fileName: string): boolean {
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
  <!-- Error State -->
  {#if error}
    <div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
      <div class="flex">
        <svg
          class="w-5 h-5 text-red-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">
            Error loading documents
          </h3>
          <p class="mt-1 text-sm text-red-700">{error}</p>
          <button
            onclick={handleRefresh}
            class="mt-2 text-sm font-medium text-red-800 hover:text-red-900 underline"
          >
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
    <div class="mt-8 pr-4">
      <table class="w-full divide-y divide-gray-200 border border-gray-200">
        <thead class="bg-gray-50 sticky top-0 z-10">
          <tr>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 bg-gray-50 border-r border-gray-200"
              onclick={() => handleSort("title")}
            >
              <div class="flex items-center space-x-1">
                <span>Document</span>
                <span class="text-gray-400">{getSortIcon("title")}</span>
              </div>
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 bg-gray-50 border-r border-gray-200"
              onclick={() => handleSort("username_upload")}
            >
              <div class="flex items-center space-x-1">
                <span>Uploaded By</span>
                <span class="text-gray-400"
                  >{getSortIcon("username_upload")}</span
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
              onclick={() => handleSort("uploaded_at")}
            >
              <div class="flex items-center space-x-1">
                <span>Upload Date</span>
                <span class="text-gray-400">{getSortIcon("uploaded_at")}</span>
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
          {#each paginatedData() as doc (doc.id)}
            <tr class="hover:bg-gray-50 cursor-pointer border-b border-gray-200" onclick={() => handleRowClick(doc)}>
              <td class="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                <div class="flex items-center">
                  <svg
                    class="h-8 w-8 {doc.iconColor} mr-3"
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
                      {doc.title}
                    </div>
                    <div class="text-sm text-gray-500">{doc.original_name}</div>
                    {#if doc.remark}
                      <div class="text-xs text-gray-400 mt-1">{doc.remark}</div>
                    {/if}
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                <div class="text-sm text-gray-900">{doc.username_upload}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {doc.is_downloaded
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'}"
                >
                  {doc.is_downloaded ? "Downloaded" : "Not Downloaded"}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                {formatDate(doc.uploaded_at)}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex items-center justify-center space-x-2" onclick={(e) => e.stopPropagation()}>
                  <!-- Preview Button -->
                  <div class="relative group">
                    <button
                      onclick={() => handlePreview(doc)}
                      disabled={!canPreview(doc.original_name) || isLoadingPreview}
                      class="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed {canPreview(doc.original_name) ? '' : 'opacity-50'}"
                      aria-label="Preview document"
                    >
                      {#if isLoadingPreview}
                        <svg class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      {:else}
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      {/if}
                    </button>
                    <div class="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      {canPreview(doc.original_name) ? 'Preview' : 'Preview not available'}
                    </div>
                  </div>

                  <!-- Download Button -->
                  <div class="relative group">
                    <button
                      onclick={() => handleDownload(doc)}
                      class="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                      aria-label="Download document"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-4-4m4 4l4-4m5-7V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-1" />
                      </svg>
                    </button>
                    <div class="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      Download
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
          No documents found
        </h3>
        <p class="mt-1 text-sm text-gray-500">
          {searchTerm
            ? "Try adjusting your search terms."
            : "No documents available."}
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