<script lang="ts">
  import { DashboardLayout } from "$lib";
  import { CategoryListTable } from "@/lib/components/user";
  import type { Category } from "@/lib/services/categories/category.service";

  // Component state
  let searchTerm = $state("");
  let isLoading = $state(false);
  let selectedCategory = $state<Category | null>(null);

  // Table reference
  let categoryTableRef: CategoryListTable;

  // Search handler
  function handleSearch(term: string) {
    console.log('Page: Search term:', term);
    searchTerm = term;
    if (categoryTableRef) {
      categoryTableRef.setSearchTerm(term);
    }
  }

  // Refresh handler
  async function handleRefresh() {
    console.log('Page: Refreshing categories...');
    isLoading = true;
    if (categoryTableRef) {
      categoryTableRef.loadCategories().finally(() => {
        isLoading = false;
      });
    }
  }

  // Category row click handler
  function handleCategoryRowClick(category: Category) {
    console.log('Page: Category row clicked:', category);
    selectedCategory = category;
    // Could open a view modal instead of edit
  }

  // Category delete handler - for list view, might be read-only
  async function handleCategoryDelete(category: any) {
    console.log('Page: Delete category requested:', category);
    // For list view, might want to disable delete or make it read-only
    alert('Delete functionality disabled in list view');
  }
</script>

<svelte:head>
  <title>List Categories - SINAR</title>
</svelte:head>

<DashboardLayout>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 relative" style="height: calc(100vh - 150px);">
    <!-- Gradient line at top -->
    <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 z-10 rounded-t-lg"></div>
    
    <!-- Fixed Header -->
    <div class="absolute top-1 left-0 right-0 bg-white z-20 border-b border-gray-200 shadow-sm">
      <div class="px-6 pt-5 pb-4">
        <!-- Page Header -->
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900">List Categories</h1>
          <p class="text-gray-600 mt-1">Browse and search categories</p>
        </div>

        <!-- Search Bar and Refresh Button -->
        <div class="flex items-center justify-end">
          <!-- Search Bar and Refresh Button (right side) -->
          <div class="flex items-center space-x-3">
            <!-- Search Bar -->
            <div class="relative">
              <input
                type="text"
                placeholder="Search categories..."
                class="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                oninput={(e) => handleSearch(e.currentTarget.value)}
              />
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <!-- Refresh Button -->
          <div class="relative group">
            <button
              onclick={handleRefresh}
              disabled={isLoading}
              class="px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-600 hover:to-sky-700 focus:from-cyan-600 focus:to-sky-700 border border-cyan-500 rounded-md shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500 disabled:border-gray-400 transition-all duration-200"
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
            
            <!-- Tooltip -->
            <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-gray-900 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
              {isLoading ? 'Refreshing...' : 'Refresh categories'}
              <!-- Tooltip arrow -->
              <div class="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Category Table Content -->
    <div class="absolute inset-0 pt-[100px] overflow-y-auto overflow-x-hidden">
      <CategoryListTable 
        bind:this={categoryTableRef}
        fetchOnMount={true}
        onRefresh={() => console.log('Categories refreshed')}
        onRowClick={handleCategoryRowClick}
        {searchTerm}
      />
    </div>
  </div>
</DashboardLayout>