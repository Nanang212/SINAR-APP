<script lang="ts">
  import { fly } from "svelte/transition";
  import type { Toast } from "$lib/stores/toast";

  export let toast: Toast;
  export let onClose: (id: string) => void;

  const typeConfig = {
    success: {
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      textColor: "text-green-800",
      iconColor: "text-green-400",
      icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    },
    error: {
      bgColor: "bg-red-50",
      borderColor: "border-red-200", 
      textColor: "text-red-800",
      iconColor: "text-red-400",
      icon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
    },
    warning: {
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      textColor: "text-yellow-800", 
      iconColor: "text-yellow-400",
      icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
    },
    info: {
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-800",
      iconColor: "text-blue-400", 
      icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    }
  };

  $: config = typeConfig[toast.type];

  function handleClose() {
    onClose(toast.id);
  }
</script>

<div
  transition:fly={{ x: 300, duration: 300 }}
  class="mb-3 max-w-sm w-full rounded-lg border p-4 shadow-lg backdrop-blur-sm {config.bgColor} {config.borderColor}"
>
  <div class="flex items-start">
    <div class="flex-shrink-0">
      <svg
        class="h-5 w-5 {config.iconColor}"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d={config.icon}
        />
      </svg>
    </div>
    <div class="ml-3 flex-1">
      <p class="text-sm font-medium {config.textColor}">
        {toast.message}
      </p>
    </div>
    <div class="ml-4 flex-shrink-0">
      <button
        onclick={handleClose}
        class="inline-flex rounded-md p-1.5 {config.textColor} hover:bg-opacity-20 hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
        aria-label="Close notification"
      >
        <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path
            fill-rule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clip-rule="evenodd"
          />
        </svg>
      </button>
    </div>
  </div>
</div>