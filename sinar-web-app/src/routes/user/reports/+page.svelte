<script lang="ts">
  import { onMount } from "svelte";
  import { LoadingAuthGuard } from "$lib/utils";
  import { Loading } from "$lib";
  import { DashboardLayout } from "$lib";
  import { ReportTabs, ReportForm } from '@/lib/components/user/reports';
  import ReportListTable from '$lib/components/user/reports/ReportListTable.svelte';

  let hasAccess = $state(false);
  let showRedirectLoading = $state(false);

  onMount(async () => {
    // Guard protected page with loading - redirect to login if not authenticated
    const access = await LoadingAuthGuard.guardProtectedPage((loading) => {
      showRedirectLoading = loading;
    });
    hasAccess = access;
  });

  let activeTab = $state("input");
  let reportTableRef = $state<any>();
  let searchTerm = $state("");
  let sortOrder = $state<'asc' | 'desc'>('desc');
  let isLoading = $state(false);
  let selectedReportData = $state<any>(null);

  function handleTabChange(tab: string) {
    console.log('Page: Received tab change to:', tab);
    activeTab = tab;
    
    // If switching to browse tab, load reports
    if (tab === "browse" && reportTableRef) {
      reportTableRef.loadReports();
    }
  }

  function handleSearch(term: string) {
    searchTerm = term;
    if (reportTableRef) {
      reportTableRef.setSearchParams(term, sortOrder);
    }
  }

  function handleSortChange(order: 'asc' | 'desc') {
    sortOrder = order;
    if (reportTableRef) {
      reportTableRef.setSearchParams(searchTerm, order);
    }
  }

  function handleRefresh() {
    isLoading = true;
    if (reportTableRef) {
      reportTableRef.loadReports().finally(() => {
        isLoading = false;
      });
    }
  }

  function handleFormSubmit(data: FormData) {
    console.log('Report form submitted:', data);
  }

  function handleFormReset() {
    console.log('Report form reset');
    selectedReportData = null;
  }

  function handleRowClick(reportData: any) {
    console.log('Row clicked, switching to input tab with data:', reportData);
    selectedReportData = reportData;
    activeTab = "input";
  }
</script>

<svelte:head>
  <title>Reports - SINAR</title>
</svelte:head>

<DashboardLayout>
  {#if hasAccess}
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 relative" style="height: calc(100vh - 150px);">
      <!-- Gradient line at top -->
      <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 z-10 rounded-t-lg"></div>
      
      <!-- Fixed Header with Tabs -->
      <div class="absolute top-1 left-0 right-0 bg-white z-30 border-b border-gray-200 shadow-sm">
        <div class="px-6 pt-5 pb-4">
          <ReportTabs 
            {activeTab}
            onTabChange={handleTabChange}
            onSearch={handleSearch}
            onSortChange={handleSortChange}
            onRefresh={handleRefresh}
            {searchTerm}
            {sortOrder}
            {isLoading}
          />
        </div>
      </div>
      
      <!-- Tab Content -->
      <div class="absolute inset-0 pt-[120px] sm:pt-[130px] {activeTab === 'input' ? 'overflow-y-auto overflow-x-hidden' : 'overflow-hidden'}">
        {#if activeTab === "input"}
          <ReportForm 
            onSubmit={handleFormSubmit}
            onReset={handleFormReset}
            reportData={selectedReportData}
          />
        {:else if activeTab === "browse"}
          <ReportListTable 
            bind:this={reportTableRef}
            fetchOnMount={true}
            onRefresh={() => console.log('Reports refreshed')}
            onRowClick={handleRowClick}
            {searchTerm}
            {sortOrder}
          />
        {/if}
      </div>
    </div>
  {/if}
</DashboardLayout>

<!-- Redirect loading overlay -->
{#if showRedirectLoading}
  <Loading overlay={true} text="Redirecting to login..." />
{/if}