<script lang="ts">
  import { onMount } from "svelte";
  import { LoadingAuthGuard } from '$lib/utils';
  import { authService } from '$lib/services';
  import { NavigationHelper } from '$lib/utils';
  import { Loading } from '$lib';
  
  let currentTime = $state("");
  let userName = $state("Admin"); // This would come from auth state in real app
  let isLoggingOut = $state(false);
  let showLogoutOverlay = $state(false);
  let showRedirectLoading = $state(false);
  
  onMount(async () => {
    // Guard home page with loading - redirect to login if not authenticated
    const hasAccess = await LoadingAuthGuard.guardHomePage((loading) => {
      showRedirectLoading = loading;
    });
    
    if (!hasAccess) {
      return; // Exit if redirected
    }

    // Get user data from auth service
    const user = authService.getCurrentUser();
    if (user) {
      userName = user.username;
    }

    const updateTime = () => {
      const now = new Date();
      currentTime = now.toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      });
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    
    return () => clearInterval(interval);
  });

  // Handle logout functionality
  async function handleLogout() {
    if (isLoggingOut) return; // Prevent multiple logout calls
    
    isLoggingOut = true;
    
    // Show page overlay loading immediately
    showLogoutOverlay = true;
    
    try {
      // First, show loading for user experience (2 seconds)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Then call logout API
      const response = await authService.logout();
      
      // Additional delay after API call (500ms)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (response.status) {
        // Redirect to login page after successful logout
        NavigationHelper.navigateTo('/login');
      } else {
        console.error('Logout failed:', response.message);
        // Still redirect even if backend call failed (local cleanup already done)
        NavigationHelper.navigateTo('/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Still wait for full delay even on error
      await new Promise(resolve => setTimeout(resolve, 500));
      NavigationHelper.navigateTo('/login');
    } finally {
      isLoggingOut = false;
      showLogoutOverlay = false;
    }
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
  <!-- Header -->
  <header class="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center py-4">
        <!-- Logo -->
        <div class="flex items-center space-x-3">
          <img src="/assets/logo.png" alt="SINAR Logo" class="w-10 h-10" />
          <div>
            <h1 class="text-xl font-bold text-gray-800">SINAR</h1>
            <p class="text-sm text-gray-600">Sinergi Narasi</p>
          </div>
        </div>
        
        <!-- User Info -->
        <div class="flex items-center space-x-4">
          <div class="text-right">
            <p class="text-sm font-medium text-gray-700">Welcome, {userName}</p>
            <p class="text-xs text-gray-500">{currentTime}</p>
          </div>
          <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <span class="text-white text-sm font-medium">{userName.charAt(0)}</span>
          </div>
          
          <!-- Logout Button -->
          <button 
            onclick={handleLogout}
            disabled={isLoggingOut}
            class="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            title="Logout"
          >
            {#if isLoggingOut}
              <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Logging out...</span>
            {:else}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            {/if}
          </button>
        </div>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Welcome Section -->
    <div class="mb-8">
      <h2 class="text-3xl font-bold text-gray-800 mb-2">Dashboard</h2>
      <p class="text-gray-600">Welcome to SINAR Management System</p>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <!-- Card 1 -->
      <div class="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-200/50">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Total Users</p>
            <p class="text-2xl font-bold text-gray-800">1,234</p>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
            </svg>
          </div>
        </div>
        <div class="mt-4">
          <span class="text-sm text-green-600">+5.2% from last month</span>
        </div>
      </div>

      <!-- Card 2 -->
      <div class="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-200/50">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Active Projects</p>
            <p class="text-2xl font-bold text-gray-800">56</p>
          </div>
          <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
          </div>
        </div>
        <div class="mt-4">
          <span class="text-sm text-green-600">+12.1% from last month</span>
        </div>
      </div>

      <!-- Card 3 -->
      <div class="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-200/50">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Revenue</p>
            <p class="text-2xl font-bold text-gray-800">$24,567</p>
          </div>
          <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
            </svg>
          </div>
        </div>
        <div class="mt-4">
          <span class="text-sm text-green-600">+8.3% from last month</span>
        </div>
      </div>

      <!-- Card 4 -->
      <div class="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-200/50">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Tasks Complete</p>
            <p class="text-2xl font-bold text-gray-800">89%</p>
          </div>
          <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2 2z"></path>
            </svg>
          </div>
        </div>
        <div class="mt-4">
          <span class="text-sm text-green-600">+2.1% from last week</span>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Recent Activity -->
      <div class="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-200/50">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
        <div class="space-y-4">
          <div class="flex items-center space-x-3">
            <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
            <p class="text-sm text-gray-600">New user registered - John Doe</p>
            <span class="text-xs text-gray-400 ml-auto">2 min ago</span>
          </div>
          <div class="flex items-center space-x-3">
            <div class="w-2 h-2 bg-green-500 rounded-full"></div>
            <p class="text-sm text-gray-600">Project "Website Redesign" completed</p>
            <span class="text-xs text-gray-400 ml-auto">1 hour ago</span>
          </div>
          <div class="flex items-center space-x-3">
            <div class="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <p class="text-sm text-gray-600">Payment received from Client ABC</p>
            <span class="text-xs text-gray-400 ml-auto">3 hours ago</span>
          </div>
          <div class="flex items-center space-x-3">
            <div class="w-2 h-2 bg-purple-500 rounded-full"></div>
            <p class="text-sm text-gray-600">New task assigned to team</p>
            <span class="text-xs text-gray-400 ml-auto">5 hours ago</span>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-200/50">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div class="grid grid-cols-2 gap-4">
          <button class="p-4 text-left rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200">
            <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
              <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
            </div>
            <p class="text-sm font-medium text-gray-800">Add User</p>
          </button>
          
          <button class="p-4 text-left rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200">
            <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mb-3">
              <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <p class="text-sm font-medium text-gray-800">New Project</p>
          </button>
          
          <button class="p-4 text-left rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200">
            <div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mb-3">
              <svg class="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2 2z"></path>
              </svg>
            </div>
            <p class="text-sm font-medium text-gray-800">Reports</p>
          </button>
          
          <button class="p-4 text-left rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200">
            <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
              <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
            </div>
            <p class="text-sm font-medium text-gray-800">Settings</p>
          </button>
        </div>
      </div>
    </div>
  </main>
</div>

<!-- Logout overlay loading -->
{#if showLogoutOverlay}
  <Loading overlay={true} text="Logging out..." />
{/if}

<!-- Redirect loading overlay -->
{#if showRedirectLoading}
  <Loading overlay={true} text="Redirecting to login..." />
{/if}