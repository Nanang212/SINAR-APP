<script lang="ts">
  import type { Snippet } from "svelte";

  interface $$Props {
    children?: Snippet;
  }

  let { children }: $$Props = $props();
</script>

<header class="bg-white border-b border-gray-200">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between items-center h-16">
      <!-- Logo -->
      <div class="flex items-center">
        <a href="/" class="text-xl font-bold text-gray-900">Sinar App</a>
      </div>
      
      <!-- Navigation -->
      <nav class="hidden md:flex items-center space-x-8">
        <a href="/" class="text-gray-700 hover:text-gray-900 font-medium">Home</a>
        <a href="/about" class="text-gray-700 hover:text-gray-900 font-medium">About</a>
        <a href="/contact" class="text-gray-700 hover:text-gray-900 font-medium">Contact</a>
      </nav>
      
      <!-- Auth Buttons -->
      <div class="flex items-center space-x-4">
        <a href="/login" class="text-gray-700 hover:text-gray-900 font-medium">Login</a>
        <a href="/register" class="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 font-medium">Sign up</a>
      </div>
      
      <!-- Mobile menu button -->
      <div class="md:hidden">
        <button type="button" class="text-gray-700 hover:text-gray-900">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</header>