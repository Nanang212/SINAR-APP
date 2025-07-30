<script lang="ts">
  interface $$Props {
    searchTerm?: string;
    selectedCategory?: string;
    onSearchChange?: (term: string) => void;
    onCategoryChange?: (category: string) => void;
  }

  let { 
    searchTerm = "", 
    onSearchChange, 
  }: $$Props = $props();

  function handleSearchInput(event: Event) {
    const target = event.target as HTMLInputElement;
    onSearchChange?.(target.value);
  }
</script>

<div class="flex items-center space-x-4">
  <div class="relative">
    <input
      type="text"
      value={searchTerm}
      placeholder="Search documents..."
      class="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      oninput={handleSearchInput}
    />
    <svg class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
    </svg>
  </div>
</div>