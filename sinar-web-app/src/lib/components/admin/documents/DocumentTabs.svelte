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
    console.log('DocumentTabs: Setting active tab to:', tab);
    console.log('DocumentTabs: onTabChange exists:', !!onTabChange);
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
  <h1 class="text-2xl font-bold text-gray-900">Master Document</h1>
  <p class="text-gray-600 mt-1">Manage and browse documents</p>
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
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v10a2 2 0 002 2z"/>
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
          placeholder="Search documents..."
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
      <button
        onclick={handleRefresh}
        disabled={isLoading}
        class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
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
      </button>
    </div>
  {/if}
</div>