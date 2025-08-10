<script lang="ts">
  import { DashboardLayout } from "$lib";
  import { CategoryTabs, CategoryTable, CategoryForm } from "@/lib/components/admin/categories";
  import type { Category, CreateCategoryRequest, UpdateCategoryRequest } from "@/lib/services/categories/category.service";
  import { categoryService } from "@/lib/services";

  // Component state
  let activeTab = $state("input");
  let searchTerm = $state("");
  let sortOrder = $state<'asc' | 'desc'>('desc');
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
      categoryTableRef.setSearchParams(term, sortOrder);
    }
  }

  function handleSortChange(order: 'asc' | 'desc') {
    sortOrder = order;
    if (categoryTableRef) {
      categoryTableRef.setSearchParams(searchTerm, order);
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

  // Category delete handler
  async function handleCategoryDelete(category: any) {
    console.log('Page: Delete category requested:', category);
    
    const confirmed = confirm(`Are you sure you want to delete category "${category.name}"?`);
    if (!confirmed) return;

    isLoading = true;
    try {
      const response = await categoryService.deleteCategory(category.id);
      
      if (response.status) {
        console.log('Category deleted successfully');
        // Refresh the table
        if (categoryTableRef) {
          await categoryTableRef.loadCategories();
        }
      } else {
        console.error('Failed to delete category:', response.message);
        alert(`Failed to delete category: ${response.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('An error occurred while deleting the category');
    } finally {
      isLoading = false;
    }
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
    console.log('✅ REGULAR CATEGORIES PAGE - FIXED: Only handling UI state');
    
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
  <title>Categories - Admin Panel</title>
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
          onSortChange={handleSortChange}
          onRefresh={handleRefresh}
          {searchTerm}
          {sortOrder}
          {isLoading}
        />
      </div>
    </div>
    
    <!-- Tab Content -->
    <div class="absolute inset-0 pt-[120px] sm:pt-[130px] {activeTab === 'input' ? 'overflow-y-auto overflow-x-hidden' : 'overflow-hidden'}">
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
          onDelete={handleCategoryDelete}
          onRefresh={() => console.log('Categories refreshed')}
          onRowClick={handleCategoryRowClick}
          {searchTerm}
          {sortOrder}
        />
      {/if}
    </div>
  </div>
</DashboardLayout>