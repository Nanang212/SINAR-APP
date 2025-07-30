<script lang="ts">
  import { onMount } from "svelte";
  import {
    documentService,
    type Document as ApiDocument,
  } from "@/lib/services";

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
    onDelete?: (document: Document) => void;
    onRefresh?: () => void;
    onRowClick?: (document: ApiDocument) => void;
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

  // Fetch documents from API
  async function fetchDocuments() {
    console.log("Starting fetchDocuments...");
    isLoading = true;
    error = null;

    try {
      console.log("Calling documentService.getAllDocuments()...");
      const response = await documentService.getAllDocuments();
      console.log("API Response:", response);
      console.log("Response status:", response.status);
      console.log("Response data:", response.data);

      if (
        response.status === true &&
        response.data &&
        Array.isArray(response.data)
      ) {
        console.log("Processing", response.data.length, "documents...");
        apiDocuments = response.data; // Store original API documents
        documents = response.data.map(transformApiDocument);
        console.log("Transformed documents:", documents);
        error = null; // Clear any previous errors
      } else {
        error = response.message || "Failed to fetch documents";
        documents = [];
        apiDocuments = [];
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
  });

  // Public method to fetch documents (called from parent)
  export function loadDocuments() {
    return fetchDocuments();
  }

  // Public method to set search term (called from parent)
  export function setSearchTerm(term: string) {
    searchTerm = term;
    currentPage = 0; // Reset to first page when searching
  }

  // Table state
  let searchTerm = $state("");
  let sortField = $state<keyof Document | null>(null);
  let sortDirection = $state<"asc" | "desc">("asc");
  let currentPage = $state(0);
  let pageSize = $state(10);

  // Filter and sort data
  const filteredAndSortedData = $derived(() => {
    let filtered = documents;

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.title.toLowerCase().includes(term) ||
          doc.filename.toLowerCase().includes(term) ||
          doc.original_name.toLowerCase().includes(term) ||
          doc.username_upload.toLowerCase().includes(term) ||
          (doc.remark && doc.remark.toLowerCase().includes(term))
      );
    }

    // Apply sorting
    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortField!];
        const bVal = b[sortField!];

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

  // Paginated data
  const paginatedData = $derived(() => {
    const startIndex = currentPage * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredAndSortedData().slice(startIndex, endIndex);
  });

  const totalPages = $derived(() =>
    Math.ceil(filteredAndSortedData().length / pageSize)
  );

  function handleSearchChange(event: Event) {
    const input = event.target as HTMLInputElement;
    searchTerm = input.value;
    currentPage = 0; // Reset to first page when searching
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

  function handleDelete(doc: Document) {
    onDelete?.(doc);
  }

  function handleRowClick(doc: Document) {
    // Find the corresponding API document
    const apiDoc = apiDocuments.find(apiDoc => apiDoc.id.toString() === doc.id);
    if (apiDoc && onRowClick) {
      onRowClick(apiDoc);
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

<div class="px-6 pb-6 pt-12">

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
    <div class="mt-8">
      <table class="w-full divide-y divide-gray-200">
        <thead class="bg-gray-50 sticky top-[60px] z-10">
          <tr>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 bg-gray-50"
              onclick={() => handleSort("title")}
            >
              <div class="flex items-center space-x-1">
                <span>Document</span>
                <span class="text-gray-400">{getSortIcon("title")}</span>
              </div>
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 bg-gray-50"
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
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 bg-gray-50"
              onclick={() => handleSort("is_downloaded")}
            >
              <div class="flex items-center space-x-1">
                <span>Downloaded</span>
                <span class="text-gray-400">{getSortIcon("is_downloaded")}</span
                >
              </div>
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 bg-gray-50"
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
            <tr class="hover:bg-gray-50 cursor-pointer" onclick={() => handleRowClick(doc)}>
              <td class="px-6 py-4 whitespace-nowrap">
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
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{doc.username_upload}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {doc.is_downloaded
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'}"
                >
                  {doc.is_downloaded ? "Downloaded" : "Not Downloaded"}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatDate(doc.uploaded_at)}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex items-center" onclick={(e) => e.stopPropagation()}>
                  <div class="relative group">
                    <a
                      href={doc.url}
                      target="_blank"
                      class="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                      aria-label="Download document"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-4-4m4 4l4-4m5-7V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-1" />
                      </svg>
                    </a>
                    <div class="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      Download
                    </div>
                  </div>
                  
                  <!-- Divider -->
                  <div class="h-4 w-px bg-gray-300 mx-2"></div>
                  
                  <div class="relative group">
                    <button
                      class="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                      onclick={() => handleDelete(doc)}
                      aria-label="Delete document"
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
          No documents found
        </h3>
        <p class="mt-1 text-sm text-gray-500">
          {searchTerm
            ? "Try adjusting your search terms."
            : "Get started by adding some documents."}
        </p>
      </div>
    {/if}

    <!-- Pagination -->
    {#if totalPages() > 1}
      <div class="flex items-center justify-between mt-6">
        <div class="text-sm text-gray-700">
          Showing <span class="font-medium">{currentPage * pageSize + 1}</span>
          to
          <span class="font-medium"
            >{Math.min(
              (currentPage + 1) * pageSize,
              filteredAndSortedData().length
            )}</span
          >
          of <span class="font-medium">{filteredAndSortedData().length}</span> results
        </div>

        <div class="flex items-center space-x-2">
          <button
            onclick={() => (currentPage = 0)}
            disabled={currentPage === 0}
            class="px-3 py-1 text-sm text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            First
          </button>

          <button
            onclick={() => (currentPage = Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            class="px-3 py-1 text-sm text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <span
            class="px-3 py-1 text-sm text-white bg-blue-600 border border-blue-600 rounded-md"
          >
            {currentPage + 1}
          </span>

          <button
            onclick={() =>
              (currentPage = Math.min(totalPages() - 1, currentPage + 1))}
            disabled={currentPage >= totalPages() - 1}
            class="px-3 py-1 text-sm text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>

          <button
            onclick={() => (currentPage = totalPages() - 1)}
            disabled={currentPage >= totalPages() - 1}
            class="px-3 py-1 text-sm text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Last
          </button>
        </div>
      </div>
    {/if}
  {/if}
</div>