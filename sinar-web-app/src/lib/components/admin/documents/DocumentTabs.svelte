<script lang="ts">
  import DateRangePicker from '$lib/components/ui/DateRangePicker.svelte';

  interface $$Props {
    activeTab?: string;
    onTabChange?: (tab: string) => void;
    onSearch?: (term: string) => void;
    onSortChange?: (order: 'asc' | 'desc') => void;
    onRefresh?: () => void;
    onDateRangeChange?: (payload: { startDate: string | null; endDate: string | null }) => void;
    searchTerm?: string;
    sortOrder?: 'asc' | 'desc';
    startDate?: string | null;
    endDate?: string | null;
    isLoading?: boolean;
  }

  let { 
    activeTab = "browse", 
    onTabChange, 
    onSearch,
    onSortChange, 
    onRefresh,
    onDateRangeChange,
    searchTerm = "",
    sortOrder = 'desc',
    startDate = null,
    endDate = null,
    isLoading = false
  }: $$Props = $props();

  function setActiveTab(tab: string) {
    console.log('DocumentTabs: Setting active tab to:', tab);
    console.log('DocumentTabs: onTabChange exists:', !!onTabChange);
    onTabChange?.(tab);
  }

  function getTabClass(tab: string) {
    return `py-2 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm md:text-base transition-colors duration-200 min-w-0 ${
      activeTab === tab
        ? 'border-blue-500 text-blue-600'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`;
  }

  function handleSearchInput(event: Event) {
    const target = event.target as HTMLInputElement;
    onSearch?.(target.value);
  }

  function handleRefresh() {
    onRefresh?.();
  }

  function handleSortToggle() {
    const newOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    onSortChange?.(newOrder);
  }
</script>

<!-- Page Header -->
<div class="mb-4 sm:mb-6">
  <h1 class="text-xl sm:text-2xl font-bold text-gray-900">Master Document</h1>
  <p class="text-gray-600 mt-1 text-sm sm:text-base">Manage and browse documents</p>
</div>

<!-- Tab Navigation and Search -->
<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2 md:gap-3 w-full max-w-full overflow-hidden">
  <nav class="flex space-x-2 sm:space-x-4 md:space-x-6 lg:space-x-8 flex-shrink-0">
    <button
      onclick={() => setActiveTab("browse")}
      class={getTabClass("browse")}
    >
      <div class="flex items-center space-x-1 sm:space-x-2">
        <svg class="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
        </svg>
        <span class="text-xs sm:text-sm md:text-base truncate">Browse</span>
      </div>
    </button>

    <button
      onclick={() => setActiveTab("input")}
      class={getTabClass("input")}
    >
      <div class="flex items-center space-x-1 sm:space-x-2">
        <svg class="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
        </svg>
        <span class="text-xs sm:text-sm md:text-base truncate">Input</span>
      </div>
    </button>
  </nav>

  <!-- Search Bar and Sort (only show when browse tab is active) -->
  {#if activeTab === "browse"}
    <div class="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-2 md:gap-3 w-full sm:w-auto sm:ml-auto">
      <!-- Mobile/Tablet: Search + Sort + Refresh Row - Allow wrapping -->
      <div class="flex lg:hidden items-center flex-wrap gap-2 w-full mt-2 max-w-full">
        <!-- Mobile Sort Toggle Button (Compact) -->
        <div class="relative group flex-shrink-0">
          <button
            onclick={handleSortToggle}
            class="flex items-center gap-1 px-2 py-2 text-xs font-medium bg-gradient-to-r from-slate-50 to-gray-100 hover:from-slate-100 hover:to-gray-200 border border-gray-300 hover:border-gray-400 rounded-md shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 min-w-0"
            title={sortOrder === 'desc' ? 'Currently showing newest first' : 'Currently showing oldest first'}
          >
            <!-- Sort Icon with animation -->
            <svg 
              class="w-3 h-3 text-blue-600 transition-transform duration-300 {sortOrder === 'desc' ? 'rotate-0' : 'rotate-180'} flex-shrink-0" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
            
            <!-- Compact Text - Hidden on very small screens -->
            <span class="text-gray-700 font-semibold text-xs hidden xs:inline-block truncate">
              {sortOrder === 'desc' ? 'New' : 'Old'}
            </span>
          </button>
        </div>

        <!-- Mobile Search Bar (Flexible) -->
        <div class="relative flex-1 min-w-[120px]">
          <input
            type="text"
            placeholder="Search..."
            class="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            oninput={handleSearchInput}
          />
          <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
            <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <!-- Mobile Refresh Button -->
        <div class="relative group flex-shrink-0">
          <button
            onclick={handleRefresh}
            disabled={isLoading}
            class="px-2 py-2 text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-600 hover:to-sky-700 focus:from-cyan-600 focus:to-sky-700 border border-cyan-500 rounded-md shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500 disabled:border-gray-400 transition-all duration-200 flex items-center gap-1 min-w-0"
            aria-label="Refresh documents"
          >
            <svg
              class="w-3.5 h-3.5 {isLoading ? 'animate-spin' : ''} flex-shrink-0"
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
            <span class="text-xs hidden xs:inline-block truncate">Refresh</span>
          </button>
        </div>
      </div>

      <!-- Mobile/Tablet: Date Range Filter -->
      <div class="flex lg:hidden items-center gap-2 w-full mt-1">
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onDateRangeChange={onDateRangeChange}
          className="w-full"
          placeholder="Filter by date"
        />
      </div>

      <!-- Desktop: Sort Toggle Button -->
      <div class="hidden lg:flex relative group flex-shrink-0 order-1">
        <button
          onclick={handleSortToggle}
          class="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-2 text-xs sm:text-sm font-medium bg-gradient-to-r from-slate-50 to-gray-100 hover:from-slate-100 hover:to-gray-200 border border-gray-300 hover:border-gray-400 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 whitespace-nowrap"
          title={sortOrder === 'desc' ? 'Currently showing newest first' : 'Currently showing oldest first'}
        >
          <!-- Sort Icon with animation -->
          <div class="relative flex-shrink-0">
            <svg 
              class="w-3 sm:w-4 h-3 sm:h-4 text-blue-600 transition-transform duration-300 {sortOrder === 'desc' ? 'rotate-0' : 'rotate-180'}" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
          </div>
          
          <!-- Dynamic Text - Responsive -->
          <span class="text-gray-700 font-semibold tracking-wide text-xs sm:text-sm truncate hidden sm:inline-block md:inline-block">
            <span class="sm:hidden md:inline">{sortOrder === 'desc' ? 'New' : 'Old'}</span>
            <span class="hidden sm:inline md:hidden">{sortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
            <span class="hidden md:inline">{sortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
          </span>
          
          <!-- Arrow indicator -->
          <svg 
            class="w-2 sm:w-3 h-2 sm:h-3 text-gray-500 transition-transform duration-200 {sortOrder === 'desc' ? 'rotate-0' : 'rotate-180'} flex-shrink-0 hidden sm:block" 
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
      <div class="hidden lg:flex items-center gap-2 flex-shrink-0 order-2">
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onDateRangeChange={onDateRangeChange}
          className="w-28 sm:w-32 md:w-36 lg:w-40 xl:w-48 flex-shrink-0"
          placeholder="Filter by date"
        />
      </div>

      <!-- Desktop Search Bar -->
      <div class="hidden lg:flex relative flex-1 min-w-0 order-3">
        <input
          type="text"
          placeholder="Search documents..."
          class="w-full sm:w-28 md:w-32 lg:w-40 xl:w-48 2xl:w-56 pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[100px]"
          value={searchTerm}
          oninput={handleSearchInput}
        />
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg class="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <!-- Desktop Refresh Button -->
      <div class="hidden lg:flex relative group flex-shrink-0 order-4">
        <button
          onclick={handleRefresh}
          disabled={isLoading}
          class="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-600 hover:to-sky-700 focus:from-cyan-600 focus:to-sky-700 border border-cyan-500 rounded-md shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500 disabled:border-gray-400 transition-all duration-200 min-w-0"
          aria-label="Refresh documents"
        >
          <svg
            class="w-3 sm:w-4 h-3 sm:h-4 {isLoading ? 'animate-spin' : ''} flex-shrink-0"
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
          {isLoading ? 'Refreshing...' : 'Refresh documents'}
          <!-- Tooltip arrow -->
          <div class="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    </div>
  {/if}
</div>