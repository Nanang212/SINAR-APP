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
  <!-- Left Side - Form -->
  <div
    bind:this={leftSide}
    class="w-full lg:w-1/2 flex items-center justify-center p-8 relative overflow-hidden"
    style="background-color: #1C3752;"
  >
    <!-- Dark overlay with hole effect -->
    <div 
      class="absolute inset-0 pointer-events-none transition-all duration-75 ease-linear"
      style="
        background: radial-gradient(
          circle 400px at {mouseX}px {mouseY}px,
          transparent 0%,
          transparent 30%, 
          rgba(0, 0, 0, 0.3) 70%,
          rgba(0, 0, 0, 0.5) 100%
        );
      "
    ></div>

    <!-- Mouse Following Light Gradients -->
    <!-- Main gradient -->
    <div
      class="absolute pointer-events-none transition-all duration-75 ease-linear"
      style="
        left: {mouseX - 150}px; 
        top: {mouseY - 150}px;
        width: 300px; 
        height: 300px;
        background: radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, rgba(99, 102, 241, 0.2) 30%, transparent 70%);
        border-radius: 50%;
        filter: blur(40px);
      "
    ></div>

    <!-- Secondary smaller gradient -->
    <div
      class="absolute pointer-events-none transition-all duration-100 ease-linear"
      style="
        left: {mouseX - 75}px; 
        top: {mouseY - 75}px;
        width: 150px; 
        height: 150px;
        background: radial-gradient(circle, rgba(147, 197, 253, 0.35) 0%, rgba(129, 140, 248, 0.2) 50%, transparent 70%);
        border-radius: 50%;
        filter: blur(20px);
      "
    ></div>

    <!-- Inner bright spot -->
    <div
      class="absolute pointer-events-none transition-all duration-50 ease-linear"
      style="
        left: {mouseX - 25}px; 
        top: {mouseY - 25}px;
        width: 50px; 
        height: 50px;
        background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
        border-radius: 50%;
        filter: blur(10px);
      "
    ></div>
    <!-- Animated Background Shapes -->
    <div class="absolute inset-0 pointer-events-none">
      <!-- Circle 1 -->
      <div
        class="absolute top-20 left-10 w-20 h-20 bg-blue-400 opacity-20 rounded-full float-1"
      ></div>

      <!-- Triangle 2 -->
      <div
        class="absolute top-40 right-16 w-0 h-0 border-l-[15px] border-r-[15px] border-b-[25px] border-l-transparent border-r-transparent border-b-cyan-400 opacity-30 float-2"
      ></div>

      <!-- Circle 3 -->
      <div
        class="absolute bottom-32 left-20 w-12 h-12 bg-indigo-400 opacity-25 rounded-full float-3"
      ></div>

      <!-- Square 4 -->
      <div
        class="absolute top-1/3 right-10 w-16 h-16 bg-teal-400 opacity-20 rounded-lg transform rotate-45 float-4"
      ></div>

      <!-- Circle 5 -->
      <div
        class="absolute bottom-20 right-24 w-8 h-8 bg-sky-400 opacity-35 rounded-full float-5"
      ></div>

      <!-- Large Circle Background -->
      <div
        class="absolute top-10 right-4 w-32 h-32 bg-slate-300 opacity-10 rounded-full float-1"
      ></div>

      <!-- Lines -->
      <div
        class="absolute top-1/2 left-4 w-24 h-1 bg-gradient-to-r from-blue-400 to-transparent opacity-25 float-2"
      ></div>
      <div
        class="absolute bottom-1/3 right-8 w-20 h-1 bg-gradient-to-l from-cyan-400 to-transparent opacity-30 float-3"
      ></div>
    </div>

    <!-- Form Content -->
    <div class="relative z-10">
      {@render children?.()}
    </div>
  </div>

  <!-- Right Side - Logo Background -->
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
