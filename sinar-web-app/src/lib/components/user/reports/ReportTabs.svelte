<script lang="ts">
  import { onMount } from 'svelte';
  
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
  let startLocal = $state(startDate ?? "");
  let endLocal = $state(endDate ?? "");

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

  /** ✅ format date untuk display DD/MM/YY */
  function formatDateDisplay(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${day}/${month}/${year}`;
  }

  /** ✅ Date range picker state */
  let showDateRangePicker = $state(false);
  let currentMonth = $state(new Date());
  let selectedStartDate = $state<Date | null>(startLocal ? new Date(startLocal) : null);
  let selectedEndDate = $state<Date | null>(endLocal ? new Date(endLocal) : null);
  let isSelectingRange = $state(false);

  /** ✅ Handle date range display */
  function getDateRangeDisplay(): string {
    if (startLocal && endLocal) {
      return `${formatDateDisplay(startLocal)} - ${formatDateDisplay(endLocal)}`;
    }
    return '';
  }

  /** ✅ Open date range picker */
  function openDateRangePicker() {
    selectedStartDate = startLocal ? new Date(startLocal) : null;
    selectedEndDate = endLocal ? new Date(endLocal) : null;
    isSelectingRange = false;
    showDateRangePicker = true;
  }

  /** ✅ Generate calendar days */
  function generateCalendarDays(month: Date) {
    const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const startOfWeek = new Date(startOfMonth);
    startOfWeek.setDate(startOfMonth.getDate() - startOfMonth.getDay());
    
    const days = [];
    const currentDate = new Date(startOfWeek);
    
    // Generate 42 days (6 weeks * 7 days)
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  }

  /** ✅ Handle date click */
  function handleDateClick(date: Date) {
    if (!isSelectingRange) {
      // First click - start date
      selectedStartDate = new Date(date);
      selectedEndDate = null;
      isSelectingRange = true;
    } else {
      // Second click - end date
      if (date < selectedStartDate!) {
        // If clicked date is before start, make it the new start
        selectedEndDate = selectedStartDate;
        selectedStartDate = new Date(date);
      } else {
        selectedEndDate = new Date(date);
      }
      isSelectingRange = false;
    }
  }

  /** ✅ Apply date range */
  function applyDateRange() {
    if (selectedStartDate && selectedEndDate) {
      startLocal = selectedStartDate.toISOString().split('T')[0];
      endLocal = selectedEndDate.toISOString().split('T')[0];
      
      onDateRangeChange?.({
        startDate: startLocal,
        endDate: endLocal,
      });
    }
    showDateRangePicker = false;
  }

  /** ✅ Clear date range */
  function clearDateRange() {
    startLocal = "";
    endLocal = "";
    selectedStartDate = null;
    selectedEndDate = null;
    isSelectingRange = false;
    onDateRangeChange?.({ startDate: null, endDate: null });
    showDateRangePicker = false;
  }

  /** ✅ Quick date range presets */
  function setQuickDateRange(days: number) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    
    selectedStartDate = startDate;
    selectedEndDate = endDate;
    isSelectingRange = false;
  }

  /** ✅ Check if date is in range */
  function isDateInRange(date: Date): boolean {
    if (!selectedStartDate || !selectedEndDate) return false;
    return date >= selectedStartDate && date <= selectedEndDate;
  }

  /** ✅ Check if date is start or end */
  function isStartDate(date: Date): boolean {
    return selectedStartDate ? date.toDateString() === selectedStartDate.toDateString() : false;
  }

  function isEndDate(date: Date): boolean {
    return selectedEndDate ? date.toDateString() === selectedEndDate.toDateString() : false;
  }

  /** ✅ Navigate months */
  function previousMonth() {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1);
  }

  function nextMonth() {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1);
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
        <div class="relative flex-1">
          <input
            type="text"
            readonly
            value={getDateRangeDisplay()}
            placeholder="Filter by date"
            onclick={openDateRangePicker}
            class="w-full px-3 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
          />
          <svg class="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </div>
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

      <!-- ✅ DESKTOP: Date range group (di kanan tombol Sort) -->
      <div class="hidden sm:flex items-center gap-2">
        <div class="relative">
          <input
            type="text"
            readonly
            value={getDateRangeDisplay()}
            placeholder="Filter by date"
            onclick={openDateRangePicker}
            class="w-48 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
          />
          <svg class="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
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

<!-- Custom Date Range Picker Modal -->
{#if showDateRangePicker}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
    <div class="bg-white rounded-xl shadow-2xl max-w-sm w-full" onclick={(e) => e.stopPropagation()}>
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-gray-100">
        <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          Filter by date
        </h3>
        <button onclick={() => showDateRangePicker = false} class="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Close">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- Quick Presets -->
      <div class="p-4 border-b border-gray-100">
        <p class="text-sm text-gray-600 mb-3">Quick presets:</p>
        <div class="flex flex-wrap gap-2">
          <button 
            onclick={() => setQuickDateRange(7)}
            class="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors"
          >
            Last 7 days
          </button>
          <button 
            onclick={() => setQuickDateRange(30)}
            class="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 rounded-full hover:bg-green-100 transition-colors"
          >
            Last 30 days
          </button>
          <button 
            onclick={() => setQuickDateRange(90)}
            class="px-3 py-1.5 text-xs font-medium bg-purple-50 text-purple-700 rounded-full hover:bg-purple-100 transition-colors"
          >
            Last 3 months
          </button>
        </div>
      </div>

      <!-- Calendar -->
      <div class="p-4">
        <!-- Month Navigation -->
        <div class="flex items-center justify-between mb-4">
          <button onclick={previousMonth} class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>
          <h4 class="text-sm font-medium text-gray-900">
            {currentMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
          </h4>
          <button onclick={nextMonth} class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </button>
        </div>

        <!-- Day Headers -->
        <div class="grid grid-cols-7 gap-1 mb-2">
          {#each ['M', 'S', 'S', 'R', 'K', 'J', 'S'] as dayName}
            <div class="text-center text-xs font-medium text-gray-500 p-2">
              {dayName}
            </div>
          {/each}
        </div>

        <!-- Calendar Days -->
        <div class="grid grid-cols-7 gap-1">
          {#each generateCalendarDays(currentMonth) as date}
            {@const isCurrentMonth = date.getMonth() === currentMonth.getMonth()}
            {@const isToday = date.toDateString() === new Date().toDateString()}
            {@const isStart = isStartDate(date)}
            {@const isEnd = isEndDate(date)}
            {@const inRange = isDateInRange(date)}
            
            <button
              onclick={() => handleDateClick(date)}
              disabled={!isCurrentMonth}
              class="relative p-2 text-xs transition-all rounded-lg
                {isCurrentMonth ? 'text-gray-900 hover:bg-blue-50' : 'text-gray-300 cursor-not-allowed'}
                {isToday && isCurrentMonth ? 'font-bold' : ''}
                {isStart ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
                {isEnd ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
                {inRange && !isStart && !isEnd ? 'bg-blue-100 text-blue-900' : ''}
              "
            >
              {date.getDate()}
              {#if isStart || isEnd}
                <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full"></div>
              {/if}
            </button>
          {/each}
        </div>

        {#if selectedStartDate && selectedEndDate}
          <div class="mt-4 p-3 bg-blue-50 rounded-lg">
            <p class="text-sm text-blue-800 text-center">
              <span class="font-medium">Selected:</span> 
              {formatDateDisplay(selectedStartDate.toISOString().split('T')[0])} - {formatDateDisplay(selectedEndDate.toISOString().split('T')[0])}
            </p>
          </div>
        {:else if selectedStartDate && isSelectingRange}
          <div class="mt-4 p-3 bg-yellow-50 rounded-lg">
            <p class="text-sm text-yellow-800 text-center">
              <span class="font-medium">From:</span> {formatDateDisplay(selectedStartDate.toISOString().split('T')[0])}
              <br><span class="text-xs">Click end date</span>
            </p>
          </div>
        {/if}
      </div>

      <!-- Actions -->
      <div class="flex gap-3 p-4 pt-0">
        {#if startLocal || endLocal || selectedStartDate || selectedEndDate}
          <button
            onclick={clearDateRange}
            class="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors"
          >
            Clear
          </button>
        {/if}
        <button
          onclick={() => showDateRangePicker = false}
          class="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onclick={applyDateRange}
          disabled={!selectedStartDate || !selectedEndDate}
          class="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          Apply
        </button>
      </div>
    </div>
  </div>
{/if}

