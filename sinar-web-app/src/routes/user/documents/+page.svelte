<script lang="ts">
  import { DashboardLayout } from "$lib";
  import { DocumentListTable } from '@/lib/components/user';
  import { type Document } from '$lib/services';

  let documentTableRef = $state<DocumentListTable>();
  let selectedDocument = $state<Document | null>(null);
  let searchTerm = $state("");
  let isLoading = $state(false);

  function handleSearch(term: string) {
    searchTerm = term;
    if (documentTableRef) {
      documentTableRef.setSearchTerm(term);
    }
  }

  function handleRefresh() {
    isLoading = true;
    if (documentTableRef) {
      documentTableRef.loadDocuments().finally(() => {
        isLoading = false;
      });
    }
  }

  function handleDocumentDelete(document: any) {
    console.log('Delete document:', document);
    // Handle document delete logic here - for list view, might be read-only
  }

  function handleRowClick(document: Document) {
    console.log('Row clicked:', document);
    selectedDocument = document;
    // Could open a view modal instead of edit
  }
</script>

<svelte:head>
  <title>List Documents - SINAR</title>
</svelte:head>

<DashboardLayout>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 relative" style="height: calc(100vh - 150px);">
    <!-- Gradient line at top -->
    <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 z-10 rounded-t-lg"></div>
    
    <!-- Fixed Header -->
    <div class="absolute top-1 left-0 right-0 bg-white z-30 border-b border-gray-200 shadow-sm">
      <div class="px-4 sm:px-6 pt-4 sm:pt-5 pb-4">
        <!-- Page Header -->
        <div class="mb-4 sm:mb-6">
          <h1 class="text-xl sm:text-2xl font-bold text-gray-900">List Documents</h1>
          <p class="text-sm sm:text-base text-gray-600 mt-1">Browse and search documents</p>
        </div>

        <!-- Navigation and Search -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-end gap-4">
          <!-- Search Bar and Refresh Button - moved to right -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto ml-auto">
            <!-- Search Bar -->
            <div class="relative flex-1 sm:flex-none">
              <input
                type="text"
                placeholder="Search documents..."
                class="w-full sm:w-64 md:w-80 lg:w-96 pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                oninput={(e) => handleSearch(e.currentTarget.value)}
              />
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <!-- Refresh Button -->
            <div class="relative group">
              <button
                onclick={handleRefresh}
                disabled={isLoading}
                class="w-full sm:w-auto px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-600 hover:to-sky-700 focus:from-cyan-600 focus:to-sky-700 border border-cyan-500 rounded-md shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500 disabled:border-gray-400 transition-all duration-200 flex items-center justify-center gap-2"
                aria-label="Refresh documents"
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
                <span class="sm:hidden">Refresh</span>
              </button>
              
              <!-- Tooltip -->
              <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-gray-900 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                {isLoading ? 'Refreshing...' : 'Refresh documents'}
                <!-- Tooltip arrow -->
                <div class="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Document Table Content -->
    <div class="absolute inset-0 pt-[120px] sm:pt-[100px]">
      <DocumentListTable 
        bind:this={documentTableRef}
        fetchOnMount={true}
        onRefresh={() => console.log('Documents refreshed')}
        onRowClick={handleRowClick}
        {searchTerm}
      />
    </div>
  </div>
</DashboardLayout>