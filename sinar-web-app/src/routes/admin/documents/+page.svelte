<script lang="ts">
  import { onMount } from "svelte";
  import { LoadingAuthGuard } from "$lib/utils";
  import { Loading } from "$lib";
  import { DashboardLayout } from "$lib";
  import { DocumentForm, DocumentTable, DocumentTabs } from '@/lib/components/admin';
  import { type Document } from '$lib/services';

  let hasAccess = $state(false);
  let showRedirectLoading = $state(false);

  onMount(async () => {
    // Guard admin page with loading - redirect if not authenticated or not admin
    const access = await LoadingAuthGuard.guardAdminPage((loading) => {
      showRedirectLoading = loading;
    });
    hasAccess = access;
  });

  let activeTab = $state("browse");
  let documentTableRef = $state<DocumentTable>();
  let selectedDocument = $state<Document | null>(null);
  let searchTerm = $state("");
  let sortOrder = $state<'asc' | 'desc'>('desc');
  let isLoading = $state(false);

  function handleTabChange(tab: string) {
    console.log('Tab change requested:', tab);
    console.log('Current activeTab:', activeTab);
    activeTab = tab;
    console.log('New activeTab:', activeTab);
    
    // Fetch documents when switching to browse tab (now on the left)
    if (tab === "browse" && documentTableRef) {
      console.log('Loading documents...');
      documentTableRef.loadDocuments();
    }
  }

  function handleSearch(term: string) {
    console.log('Page: Search term:', term);
    searchTerm = term;
    if (documentTableRef) {
      documentTableRef.setSearchParams(term, sortOrder);
    }
  }

  function handleSortChange(order: 'asc' | 'desc') {
    sortOrder = order;
    if (documentTableRef) {
      documentTableRef.setSearchParams(searchTerm, order);
    }
  }

  async function handleRefresh() {
    console.log('Page: Refreshing documents...');
    isLoading = true;
    if (documentTableRef) {
      documentTableRef.loadDocuments().finally(() => {
        isLoading = false;
      });
    }
  }

  function handleFormSubmit(data: FormData) {
    console.log('Form submitted:', data);
    // Refresh document table after successful submit
    if (documentTableRef) {
      documentTableRef.loadDocuments();
    }
  }

  function handleFormReset() {
    console.log('Form reset');
    // Clear selected document when form is reset
    selectedDocument = null;
    // Refresh document table
    if (documentTableRef) {
      documentTableRef.loadDocuments();
    }
  }

  function handleDocumentDelete(document: any) {
    console.log('Delete document:', document);
    // Handle document delete logic here
  }

  function handleRowClick(document: Document) {
    console.log('Row clicked:', document);
    selectedDocument = document;
    activeTab = "input"; // Switch to input tab (now on the right)
  }

</script>

<DashboardLayout>
  {#if hasAccess}
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 relative" style="height: calc(100vh - 150px);">
      <!-- Gradient line at top -->
      <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 z-10 rounded-t-lg"></div>
      
      <!-- Fixed Header and Tabs -->
      <div class="absolute top-1 left-0 right-0 bg-white z-20 border-b border-gray-200 shadow-sm">
        <div class="px-6 pt-5 pb-4">
          <DocumentTabs 
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
          <DocumentForm onSubmit={handleFormSubmit} onReset={handleFormReset} documentData={selectedDocument} />
        {:else if activeTab === "browse"}
          <DocumentTable 
            bind:this={documentTableRef}
            fetchOnMount={true}
            onDelete={handleDocumentDelete}
            onRefresh={() => console.log('Documents refreshed')}
            onRowClick={handleRowClick}
            {searchTerm}
            {sortOrder}
          />
        {/if}
      </div>
    </div>
  {/if}
</DashboardLayout>

<!-- Redirect loading overlay -->
{#if showRedirectLoading}
  <Loading overlay={true} text="Redirecting..." />
{/if}