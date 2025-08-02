<script lang="ts">
  interface $$Props {
    activeTab?: string;
    onTabChange?: (tab: string) => void;
    onSearch?: (term: string) => void;
    onRefresh?: () => void;
    searchTerm?: string;
    isLoading?: boolean;
  }

  let { 
    activeTab = "input", 
    onTabChange, 
    onSearch, 
    onRefresh,
    searchTerm = "",
    isLoading = false
  }: $$Props = $props();

  function setActiveTab(tab: string) {
    console.log('CategoryTabs: Setting active tab to:', tab);
    console.log('CategoryTabs: onTabChange exists:', !!onTabChange);
    onTabChange?.(tab);
  }

  function getTabClass(tab: string) {
    return `py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
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
</script>

<!-- Page Header -->
<div class="mb-6">
  <h1 class="text-2xl font-bold text-gray-900">Master Category</h1>
  <p class="text-gray-600 mt-1">Manage and browse categories</p>
</div>

<!-- Tab Navigation and Search -->
<div class="flex items-center justify-between">
  <nav class="flex space-x-8">
    <button
      onclick={() => setActiveTab("input")}
      class={getTabClass("input")}
    >
      <div class="flex items-center space-x-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
        </svg>
        <span>Input</span>
      </div>
    </button>
    
    <button
      onclick={() => setActiveTab("browse")}
      class={getTabClass("browse")}
    >
      <div class="flex items-center space-x-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
        </svg>
        <span>Browse</span>
      </div>
    </button>
  </nav>

  <!-- Search Bar (only show when browse tab is active) -->
  {#if activeTab === "browse"}
    <div class="flex items-center space-x-3">
      <!-- Search Bar -->
      <div class="relative">
        <input
          type="text"
          placeholder="Search categories..."
          class="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={searchTerm}
          oninput={handleSearchInput}
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
  {/if}
</div>