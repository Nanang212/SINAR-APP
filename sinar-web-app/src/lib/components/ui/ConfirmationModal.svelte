<script lang="ts">
  import { fly } from "svelte/transition";

  export let isOpen = false;
  export let title = "Confirmation";
  export let message = "Are you sure you want to proceed?";
  export let confirmText = "Confirm";
  export let cancelText = "Cancel";
  export let confirmButtonClass = "bg-blue-600 hover:bg-blue-700 text-white";
  export let cancelButtonClass = "bg-gray-100 hover:bg-gray-200 text-gray-700";
  export let onConfirm: () => void = () => {};
  export let onCancel: () => void = () => {};
  export let isLoading = false;

  function handleConfirm() {
    if (isLoading) return;
    onConfirm();
  }

  function handleCancel() {
    if (isLoading) return;
    onCancel();
  }

  function handleOverlayClick(event: MouseEvent) {
    if (event.target === event.currentTarget && !isLoading) {
      handleCancel();
    }
  }
</script>

{#if isOpen}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
    onclick={handleOverlayClick}
    transition:fly={{ y: -50, duration: 300 }}
  >
    <div class="bg-white shadow-2xl max-w-md w-full mx-4 border border-gray-200">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">{title}</h3>
          {#if !isLoading}
            <button
              onclick={handleCancel}
              class="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          {/if}
        </div>
      </div>

      <!-- Content -->
      <div class="px-6 py-6">
        <!-- Icon -->
        <div class="flex justify-center mb-4">
          <div class="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center">
            <svg class="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
        </div>

        <!-- Message -->
        <div class="text-center">
          <p class="text-gray-600 text-base leading-relaxed">
            {message}
          </p>
        </div>
      </div>

      <!-- Actions -->
      <div class="px-6 py-4 bg-gray-50 flex flex-col sm:flex-row gap-3 sm:gap-0 sm:justify-end sm:space-x-3">
        <button
          onclick={handleCancel}
          disabled={isLoading}
          class="w-full sm:w-auto px-4 py-2 text-sm font-medium {cancelButtonClass} border border-gray-300 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed order-2 sm:order-1"
        >
          {cancelText}
        </button>
        <button
          onclick={handleConfirm}
          disabled={isLoading}
          class="w-full sm:w-auto px-4 py-2 text-sm font-medium {confirmButtonClass} transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
        >
          {#if isLoading}
            <div class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </div>
          {:else}
            {confirmText}
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}