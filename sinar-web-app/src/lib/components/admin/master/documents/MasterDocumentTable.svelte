<script lang="ts">
  import { onMount } from "svelte";
  import {
    categoryService,
    type Category as ApiCategory,
  } from "@/lib/services";

  interface Category {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
    updated_at: string;
  }

  interface $$Props {
    fetchOnMount?: boolean;
    onDelete?: (category: Category) => void;
    onRefresh?: () => void;
    onRowClick?: (category: ApiCategory) => void;
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
  let categories = $state<Category[]>([]);
  let apiCategories = $state<ApiCategory[]>([]);

  // Transform API category to table format
  function transformApiCategory(apiCat: ApiCategory): Category {
    try {
      return {
        id: apiCat.id.toString(),
        name: apiCat.name || "Untitled",
        description: apiCat.description || null,
        created_at: apiCat.created_at || new Date().toISOString(),
        updated_at: apiCat.updated_at || new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error transforming category:", error, apiCat);
      return {
        id: apiCat.id?.toString() || "unknown",
        name: "Error loading category",
        description: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
  }

  // Fetch categories from API
  async function fetchCategories() {
    console.log("Starting fetchCategories...");
    isLoading = true;
    error = null;

    try {
      console.log("Calling categoryService.getAllCategories()...");
      const response = await categoryService.getAllCategories();
      console.log("API Response:", response);

      if (
        response.status === true &&
        response.data &&
        Array.isArray(response.data)
      ) {
        console.log("Processing", response.data.length, "categories...");
        apiCategories = response.data; // Store original API categories
        categories = response.data.map(transformApiCategory);
        console.log("Transformed categories:", categories);
        error = null;
      } else {
        error = response.message || "Failed to fetch categories";
        categories = [];
        apiCategories = [];
        console.warn(
          "API Error - Status:",
          response.status,
          "Message:",
          response.message
        );
      }
    } catch (err) {
      error = err instanceof Error ? err.message : "Unknown error occurred";
      categories = [];
      apiCategories = [];
      console.error("Fetch Error:", err);
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

  // Table state
  let searchTerm = $state("");
  let sortField = $state<keyof Category | null>(null);
  let sortDirection = $state<"asc" | "desc">("asc");
  let currentPage = $state(0);
  let pageSize = $state(10);

  // Filter and sort data
  const filteredAndSortedData = $derived(() => {
    let filtered = categories;

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (cat) =>
          cat.name.toLowerCase().includes(term) ||
          (cat.description && cat.description.toLowerCase().includes(term))
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

  function handleDelete(cat: Category) {
    onDelete?.(cat);
  }

  function handleRowClick(cat: Category) {
    // Find the corresponding API category
    const apiCat = apiCategories.find(apiCat => apiCat.id.toString() === cat.id);
    if (apiCat && onRowClick) {
      onRowClick(apiCat);
    }
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
</script>

<div class="p-6">
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-lg font-semibold text-gray-900">Category List</h2>

    <div class="flex items-center space-x-4">
      <!-- Search -->
      <div class="relative">
        <input
          type="text"
          placeholder="Search categories..."
          class="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={searchTerm}
          oninput={handleSearchChange}
        />
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <!-- Refresh Button -->
      <button
        onclick={handleRefresh}
        disabled={isLoading}
        class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Refresh categories"
      >
        <svg
          class="w-4 h-4 {isLoading ? 'animate-spin' : ''}"
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
      </button>
    </div>
  </div>

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
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100"
              onclick={() => handleSort("name")}
            >
              <div class="flex items-center space-x-1">
                <span>Category Name</span>
                <span class="text-gray-400">{getSortIcon("name")}</span>
              </div>
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Description
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100"
              onclick={() => handleSort("created_at")}
            >
              <div class="flex items-center space-x-1">
                <span>Created Date</span>
                <span class="text-gray-400">{getSortIcon("created_at")}</span>
              </div>
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {#each paginatedData() as cat (cat.id)}
            <tr class="hover:bg-gray-50 cursor-pointer" onclick={() => handleRowClick(cat)}>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-8 w-8">
                    <div class="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span class="text-blue-600 font-medium text-sm">
                        {cat.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">
                      {cat.name}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm text-gray-900">
                  {cat.description || '-'}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatDate(cat.created_at)}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex items-center space-x-2" onclick={(e) => e.stopPropagation()}>
                  <button
                    class="text-red-600 hover:text-red-900"
                    onclick={() => handleDelete(cat)}
                  >
                    Delete
                  </button>
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
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">
          No categories found
        </h3>
        <p class="mt-1 text-sm text-gray-500">
          {searchTerm
            ? "Try adjusting your search terms."
            : "Get started by adding some categories."}
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