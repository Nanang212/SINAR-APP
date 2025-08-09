<script lang="ts">
  import { onMount } from 'svelte';
  import { dashboardService, type DocumentStatistics, type ReportStatistics, type UserStatistics } from '$lib/services/dashboard/dashboard.service';
  import { Loading } from '$lib';
  import DocumentChart from './DocumentChart.svelte';
  import ReportChart from './ReportChart.svelte';
  import UserStatsCards from './UserStatsCards.svelte';
  import ReportTypeChart from './ReportTypeChart.svelte';

  let isLoading = $state(true);
  let error = $state<string | null>(null);
  
  // Statistics data
  let documentStats = $state<DocumentStatistics | null>(null);
  let reportStats = $state<ReportStatistics | null>(null);
  let userStats = $state<UserStatistics | null>(null);

  onMount(async () => {
    await loadDashboardData();
  });

  async function loadDashboardData() {
    try {
      isLoading = true;
      error = null;

      const response = await dashboardService.getAllStatistics();
      
      if (response.documents.status && response.documents.data) {
        documentStats = response.documents.data;
      }
      
      if (response.reports.status && response.reports.data) {
        reportStats = response.reports.data;
      }
      
      if (response.users.status && response.users.data) {
        userStats = response.users.data;
      }

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      error = err instanceof Error ? err.message : 'Failed to load dashboard data';
    } finally {
      isLoading = false;
    }
  }

  async function handleRefresh() {
    await loadDashboardData();
  }
</script>

<div class="min-h-screen bg-gray-50 p-4">
  <!-- Header -->
  <div class="mb-8">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p class="text-gray-600">Welcome to SINAR Management System</p>
      </div>
      <button 
        onclick={handleRefresh}
        disabled={isLoading}
        class="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <svg class="w-4 h-4 mr-2 {isLoading ? 'animate-spin' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Refresh
      </button>
    </div>
  </div>

  {#if isLoading}
    <div class="flex items-center justify-center h-64">
      <Loading text="Loading dashboard data..." />
    </div>
  {:else if error}
    <div class="rounded-md bg-red-50 p-4 mb-6">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Error Loading Dashboard</h3>
          <p class="text-sm text-red-700 mt-1">{error}</p>
        </div>
      </div>
    </div>
  {:else}
    <!-- Dashboard Content -->
    <div class="space-y-8">
      
      <!-- User Statistics Cards -->
      {#if userStats}
        <UserStatsCards data={userStats} />
      {/if}

      <!-- Charts Grid -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        <!-- Document Statistics Chart -->
        {#if documentStats}
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div class="mb-6">
              <h2 class="text-xl font-semibold text-gray-900 mb-2">Document Statistics</h2>
              <p class="text-gray-600">Monthly document uploads for {documentStats.year}</p>
              <div class="mt-2">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Total: {documentStats.total_documents_year} documents
                </span>
              </div>
            </div>
            <div class="h-80">
              <DocumentChart data={documentStats} />
            </div>
          </div>
        {/if}

        <!-- Report Statistics Chart -->
        {#if reportStats}
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div class="mb-6">
              <h2 class="text-xl font-semibold text-gray-900 mb-2">Report Statistics</h2>
              <p class="text-gray-600">Monthly report items for {reportStats.year}</p>
              <div class="mt-2">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Total: {reportStats.total_items_year} items
                </span>
              </div>
            </div>
            <div class="h-80">
              <ReportChart data={reportStats} />
            </div>
          </div>
        {/if}

      </div>

      <!-- Report Type Distribution -->
      {#if reportStats}
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="mb-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-2">Report Type Distribution</h2>
            <p class="text-gray-600">Breakdown of report items by type</p>
          </div>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div class="h-80">
              <ReportTypeChart data={reportStats} />
            </div>
            <div class="space-y-4">
              {#each reportStats.types as type}
                {@const totalForType = reportStats.monthly_stats.reduce((sum, month) => sum + month.by_type[type], 0)}
                <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div class="flex items-center">
                    <div class="w-4 h-4 rounded-full mr-3 {
                      type === 'TEXT' ? 'bg-blue-500' :
                      type === 'LINK' ? 'bg-green-500' :
                      type === 'AUDIO' ? 'bg-yellow-500' : 'bg-red-500'
                    }"></div>
                    <span class="font-medium text-gray-900">{type}</span>
                  </div>
                  <span class="text-2xl font-bold text-gray-900">{totalForType}</span>
                </div>
              {/each}
            </div>
          </div>
        </div>
      {/if}

    </div>
  {/if}
</div>