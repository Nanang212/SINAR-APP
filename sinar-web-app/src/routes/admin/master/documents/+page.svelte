<script lang="ts">
  import { DashboardLayout } from "$lib";
  import { MasterDocumentForm, MasterDocumentTable, MasterDocumentTabs } from '@/lib/components/admin/master';
  import { type Category } from '$lib/services';

  let activeTab = $state("input");
  let masterDocumentTableRef = $state<MasterDocumentTable>();
  let selectedCategory = $state<Category | null>(null);

  function handleTabChange(tab: string) {
    console.log('Tab change requested:', tab);
    console.log('Current activeTab:', activeTab);
    activeTab = tab;
    console.log('New activeTab:', activeTab);
    
    // Fetch categories when switching to browse tab
    if (tab === "browse" && masterDocumentTableRef) {
      console.log('Loading categories...');
      masterDocumentTableRef.loadCategories();
    }
  }

  function handleFormSubmit(data: FormData) {
    console.log('Form submitted:', data);
    // Refresh category table after successful submit
    if (masterDocumentTableRef) {
      masterDocumentTableRef.loadCategories();
    }
  }

  function handleFormReset() {
    console.log('Form reset');
    // Clear selected category when form is reset
    selectedCategory = null;
    // Refresh category table
    if (masterDocumentTableRef) {
      masterDocumentTableRef.loadCategories();
    }
  }

  function handleCategoryDelete(category: any) {
    console.log('Delete category:', category);
    // Handle category delete logic here
  }

  function handleRowClick(category: Category) {
    console.log('Row clicked:', category);
    selectedCategory = category;
    activeTab = "input"; // Switch to input tab
  }

</script>

<DashboardLayout>
  <div class="h-full flex flex-col">
    <!-- Sticky Header and Tabs -->
    <div class="sticky top-0 bg-gradient-to-br from-slate-50 to-blue-50 z-20 pb-6">
      <MasterDocumentTabs {activeTab} onTabChange={handleTabChange} />
    </div>

    <!-- Scrollable Tab Content -->
    <div class="flex-1 overflow-auto">
      <div class="bg-white rounded-lg shadow-sm border border-gray-200">
        {#if activeTab === "input"}
          <MasterDocumentForm onSubmit={handleFormSubmit} onReset={handleFormReset} categoryData={selectedCategory} />
        {:else if activeTab === "browse"}
          <MasterDocumentTable 
            bind:this={masterDocumentTableRef}
            fetchOnMount={true}
            onDelete={handleCategoryDelete}
            onRefresh={() => console.log('Categories refreshed')}
            onRowClick={handleRowClick}
          />
        {/if}
      </div>
    </div>
  </div>
</DashboardLayout>