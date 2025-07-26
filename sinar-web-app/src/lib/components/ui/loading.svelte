<script lang="ts">
  export let size: 'sm' | 'md' | 'lg' | 'xl' = 'lg';
  export let text: string = '';
  export let overlay: boolean = false;

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };
</script>

{#if overlay}
  <div class="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
    <div class="flex flex-col items-center space-y-4">
      <div class="animate-spin rounded-full {sizeClasses[size]} border-4 border-blue-200 border-t-blue-600"></div>
      {#if text}
        <p class="text-white text-lg font-medium drop-shadow-lg">{text}</p>
      {/if}
    </div>
  </div>
{:else}
  <div class="flex items-center space-x-3">
    <div class="animate-spin rounded-full {sizeClasses[size]} border-4 border-blue-200 border-t-blue-600"></div>
    {#if text}
      <span class="text-blue-600 text-sm font-medium">{text}</span>
    {/if}
  </div>
{/if}