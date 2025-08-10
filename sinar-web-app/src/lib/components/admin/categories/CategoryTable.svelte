<script lang="ts">
  import { onMount } from "svelte";
  import {
    categoryService,
    type Category as ApiCategory,
    type PaginationParams,
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
  let categories = $state<Category[]>([]);
  let apiCategories = $state<ApiCategory[]>([]);

  // Server-side pagination state
  let currentPage = $state(1);
  let pageSize = $state(10);
  
  // Pagination state
  let totalRecords = $state(0);
  let totalPages = $state(0);

  // Modal state
  let showDeleteModal = $state(false);
  let categoryToDelete = $state<Category | null>(null);
  let isDeleting = $state(false);

  // Backend handles search and sorting
  const paginatedData = $derived(() => categories);
  const filteredTotalRecords = $derived(() => totalRecords);
  const filteredTotalPages = $derived(() => totalPages);

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

  // Fetch categories with server-side pagination, search and sort
  async function fetchCategories(page: number = 1, search: string = '', order: 'asc' | 'desc' = 'desc') {
    console.log(`Starting fetchCategories with pagination - Page: ${page}, Search: "${search}", Order: ${order}`);
    isLoading = true;
    error = null;

    try {
      console.log("Calling categoryService.getAllCategoriesWithPagination() with backend pagination, search and sort...");
      const params: PaginationParams = {
        page: page,
        limit: pageSize,
        search: search,
        order: order,
      };
      
      const response = await categoryService.getAllCategoriesWithPagination(params);
      console.log("API Response:", response);
      
      if (response.status === true && response.data) {
        console.log("API Response data:", response.data);
        
        const paginatedData = response.data;
        
        // Check if data is directly an array or nested in .data property
        let categoriesArray = null;
        if (Array.isArray(paginatedData)) {
          // Case 1: data is directly the categories array (current API structure)
          categoriesArray = paginatedData;
          console.log("Found categories directly in response.data");
        } else if (paginatedData.data && Array.isArray(paginatedData.data)) {
          // Case 2: data is nested in response.data.data
          categoriesArray = paginatedData.data;
          console.log("Found categories in response.data.data");
        }

        if (categoriesArray) {
          console.log("Processing", categoriesArray.length, "categories...");
          
          // Store original API data and transform to display format
          apiCategories = categoriesArray; // Store original API categories
          categories = categoriesArray.map(transformApiCategory);
          
          // Use pagination info from API response - check both response and response.data
          totalRecords = response.total || paginatedData.total || categoriesArray.length;
          totalPages = response.totalPages || paginatedData.totalPages || Math.ceil(totalRecords / pageSize);
          currentPage = page;
          
          console.log("Categories loaded - Total:", totalRecords, "Current Page:", currentPage, "Total Pages:", totalPages);
          error = null; // Clear any previous errors
        } else {
          console.error("Invalid response format - no categories array found:", paginatedData);
          error = "Invalid response format";
          categories = [];
          totalRecords = 0;
          totalPages = 0;
        }
      } else {
        console.error("Failed to fetch categories:", response.message);
        error = response.message || "Failed to fetch categories";
        categories = [];
        totalRecords = 0;
        totalPages = 0;
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      error = errorMessage;
      categories = [];
      totalRecords = 0;
      totalPages = 0;
    } finally {
      isLoading = false;
      console.log("fetchCategories completed, isLoading:", isLoading);
    }
  }

  // Handle refresh
  async function handleRefresh() {
    await fetchCategories(currentPage, searchTerm, sortOrder);
    onRefresh?.();
  }

  // Fetch on mount if required
  onMount(() => {
    if (fetchOnMount) {
      fetchCategories(1, searchTerm, sortOrder);
    }
  });

  // Public method to fetch categories (called from parent)
  export function loadCategories() {
    return fetchCategories(1, searchTerm, sortOrder);
  }

  // Public method to set search parameters (called from parent)
  export function setSearchParams(search: string, order: 'asc' | 'desc') {
    currentPage = 1; // Reset to page 1 when search/sort changes
    fetchCategories(1, search, order);
  }

  async function handlePageChange(newPage: number) {
    if (newPage >= 1 && newPage <= filteredTotalPages()) {
      await fetchCategories(newPage, searchTerm, sortOrder);
    }
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
        // Refresh the table with current search/sort params
        await fetchCategories(currentPage, searchTerm, sortOrder);
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

<div class="h-full flex flex-col pl-2 sm:pl-4 lg:pl-6 pr-2 sm:pr-4 lg:pr-8 pb-4 sm:pb-6 pt-6 sm:pt-10">

  <!-- Loading State -->
  {#if isLoading}
    <div class="flex justify-center items-center py-12">
      <div class="flex items-center space-x-2">
        <svg class="w-6 h-6 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span class="text-gray-700">Loading categories...</span>
      </div>
    </div>
  {:else}
    <!-- Data Table -->
    <div class="flex-1 pr-0 sm:pr-4 overflow-auto">
      <div class="mt-16 sm:mt-8">
        <table class="min-w-full divide-y divide-gray-200 border border-gray-200">
          <thead class="bg-gray-50 sticky top-12 sm:-top-1 z-10">
            <tr>
              <th class="px-3 sm:px-4 lg:px-6 py-4 sm:py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-r border-gray-200 min-w-[220px] sm:min-w-[180px]">
                Category Name
              </th>
              <th class="px-3 sm:px-4 lg:px-6 py-4 sm:py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-r border-gray-200 min-w-[130px] sm:min-w-[100px]">
                Status
              </th>
              <th class="px-3 sm:px-4 lg:px-6 py-4 sm:py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-r border-gray-200 min-w-[170px] sm:min-w-[140px]">
                Created At
              </th>
              <th class="px-3 sm:px-4 lg:px-6 py-4 sm:py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 min-w-[130px] sm:min-w-[90px]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#if paginatedData().length === 0 && !isLoading}
              <!-- Empty State Row -->
              <tr>
                <td colspan="4" class="px-6 py-16 text-center">
                  <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <h3 class="mt-2 text-sm font-medium text-gray-900">No categories found</h3>
                  <p class="mt-1 text-sm text-gray-500">
                    {searchTerm ? "Try adjusting your search terms." : "No categories available."}
                  </p>
                </td>
              </tr>
            {:else}
              {#each paginatedData() as category (category.id)}
                <tr class="hover:bg-gray-50 cursor-pointer border-b border-gray-200" onclick={() => handleRowClick(category)}>
                  <!-- Category Name Column -->
                  <td class="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-r border-gray-200">
                    <div class="flex items-center">
                      <div class="flex-shrink-0 h-6 w-6 sm:h-8 sm:w-8 mr-2 sm:mr-3">
                        <div class="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span class="text-blue-600 font-medium text-xs sm:text-sm">
                            {category.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div class="min-w-0 flex-1">
                        <div class="text-sm font-medium text-gray-900 truncate" title={category.name}>
                          {category.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <!-- Status Column -->
                  <td class="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-r border-gray-200">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {category.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                      {category.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  
                  <!-- Created At Column -->
                  <td class="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 border-r border-gray-200">
                    <div class="hidden sm:block">{formatDate(category.created_at)}</div>
                    <div class="sm:hidden">{formatDate(category.created_at).split(' ')[0]}</div>
                  </td>
                  
                  <!-- Actions Column -->
                  <td class="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex items-center justify-center" onclick={(e) => e.stopPropagation()}>
                      <div class="relative group">
                        <button
                          onclick={() => handleDelete(category)}
                          class="text-red-600 hover:text-red-800 p-2 rounded-md hover:bg-red-50 transition-colors"
                          aria-label="Delete category"
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
            {/if}
          </tbody>
        </table>
      </div>
    </div>

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