<script lang="ts">
  interface $$Props {
    startDate?: string | null;
    endDate?: string | null;
    onDateRangeChange?: (payload: { startDate: string | null; endDate: string | null }) => void;
    placeholder?: string;
    className?: string;
  }

  let {
    startDate = null,
    endDate = null,
    onDateRangeChange,
    placeholder = "Filter by date",
    className = ""
  }: $$Props = $props();

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
  let selectedStartDate = $state<Date | null>(startDate ? new Date(startDate) : null);
  let selectedEndDate = $state<Date | null>(endDate ? new Date(endDate) : null);
  let isSelectingRange = $state(false);

  /** ✅ Handle date range display */
  function getDateRangeDisplay(): string {
    if (startDate && endDate) {
      return `${formatDateDisplay(startDate)} - ${formatDateDisplay(endDate)}`;
    }
    return '';
  }

  /** ✅ Open date range picker */
  function openDateRangePicker() {
    selectedStartDate = startDate ? new Date(startDate) : null;
    selectedEndDate = endDate ? new Date(endDate) : null;
    isSelectingRange = false;
    showDateRangePicker = true;
  }

  /** ✅ Generate calendar days */
  function generateCalendarDays(month: Date) {
    const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
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
      const newStartDate = selectedStartDate.toISOString().split('T')[0];
      const newEndDate = selectedEndDate.toISOString().split('T')[0];
      
      onDateRangeChange?.({
        startDate: newStartDate,
        endDate: newEndDate,
      });
    }
    showDateRangePicker = false;
  }

  /** ✅ Clear date range */
  function clearDateRange() {
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

<!-- Date Range Input -->
<div class="relative {className}">
  <input
    type="text"
    readonly
    value={getDateRangeDisplay()}
    placeholder={placeholder}
    onclick={openDateRangePicker}
    class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer min-w-0"
  />
  <svg class="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
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
        {#if startDate || endDate || selectedStartDate || selectedEndDate}
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