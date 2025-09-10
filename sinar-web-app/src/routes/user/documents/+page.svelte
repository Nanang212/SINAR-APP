<script lang="ts">
  import { onMount } from "svelte";
  import { LoadingAuthGuard } from "$lib/utils";
  import { Loading } from "$lib";
  import { DashboardLayout } from "$lib";
  import { DocumentListTable } from '@/lib/components/user';
  import DateRangePicker from '$lib/components/ui/DateRangePicker.svelte';
  import { type Document } from '$lib/services';

  let hasAccess = $state(false);
  let showRedirectLoading = $state(false);

  onMount(async () => {
    // Guard protected page with loading - redirect to login if not authenticated
    const access = await LoadingAuthGuard.guardProtectedPage((loading) => {
      showRedirectLoading = loading;
    });
    hasAccess = access;
  });

  let documentTableRef = $state<DocumentListTable>();
  let selectedDocument = $state<Document | null>(null);
  let searchTerm = $state("");
  let sortOrder = $state<'asc' | 'desc'>('desc'); // Default to newest first (desc by id)
  let isLoading = $state(false);
  
  // Date filter state
  let startDate = $state<string | null>(null);
  let endDate = $state<string | null>(null);

  function handleSearch(term: string) {
    searchTerm = term;
    if (documentTableRef) {
      documentTableRef.setSearchParams(term, sortOrder);
    }
  }

  function handleSortToggle() {
    const newOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    sortOrder = newOrder;
    if (documentTableRef) {
      documentTableRef.setSearchParams(searchTerm, newOrder);
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

  function handleDateRangeChange(payload: { startDate: string | null; endDate: string | null }) {
    startDate = payload.startDate;
    endDate = payload.endDate;
    if (documentTableRef) {
      documentTableRef.setDateRange(startDate, endDate);
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
  {#if hasAccess}
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
            <!-- Search Bar, Sort and Refresh Button - moved to right -->
            <div class="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 w-full sm:w-auto ml-auto">
              <!-- Mobile/Tablet: Search + Sort Row -->
              <div class="flex lg:hidden items-center flex-wrap gap-2 w-full">
                <!-- Mobile Sort Toggle Button (Compact) -->
                <div class="relative group flex-shrink-0">
                  <button
                    onclick={handleSortToggle}
                    class="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-gradient-to-r from-slate-50 to-gray-100 hover:from-slate-100 hover:to-gray-200 border border-gray-300 hover:border-gray-400 rounded-md shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                    title={sortOrder === 'desc' ? 'Currently showing newest first' : 'Currently showing oldest first'}
                  >
                    <!-- Sort Icon with animation -->
                    <svg 
                      class="w-3.5 h-3.5 text-blue-600 transition-transform duration-300 {sortOrder === 'desc' ? 'rotate-0' : 'rotate-180'}" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                    </svg>
                    
                    <!-- Compact Text -->
                    <span class="text-gray-700 font-semibold text-xs">
                      {sortOrder === 'desc' ? 'New' : 'Old'}
                    </span>
                  </button>
                </div>

                <!-- Mobile Search Bar (Flexible) -->
                <div class="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search..."
                    class="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchTerm}
                    oninput={(e) => handleSearch(e.currentTarget.value)}
                  />
                  <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <!-- Mobile/Tablet: Date Range Filter -->
              <div class="flex lg:hidden items-center gap-2 w-full mt-1">
                <DateRangePicker
                  startDate={startDate}
                  endDate={endDate}
                  onDateRangeChange={handleDateRangeChange}
                  className="flex-1"
                  placeholder="Filter by date"
                />
              </div>

              <!-- Desktop: Sort Toggle Button -->
              <div class="hidden lg:block relative group flex-shrink-0">
                <button
                  onclick={handleSortToggle}
                  class="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gradient-to-r from-slate-50 to-gray-100 hover:from-slate-100 hover:to-gray-200 border border-gray-300 hover:border-gray-400 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 min-w-[100px]"
                  title={sortOrder === 'desc' ? 'Currently showing newest first' : 'Currently showing oldest first'}
                >
                  <!-- Sort Icon with animation -->
                  <div class="relative">
                    <svg 
                      class="w-4 h-4 text-blue-600 transition-transform duration-300 {sortOrder === 'desc' ? 'rotate-0' : 'rotate-180'}" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                    </svg>
                  </div>
                  
                  <!-- Dynamic Text -->
                  <span class="text-gray-700 font-semibold tracking-wide">
                    {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
                  </span>
                  
                  <!-- Arrow indicator -->
                  <svg 
                    class="w-3 h-3 text-gray-500 transition-transform duration-200 {sortOrder === 'desc' ? 'rotate-0' : 'rotate-180'}" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7-7-7 7" />
                  </svg>
                </button>
                
                <!-- Tooltip -->
                <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-xs font-medium text-white bg-gray-900 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                  Click to sort by {sortOrder === 'desc' ? 'oldest' : 'newest'} first
                  <!-- Tooltip arrow -->
                  <div class="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>

              <!-- Desktop: Date Range Filter -->
              <div class="hidden lg:flex items-center gap-2 flex-shrink-0">
                <DateRangePicker
                  startDate={startDate}
                  endDate={endDate}
                  onDateRangeChange={handleDateRangeChange}
                  className="w-48"
                  placeholder="Filter by date"
                />
              </div>

              <!-- Desktop Search Bar -->
              <div class="hidden lg:block relative flex-1 lg:flex-none min-w-0">
                <input
                  type="text"
                  placeholder="Search documents..."
                  class="w-full lg:w-48 xl:w-64 2xl:w-80 pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[120px]"
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
      <div class="absolute inset-0 pt-[200px] xs:pt-[180px] sm:pt-[180px] md:pt-[200px] lg:pt-[180px] xl:pt-[200px] 2xl:pt-[100px]">
        <DocumentListTable 
          bind:this={documentTableRef}
          fetchOnMount={true}
          onRefresh={() => console.log('Documents refreshed')}
          onRowClick={handleRowClick}
          {searchTerm}
          {sortOrder}
        />
      </div>
    </div>
  {/if}
</DashboardLayout>

<!-- Redirect loading overlay -->
{#if showRedirectLoading}
  <Loading overlay={true} text="Redirecting to login..." />
{/if}