<script lang="ts">
  import { onMount } from "svelte";
  import { LoadingAuthGuard } from "$lib/utils";
  import { DashboardLayout, Loading } from "$lib";

  let showRedirectLoading = $state(false);

  onMount(() => {
    // Async initialization
    (async () => {
      // Guard home page with loading - redirect to login if not authenticated
      const hasAccess = await LoadingAuthGuard.guardHomePage((loading) => {
        showRedirectLoading = loading;
      });

      if (!hasAccess) {
        return; // Exit if redirected
      }
    })();
  });
</script>

<svelte:head>
  <title>Dashboard - Sinar Web App</title>
</svelte:head>

<DashboardLayout>
  {#snippet children()}
    <!-- Welcome Section -->
    <div class="text-center py-16">
      <h2 class="text-4xl font-bold text-gray-800 mb-4">Dashboard</h2>
      <p class="text-xl text-gray-600">Welcome to SINAR Management System</p>
    </div>
  {/snippet}
</DashboardLayout>

<!-- Redirect loading overlay -->
{#if showRedirectLoading}
  <Loading overlay={true} text="Redirecting to login..." />
{/if}