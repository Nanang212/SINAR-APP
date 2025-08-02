<script lang="ts">
  import { onMount } from "svelte";
  import {
    categoryService,
    type Category as ApiCategory,
  } from "@/lib/services/categories/category.service";
  import ConfirmationModal from '@/lib/components/ui/ConfirmationModal.svelte';
  import { modalToastStore } from '@/lib/stores/modal-toast';

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

  // Modal state
  let showDeleteModal = $state(false);
  let categoryToDelete = $state<Category | null>(null);
  let isDeleting = $state(false);

  // Transform API category to table format
  function transformApiCategory(apiCategory: ApiCategory): Category {
    try {
      return {
        id: apiCategory.id.toString(),
        name: apiCategory.name || "Unknown",
        is_active: apiCategory.is_active ?? true,
        created_at: apiCategory.created_at,
        updated_at: apiCategory.updated_at,
        statusColor: getStatusColor(apiCategory.is_active ?? true),
      };
    } catch (error) {
      console.error("Error transforming category:", error, apiCategory);
      return {
        id: apiCategory.id?.toString() || "unknown",
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
        limit: 10,
        page: 1
      });
      console.log("API Response:", response);
      console.log("Response status:", response.status);
      console.log("Response data:", response.data);

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
        console.error("typeof response.data:", typeof response.data);
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
    searchTerm = term;
    currentPage = 1; // Reset to first page when searching
  }

  // Table state
  let searchTerm = $state("");
  let sortField = $state<keyof Category | null>(null);
  let sortDirection = $state<"asc" | "desc">("asc");
  let currentPage = $state(1);
  let pageSize = $state(10);

  // Filter and sort data (client-side)
  const filteredAndSortedData = $derived(() => {
    let filtered = categories;

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (category) =>
          category.name.toLowerCase().includes(term)
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

  // Paginated data (client-side pagination)
  const paginatedData = $derived(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredAndSortedData().slice(startIndex, endIndex);
  });

  const totalPages = $derived(() =>
    Math.ceil(filteredAndSortedData().length / pageSize)
  );

  function handleSearchChange(event: Event) {
    const input = event.target as HTMLInputElement;
    searchTerm = input.value;
    currentPage = 1; // Reset to first page when searching
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

  function handleDelete(category: Category) {
    categoryToDelete = category;
    showDeleteModal = true;
  }

  async function confirmDelete() {
    if (!categoryToDelete) return;

    isDeleting = true;
    try {
      const response = await categoryService.deleteCategory(categoryToDelete.id);
      
      if (response.status) {
        modalToastStore.success('Category deleted successfully!');
        // Refresh the table
        await fetchCategories();
      } else {
        modalToastStore.error(response.message || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      modalToastStore.error('Failed to delete category: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      isDeleting = false;
      showDeleteModal = false;
      categoryToDelete = null;
    }
  }

  function cancelDelete() {
    showDeleteModal = false;
    categoryToDelete = null;
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
  {:else if error}
    <!-- Error State -->
    <div class="flex justify-center items-center py-12">
      <div class="text-center">
        <svg
          class="mx-auto h-12 w-12 text-red-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">
          Failed to load categories
        </h3>
        <p class="mt-1 text-sm text-gray-500">
          {error}
        </p>
        <div class="mt-4">
          <button
            onclick={handleRefresh}
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Try Again
          </button>
        </div>
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
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50"
            >
              Actions
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
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex items-center justify-center" onclick={(e) => e.stopPropagation()}>
                  <div class="relative group">
                    <button
                      class="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                      onclick={() => handleDelete(category)}
                      aria-label="Delete category"
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
    <div class="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 bg-white sticky bottom-0 z-10">
      <div class="text-sm text-gray-700">
        Showing <span class="font-medium">{Math.min((currentPage - 1) * pageSize + 1, filteredAndSortedData().length)}</span>
        to
        <span class="font-medium"
          >{Math.min(currentPage * pageSize, filteredAndSortedData().length)}</span
        >
        of <span class="font-medium">{filteredAndSortedData().length}</span> results
      </div>

      <div class="flex items-center space-x-2">
        <button
          onclick={() => (currentPage = 1)}
          disabled={currentPage === 1}
          class="px-3 py-1 text-sm text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          First
        </button>

        <button
          onclick={() => (currentPage = Math.max(1, currentPage - 1))}
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
          onclick={() => (currentPage = Math.min(totalPages(), currentPage + 1))}
          disabled={currentPage >= totalPages()}
          class="px-3 py-1 text-sm text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>

        <button
          onclick={() => (currentPage = totalPages())}
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
  title="Delete Category"
  message={`Are you sure you want to delete category "${categoryToDelete?.name}"? This action cannot be undone.`}
  confirmText="Delete"
  cancelText="Cancel"
  confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
  onConfirm={confirmDelete}
  onCancel={cancelDelete}
  isLoading={isDeleting}
/>