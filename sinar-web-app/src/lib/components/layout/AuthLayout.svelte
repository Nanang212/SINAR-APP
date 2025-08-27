<script lang="ts">
  import type { Snippet } from "svelte";
  import { onMount } from "svelte";

  interface $$Props {
    children?: Snippet;
  }

  let { children }: $$Props = $props();
  let mouseX = $state(0);
  let mouseY = $state(0);
  let leftSide: HTMLElement;

  onMount(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (leftSide) {
        const rect = leftSide.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
      }
    };

    if (leftSide) {
      leftSide.addEventListener("mousemove", handleMouseMove);
    }

    // Always return cleanup function
    return () => {
      if (leftSide) {
        leftSide.removeEventListener("mousemove", handleMouseMove);
      }
    };
  });
</script>

<div class="min-h-screen flex">
  <!-- Light Background with Subtle Patterns -->
  <div
    bind:this={leftSide}
    class="w-full flex items-center justify-center p-8 relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100"
  >
    <!-- Light overlay with gentle glow effect -->
    <div 
      class="absolute inset-0 pointer-events-none transition-all duration-75 ease-linear"
      style="
        background: radial-gradient(
          circle 500px at {mouseX}px {mouseY}px,
          rgba(147, 197, 253, 0.1) 0%,
          rgba(196, 231, 255, 0.05) 30%, 
          transparent 60%
        );
      "
    ></div>

    <!-- Mouse Following Light Gradients - Softer Colors -->
    <!-- Main gradient -->
    <div
      class="absolute pointer-events-none transition-all duration-75 ease-linear"
      style="
        left: {mouseX - 200}px; 
        top: {mouseY - 200}px;
        width: 400px; 
        height: 400px;
        background: radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, rgba(99, 102, 241, 0.04) 40%, transparent 70%);
        border-radius: 50%;
        filter: blur(60px);
      "
    ></div>

    <!-- Secondary gradient -->
    <div
      class="absolute pointer-events-none transition-all duration-100 ease-linear"
      style="
        left: {mouseX - 100}px; 
        top: {mouseY - 100}px;
        width: 200px; 
        height: 200px;
        background: radial-gradient(circle, rgba(147, 197, 253, 0.12) 0%, rgba(129, 140, 248, 0.06) 50%, transparent 70%);
        border-radius: 50%;
        filter: blur(30px);
      "
    ></div>

    <!-- Animated Background Shapes - Light Colors -->
    <div class="absolute inset-0 pointer-events-none">
      <!-- Sun icon at top -->
      <div class="absolute top-16 left-16">
        <div class="relative">
          <div class="w-16 h-16 bg-gradient-to-br from-yellow-300 to-orange-300 rounded-full opacity-60 float-1"></div>
          <div class="absolute inset-2 bg-gradient-to-br from-yellow-200 to-orange-200 rounded-full opacity-80"></div>
          <!-- Sun rays -->
          <div class="absolute -inset-4">
            <div class="w-1 h-4 bg-yellow-300 opacity-40 absolute top-0 left-1/2 transform -translate-x-1/2"></div>
            <div class="w-1 h-4 bg-yellow-300 opacity-40 absolute bottom-0 left-1/2 transform -translate-x-1/2"></div>
            <div class="w-4 h-1 bg-yellow-300 opacity-40 absolute top-1/2 left-0 transform -translate-y-1/2"></div>
            <div class="w-4 h-1 bg-yellow-300 opacity-40 absolute top-1/2 right-0 transform -translate-y-1/2"></div>
          </div>
        </div>
      </div>

      <!-- Soft floating shapes -->
      <div class="absolute top-32 right-20 w-12 h-12 bg-blue-200 opacity-30 rounded-full float-1"></div>
      <div class="absolute top-1/2 left-12 w-8 h-8 bg-indigo-200 opacity-40 rounded-full float-2"></div>
      <div class="absolute bottom-32 right-16 w-16 h-16 bg-sky-200 opacity-25 rounded-lg transform rotate-12 float-3"></div>
      <div class="absolute bottom-20 left-20 w-6 h-6 bg-cyan-200 opacity-50 rounded-full float-4"></div>
      
      <!-- Subtle geometric patterns -->
      <div class="absolute top-1/3 right-8 w-20 h-20 border-2 border-blue-200 opacity-20 rounded-full float-2"></div>
      <div class="absolute bottom-1/3 left-8 w-14 h-14 border-2 border-indigo-200 opacity-25 rounded-lg transform rotate-45 float-5"></div>
    </div>

    <!-- Form Content -->
    <div class="relative z-10">
      {@render children?.()}
    </div>
  </div>

  <!-- Right Side - Logo Background (Commented Out) -->
  <!-- 
  <div
    class="hidden lg:flex lg:w-1/2 items-center justify-center"
    style="background-color: #F2E9DD;"
  >
    <div class="text-center">
      <img
        src="/assets/logo.png"
        alt="SINAR Logo"
        class="w-72 h-72 mx-auto mb-6"
      />
    </div>
  </div>
  -->
</div>

<style>
  @keyframes float {
    0%,
    100% {
      transform: translateY(0px) rotate(0deg);
    }
    33% {
      transform: translateY(-20px) rotate(120deg);
    }
    66% {
      transform: translateY(-10px) rotate(240deg);
    }
  }

  @keyframes floatReverse {
    0%,
    100% {
      transform: translateY(0px) rotate(0deg);
    }
    33% {
      transform: translateY(15px) rotate(-90deg);
    }
    66% {
      transform: translateY(-25px) rotate(-180deg);
    }
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 0.4;
      transform: scale(1);
    }
    50% {
      opacity: 0.8;
      transform: scale(1.1);
    }
  }

  .float-1 {
    animation: float 6s ease-in-out infinite;
  }
  .float-2 {
    animation: floatReverse 8s ease-in-out infinite;
  }
  .float-3 {
    animation: float 10s ease-in-out infinite;
  }
  .float-4 {
    animation: pulse 4s ease-in-out infinite;
  }
  .float-5 {
    animation: floatReverse 7s ease-in-out infinite;
  }
</style>
