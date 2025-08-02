<script lang="ts">
  import { DashboardLayout } from "$lib";
  import { CategoryTabs, CategoryTable, CategoryForm } from "@/lib/components/admin/categories";
  import type { Category, CreateCategoryRequest, UpdateCategoryRequest } from "@/lib/services/categories/category.service";
  import { categoryService } from "@/lib/services";
  import { modalToastStore } from '$lib/stores/modal-toast';

  // Component state
  let activeTab = $state("browse");
  let searchTerm = $state("");
  let isLoading = $state(false);
  let selectedCategory = $state<Category | null>(null);

  // Table reference
  let categoryTableRef: any;

  // Tab change handler
  function handleTabChange(tab: string) {
    console.log('Page: Tab changed to:', tab);
    activeTab = tab;
    selectedCategory = null; // Clear selection when changing tabs
    
    // Fetch categories when switching to browse tab
    if (tab === "browse" && categoryTableRef) {
      console.log('Loading categories...');
      categoryTableRef.loadCategories();
    }
  }

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
    activeTab = "input"; // Switch to form tab for editing
  }

  // Form reset handler
  function handleReset() {
    console.log('Page: Form reset');
    // Clear selected category when form is reset
    selectedCategory = null;
    // Refresh category table
    if (categoryTableRef) {
      categoryTableRef.loadCategories();
    }
  }

  // Form submit handler - NO API CALLS HERE!
  function handleFormSubmit() {
    console.log('✅ FIXED VERSION: Page only handling UI state - NO API CALLS');
    console.trace('Page handleFormSubmit call stack - SHOULD NOT CALL API');
    
    // CategoryForm already handled the API call successfully
    // This function ONLY handles UI state changes
    
    selectedCategory = null;
    activeTab = "browse";
    
    if (categoryTableRef) {
      categoryTableRef.loadCategories();
    }
  }

</script>

<svelte:head>
  <title>Master Category - Admin Panel</title>
</svelte:head>

<DashboardLayout>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 relative" style="height: calc(100vh - 150px);">
    <!-- Gradient line at top -->
    <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 z-10 rounded-t-lg"></div>
    
    <!-- Fixed Header and Tabs -->
    <div class="absolute top-1 left-0 right-0 bg-white z-20 border-b border-gray-200 shadow-sm">
      <div class="px-6 pt-5 pb-4">
        <CategoryTabs 
          {activeTab} 
          onTabChange={handleTabChange}
          onSearch={handleSearch}
          onRefresh={handleRefresh}
          {searchTerm}
          {isLoading}
        />
      </div>
    </div>
    
    <!-- Tab Content -->
    <div class="absolute inset-0 pt-[100px] overflow-y-auto overflow-x-hidden">
      {#if activeTab === "input"}
        <CategoryForm 
          categoryData={selectedCategory}
          onSubmit={handleFormSubmit}
          onReset={handleReset}
        />
      {:else if activeTab === "browse"}
        <CategoryTable 
          bind:this={categoryTableRef}
          fetchOnMount={true}
          onRefresh={() => console.log('Categories refreshed')}
          onRowClick={handleCategoryRowClick}
        />
      {/if}
    </div>
  </div>
</DashboardLayout>