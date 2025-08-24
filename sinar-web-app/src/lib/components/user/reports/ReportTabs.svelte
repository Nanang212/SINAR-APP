<script lang="ts">
  interface $$Props {
    activeTab?: string;
    onTabChange?: (tab: string) => void;
    onSearch?: (term: string) => void;
    onSortChange?: (order: "asc" | "desc") => void;
    onRefresh?: () => void;
    /** ✅ props baru untuk filter tanggal */
    onDateRangeChange?: (payload: {
      startDate: string | null;
      endDate: string | null;
    }) => void;
    startDate?: string | null; // "YYYY-MM-DD"
    endDate?: string | null; // "YYYY-MM-DD"

    searchTerm?: string;
    sortOrder?: "asc" | "desc";
    isLoading?: boolean;
  }

  let {
    activeTab = "browse",
    onTabChange,
    onSearch,
    onSortChange,
    onRefresh,
    /** ✅ ambil props baru + default */
    onDateRangeChange,
    startDate = null,
    endDate = null,

    searchTerm = "",
    sortOrder = "desc",
    isLoading = false,
  }: $$Props = $props();

  /** ✅ state lokal untuk input tanggal (supaya ngetik tidak langsung fetch sampai klik Apply) */
  let startLocal: string = startDate ?? "";
  let endLocal: string = endDate ?? "";

  $effect(() => {
    startLocal = startDate ?? "";
    endLocal = endDate ?? "";
  });

  function setActiveTab(tab: string) {
    onTabChange?.(tab);
  }

  function getTabClass(tab: string) {
    return `py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
      activeTab === tab
        ? "border-blue-500 text-blue-600"
        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
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
    const newOrder = sortOrder === "desc" ? "asc" : "desc";
    onSortChange?.(newOrder);
  }

  /** ✅ aksi date range */
  function applyDateRange() {
    onDateRangeChange?.({
      startDate: startLocal && startLocal.length ? startLocal : null,
      endDate: endLocal && endLocal.length ? endLocal : null,
    });
  }
  function clearDateRange() {
    startLocal = "";
    endLocal = "";
    onDateRangeChange?.({ startDate: null, endDate: null });
  }
</script>

<!-- Page Header -->
<div class="mb-4 sm:mb-6">
  <h1 class="text-xl sm:text-2xl font-bold text-gray-900">Reports</h1>
  <p class="text-gray-600 mt-1 text-sm sm:text-base">
    Create and manage reports
  </p>
</div>

<!-- Tab Navigation and Search -->
<div
  class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2 md:gap-3"
>
  <nav class="flex space-x-4 sm:space-x-8">
    <button
      onclick={() => setActiveTab("browse")}
      class={getTabClass("browse")}
    >
      <div class="flex items-center space-x-1 sm:space-x-2">
        <svg
          class="w-4 h-4 sm:w-5 sm:h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v10a2 2 0 002 2z"
          />
        </svg>
        <span class="text-sm sm:text-base">Browse</span>
      </div>
    </button>

    <button onclick={() => setActiveTab("input")} class={getTabClass("input")}>
      <div class="flex items-center space-x-1 sm:space-x-2">
        <svg
          class="w-4 h-4 sm:w-5 sm:h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
        <span class="text-sm sm:text-base">Input</span>
      </div>
    </button>
  </nav>

  <!-- Search + Filters (only when browse) -->
  {#if activeTab === "browse"}
    <div
      class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2 md:gap-3 w-full sm:w-auto sm:ml-auto"
    >
      <!-- ✅ MOBILE: Date range + Sort + Search + Refresh stacked -->
      <div class="flex sm:hidden items-center gap-2 w-full mt-2">
        <!-- Date range (mobile) -->
        <div class="flex items-center gap-2 flex-1">
          <input
            type="date"
            bind:value={startLocal}
            class="w-1/2 px-2 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Start date"
          />
          <input
            type="date"
            bind:value={endLocal}
            class="w-1/2 px-2 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="End date"
          />
          <button
            onclick={applyDateRange}
            class="px-2.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md"
            >Apply</button
          >
          <button
            onclick={clearDateRange}
            class="px-2.5 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            title="Clear date filter">Clear</button
          >
        </div>
      </div>

      <!-- ✅ DESKTOP: Date range group (di kiri tombol Sort) -->
      <div class="hidden sm:flex items-center gap-2">
        <div class="flex items-center gap-2">
          <label class="text-xs text-gray-600">From</label>
          <input
            type="date"
            bind:value={startLocal}
            class="px-2 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <label class="text-xs text-gray-600">to</label>
          <input
            type="date"
            bind:value={endLocal}
            class="px-2 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onclick={applyDateRange}
          class="px-3 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-sm"
          >Apply</button
        >
        <button
          onclick={clearDateRange}
          class="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md"
          >Clear</button
        >
      </div>

      <!-- Desktop: Sort Toggle Button -->
      <div class="hidden sm:block relative group">
        <button
          onclick={handleSortToggle}
          class="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gradient-to-r from-slate-50 to-gray-100 hover:from-slate-100 hover:to-gray-200 border border-gray-300 hover:border-gray-400 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 min-w-[100px]"
          title={sortOrder === "desc"
            ? "Currently showing newest first"
            : "Currently showing oldest first"}
        >
          <div class="relative">
            <svg
              class="w-4 h-4 text-blue-600 transition-transform duration-300 {sortOrder ===
              'desc'
                ? 'rotate-0'
                : 'rotate-180'}"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
              />
            </svg>
          </div>
          <span class="text-gray-700 font-semibold tracking-wide">
            {sortOrder === "desc" ? "Newest" : "Oldest"}
          </span>
          <svg
            class="w-3 h-3 text-gray-500 transition-transform duration-200 {sortOrder ===
            'desc'
              ? 'rotate-0'
              : 'rotate-180'}"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 14l-7-7-7 7"
            />
          </svg>
        </button>
        <div
          class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs font-medium text-white bg-gray-900 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg"
        >
          Click to sort by {sortOrder === "desc" ? "oldest" : "newest"} first
          <div
            class="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"
          ></div>
        </div>
      </div>

      <!-- Desktop Search Bar -->
      <div class="hidden sm:block relative flex-1 sm:flex-none">
        <input
          type="text"
          placeholder="Search reports..."
          class="w-full sm:w-48 md:w-56 lg:w-64 xl:w-80 2xl:w-96 pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={searchTerm}
          oninput={handleSearchInput}
        />
        <div
          class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
        >
          <svg
            class="h-4 w-4 sm:h-5 sm:w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      <!-- Mobile: Search + Sort + Refresh Row -->
      <div class="flex sm:hidden items-center gap-2 w-full">
        <!-- Mobile Sort -->
        <div class="relative group flex-shrink-0">
          <button
            onclick={handleSortToggle}
            class="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-gradient-to-r from-slate-50 to-gray-100 hover:from-slate-100 hover:to-gray-200 border border-gray-300 hover:border-gray-400 rounded-md shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            title={sortOrder === "desc"
              ? "Currently showing newest first"
              : "Currently showing oldest first"}
          >
            <svg
              class="w-3.5 h-3.5 text-blue-600 transition-transform duration-300 {sortOrder ===
              'desc'
                ? 'rotate-0'
                : 'rotate-180'}"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
              />
            </svg>
            <span class="text-gray-700 font-semibold text-xs"
              >{sortOrder === "desc" ? "New" : "Old"}</span
            >
          </button>
        </div>

        <!-- Mobile Search -->
        <div class="relative flex-1">
          <input
            type="text"
            placeholder="Search..."
            class="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            oninput={handleSearchInput}
          />
          <div
            class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none"
          >
            <svg
              class="h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        <!-- Mobile Refresh -->
        <div class="relative group flex-shrink-0">
          <button
            onclick={handleRefresh}
            disabled={isLoading}
            class="px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-600 hover:to-sky-700 focus:from-cyan-600 focus:to-sky-700 border border-cyan-500 rounded-md shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500 disabled:border-gray-400 transition-all duration-200 flex items-center gap-1.5"
            aria-label="Refresh reports"
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
            <span class="text-xs">Refresh</span>
          </button>
        </div>
      </div>

      <!-- Desktop Refresh Button -->
      <div class="hidden sm:block relative group">
        <button
          onclick={handleRefresh}
          disabled={isLoading}
          class="px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-600 hover:to-sky-700 focus:from-cyan-600 focus:to-sky-700 border border-cyan-500 rounded-md shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500 disabled:border-gray-400 transition-all duration-200"
          aria-label="Refresh reports"
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
        <div
          class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-gray-900 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg"
        >
          {isLoading ? "Refreshing..." : "Refresh reports"}
          <div
            class="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"
          ></div>
        </div>
      </div>
    </div>
  {/if}
</div>
