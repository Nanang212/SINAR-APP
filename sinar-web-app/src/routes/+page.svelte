<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  onMount(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('auth_token');
    
    if (token) {
      // User is authenticated, redirect to home
      goto('/home', { replaceState: true });
    } else {
      // User is not authenticated, redirect to login
      goto('/login', { replaceState: true });
    }
  });
</script>

<!-- Show loading while redirecting -->
<div class="min-h-screen flex items-center justify-center bg-gray-50">
  <div class="text-center">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
    <p class="mt-2 text-gray-600">Redirecting...</p>
  </div>
</div>