<script lang="ts">
  import { onMount } from "svelte";
  import {
    categoryService,
    type Category as ApiCategory,
  } from "@/lib/services";

  interface Category {
    id: string;
    name: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    statusColor: string;
  }

  interface $$Props {
    fetchOnMount?: boolean;
    onRefresh?: () => void;
    onRowClick?: (category: ApiCategory) => void;
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
  let categories = $state<Category[]>([]);
  let apiCategories = $state<ApiCategory[]>([]);

  // Transform API category to table format
  function transformApiCategory(apiCat: ApiCategory): Category {
    try {
      return {
        id: apiCat.id.toString(),
        name: apiCat.name || "Unknown",
        is_active: apiCat.is_active ?? true,
        created_at: apiCat.created_at,
        updated_at: apiCat.updated_at,
        statusColor: getStatusColor(apiCat.is_active ?? true),
      };
    } catch (error) {
      console.error("Error transforming category:", error, apiCat);
      return {
        id: apiCat.id?.toString() || "unknown",
        name: "Error loading category",
        is_active: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        statusColor: "text-gray-500",
      };
    }
  }

  // Get status color based on active status
  function getStatusColor(isActive: boolean): string {
    return isActive ? "text-green-500" : "text-red-500";
  }

  // Fetch all categories from API with pagination
  async function fetchCategories() {
    console.log("Starting fetchCategories...");
    isLoading = true;
    error = null;

    try {
      console.log("Calling categoryService.getAllCategoriesWithPagination()...");
      const response = await categoryService.getAllCategoriesWithPagination({
        limit: 1000, // Get all categories for client-side filtering
        page: 1
      });
      console.log("API Response:", response);

      // Check if response has the expected structure
      let categoriesArray = null;
      if (response.status === true && response.data) {
        // Case 1: Direct API response structure
        if (Array.isArray(response.data.data)) {
          categoriesArray = response.data.data;
          console.log("Found categories in response.data.data");
        }
        // Case 2: Response wrapped in another data layer
        else if (Array.isArray(response.data)) {
          categoriesArray = response.data;
          console.log("Found categories in response.data");
        }
      }

      if (categoriesArray && categoriesArray.length >= 0) {
        console.log("Processing", categoriesArray.length, "categories...");
        apiCategories = categoriesArray; // Store original API categories
        categories = categoriesArray.map(transformApiCategory);
        console.log("Transformed categories:", categories);
        error = null; // Clear any previous errors
      } else {
        console.error("API call failed - debugging info:");
        console.error("response.status:", response.status);
        console.error("response.data:", response.data);
        error = response.message || response.error || 'No categories found or invalid response structure';
        apiCategories = [];
        categories = [];
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      error = err instanceof Error ? err.message : 'Unknown error occurred';
      apiCategories = [];
      categories = [];
    } finally {
      isLoading = false;
      console.log("fetchCategories completed, isLoading:", isLoading);
    }
  }

  // Handle refresh
  async function handleRefresh() {
    await fetchCategories();
    onRefresh?.();
  }

  // Fetch on mount if required
  onMount(() => {
    if (fetchOnMount) {
      fetchCategories();
    }
  });

  // Public method to fetch categories (called from parent)
  export function loadCategories() {
    return fetchCategories();
  }

  // Public method to set search term (called from parent)
  export function setSearchTerm(term: string) {
    // Search is handled by parent through searchTerm prop
  }

  // Table state
  let sortField = $state<keyof Category | null>(null);
  let sortDirection = $state<"asc" | "desc">("asc");
  let currentPage = $state(1);
  let pageSize = $state(10);

  // Client-side filtering and pagination
  const filteredData = $derived(() => {
    let filtered = categories;

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (category) =>
          category.name.toLowerCase().includes(term)
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

  function handleSort(field: keyof Category) {
    if (sortField === field) {
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      sortField = field;
      sortDirection = "asc";
    }
  }

  function getSortIcon(field: keyof Category) {
    if (sortField !== field) return "↕";
    return sortDirection === "asc" ? "↑" : "↓";
  }

  function handlePageChange(newPage: number) {
    if (newPage >= 1 && newPage <= totalPages()) {
      currentPage = newPage;
    }
  }

  function handleRowClick(category: Category) {
    // Find the corresponding API category
    const apiCategory = apiCategories.find(apiCategory => apiCategory.id.toString() === category.id);
    if (apiCategory && onRowClick) {
      onRowClick(apiCategory);
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
            Error loading categories
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
        <span class="text-gray-700">Loading categories...</span>
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
              onclick={() => handleSort("name")}
            >
              <div class="flex items-center space-x-1">
                <span>Category Name</span>
                <span class="text-gray-400">{getSortIcon("name")}</span>
              </div>
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 bg-gray-50 border-r border-gray-200"
              onclick={() => handleSort("is_active")}
            >
              <div class="flex items-center space-x-1">
                <span>Status</span>
                <span class="text-gray-400">{getSortIcon("is_active")}</span>
              </div>
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 bg-gray-50 border-r border-gray-200"
              onclick={() => handleSort("created_at")}
            >
              <div class="flex items-center space-x-1">
                <span>Created At</span>
                <span class="text-gray-400">{getSortIcon("created_at")}</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {#each paginatedData() as category (category.id)}
            <tr class="hover:bg-gray-50 cursor-pointer border-b border-gray-200" onclick={() => handleRowClick(category)}>
              <td class="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10">
                    <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span class="text-blue-600 font-medium text-sm">
                        {category.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">
                      {category.name}
                    </div>
                    <div class="text-sm text-gray-500">ID: {category.id}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {category.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'}"
                >
                  {category.is_active ? "Active" : "Inactive"}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                {formatDate(category.created_at)}
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
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">
          No categories found
        </h3>
        <p class="mt-1 text-sm text-gray-500">
          {searchTerm
            ? "Try adjusting your search terms."
            : "No categories available."}
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
          <span class="text-gray-500">(filtered from {categories.length} total)</span>
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