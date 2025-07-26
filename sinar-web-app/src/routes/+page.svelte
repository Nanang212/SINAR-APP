<script lang="ts">
  import { onMount } from 'svelte';
  import { AuthGuard } from '@/lib/utils/';
  import MainLayout from '@/lib/components/layout/MainLayout.svelte';

  onMount(() => {
    // Check if user is authenticated and redirect to home
    AuthGuard.checkAccess({
      redirectIfAuth: true,
      redirectTo: '/home'
    });
  });
</script>

<svelte:head>
  <title>Home - Sinar Web App</title>
</svelte:head>

<MainLayout>
  {#snippet children()}
    <!-- Hero Section -->
    <section class="bg-gradient-to-br from-gray-50 to-gray-100 py-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 class="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          Welcome to <span class="text-blue-600">Sinar App</span>
        </h1>
        <p class="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Building the future with modern web technologies. Clean, fast, and beautiful applications for everyone.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="/login" class="bg-gray-900 text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors">
            Get Started
          </a>
          <a href="/about" class="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors">
            Learn More
          </a>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="py-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-3xl font-bold text-gray-900 mb-4">Why Choose Sinar App?</h2>
          <p class="text-xl text-gray-600">Everything you need to build amazing applications</p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="text-center p-6">
            <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Lightning Fast</h3>
            <p class="text-gray-600">Built with SvelteKit for optimal performance and user experience.</p>
          </div>
          
          <div class="text-center p-6">
            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Reliable</h3>
            <p class="text-gray-600">TypeScript powered with comprehensive testing and validation.</p>
          </div>
          
          <div class="text-center p-6">
            <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"/>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Responsive</h3>
            <p class="text-gray-600">Beautiful design that works perfectly on all devices and screen sizes.</p>
          </div>
        </div>
      </div>
    </section>
  {/snippet}
</MainLayout>