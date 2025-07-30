<script lang="ts">
  import { fly } from "svelte/transition";
  import { onMount } from "svelte";
  import type { Toast } from "$lib/stores/toast";

  export let toast: Toast;
  export let onClose: (id: string) => void;

  let showAnimation = false;

  const typeConfig = {
    success: {
      textColor: "text-green-600",
      iconColor: "text-green-500",
      buttonTextColor: "text-green-600 hover:text-green-700",
      title: "Success!"
    },
    error: {
      textColor: "text-red-600",
      iconColor: "text-red-500",
      buttonTextColor: "text-red-600 hover:text-red-700",
      title: "Error!"
    },
    warning: {
      textColor: "text-yellow-600",
      iconColor: "text-yellow-500",
      buttonTextColor: "text-yellow-600 hover:text-yellow-700",
      title: "Warning!"
    },
    info: {
      textColor: "text-blue-600",
      iconColor: "text-blue-500",
      buttonTextColor: "text-blue-600 hover:text-blue-700",
      title: "Information"
    }
  };

  $: config = typeConfig[toast.type];

  onMount(() => {
    // Trigger animation after component mounts
    setTimeout(() => {
      showAnimation = true;
    }, 100);
  });

  function handleClose() {
    onClose(toast.id);
  }
</script>

<style>
  /* Success checkmark animation */
  .checkmark {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    display: block;
    stroke-width: 2;
    stroke: #10b981;
    stroke-miterlimit: 10;
    margin: 10% auto;
    box-shadow: inset 0px 0px 0px #10b981;
    animation: fill 0.4s ease-in-out 0.7s forwards, scale 0.3s ease-in-out 1.2s both;
  }

  .checkmark__circle {
    stroke-dasharray: 166;
    stroke-dashoffset: 166; 
    stroke-width: 2;
    stroke-miterlimit: 10;
    stroke: #10b981;
    fill: none;
    animation: stroke-circle 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
  }

  .checkmark__check {
    transform-origin: 50% 50%;
    stroke-dasharray: 50;
    stroke-dashoffset: 50;
    stroke-width: 3;
    stroke: #fff;
    stroke-linecap: round;
    stroke-linejoin: round;
    animation: stroke-check 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.9s forwards;
  }

  /* Error X animation */
  .errormark {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    display: block;
    stroke-width: 2;
    stroke: #ef4444;
    stroke-miterlimit: 10;
    margin: 10% auto;
    box-shadow: inset 0px 0px 0px #ef4444;
    animation: fill-error 0.4s ease-in-out 0.7s forwards, scale 0.3s ease-in-out 1.2s both;
  }

  .errormark__circle {
    stroke-dasharray: 166;
    stroke-dashoffset: 166;
    stroke-width: 2;
    stroke-miterlimit: 10;
    stroke: #ef4444;
    fill: none;
    animation: stroke-circle 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
  }

  .errormark__x {
    stroke-dasharray: 28;
    stroke-dashoffset: 28;
    stroke-width: 3;
    stroke: #fff;
    animation: stroke-x 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.9s forwards;
  }

  /* Warning animation */
  .warningmark {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    display: block;
    stroke-width: 2;
    stroke: #f59e0b;
    stroke-miterlimit: 10;
    margin: 10% auto;
    box-shadow: inset 0px 0px 0px #f59e0b;
    animation: fill-warning 0.4s ease-in-out 0.7s forwards, scale 0.3s ease-in-out 1.2s both;
  }

  .warningmark__circle {
    stroke-dasharray: 166;
    stroke-dashoffset: 166;
    stroke-width: 2;
    stroke-miterlimit: 10;
    stroke: #f59e0b;
    fill: none;
    animation: stroke-circle 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
  }

  .warningmark__exclamation {
    stroke-dasharray: 20;
    stroke-dashoffset: 20;
    stroke-width: 3;
    stroke: #fff;
    animation: stroke-exclamation 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.9s forwards;
  }

  /* Keyframes */
  @keyframes stroke-circle {
    100% {
      stroke-dashoffset: 0;
    }
  }

  @keyframes stroke-check {
    100% {
      stroke-dashoffset: 0;
    }
  }

  @keyframes stroke-x {
    100% {
      stroke-dashoffset: 0;
    }
  }

  @keyframes stroke-exclamation {
    100% {
      stroke-dashoffset: 0;
    }
  }

  @keyframes scale {
    0%, 100% {
      transform: none;
    }
    50% {
      transform: scale3d(1.1, 1.1, 1);
    }
  }

  @keyframes fill {
    100% {
      box-shadow: inset 0px 0px 0px 30px #10b981;
    }
  }

  @keyframes fill-error {
    100% {
      box-shadow: inset 0px 0px 0px 30px #ef4444;
    }
  }

  @keyframes fill-warning {
    100% {
      box-shadow: inset 0px 0px 0px 30px #f59e0b;
    }
  }
</style>

<!-- Modal Overlay -->
<div 
  class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
  transition:fly={{ y: -50, duration: 300 }}
>
  <!-- Modal Content - Square corners -->
  <div class="bg-white shadow-2xl max-w-md w-full mx-4 border border-gray-200">
    <!-- Content -->
    <div class="p-8 text-center">
      <!-- Animated Icon -->
      <div class="flex justify-center mb-6">
        {#if toast.type === 'success' && showAnimation}
          <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
            <path class="checkmark__check" fill="none" d="M16 26l5 5 12-12"/>
          </svg>
        {:else if toast.type === 'error' && showAnimation}
          <svg class="errormark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle class="errormark__circle" cx="26" cy="26" r="25" fill="none"/>
            <path class="errormark__x" fill="none" d="M16,16 L36,36"/>
            <path class="errormark__x" fill="none" d="M36,16 L16,36"/>
          </svg>
        {:else if toast.type === 'warning' && showAnimation}
          <svg class="warningmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle class="warningmark__circle" cx="26" cy="26" r="25" fill="none"/>
            <path class="warningmark__exclamation" fill="none" d="M26,14 L26,32"/>
            <path class="warningmark__exclamation" fill="none" d="M26,38 L26,40"/>
          </svg>
        {:else}
          <!-- Fallback static icon -->
          <div class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
            <svg class="h-8 w-8 {config.iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {#if toast.type === 'success'}
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              {:else if toast.type === 'error'}
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              {:else if toast.type === 'warning'}
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
              {:else}
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              {/if}
            </svg>
          </div>
        {/if}
      </div>
      
      <!-- Title -->
      <h3 class="text-xl font-semibold {config.textColor} mb-4">
        {config.title}
      </h3>
      
      <!-- Message -->
      <p class="text-gray-600 text-base leading-relaxed mb-8">
        {toast.message}
      </p>
      
      <!-- Action Button -->
      <button
        onclick={handleClose}
        class="w-full px-6 py-3 text-base font-medium {config.buttonTextColor} bg-white border border-gray-300 hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
      >
        OK
      </button>
    </div>
  </div>
</div>