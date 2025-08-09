<script lang="ts">
  import { onMount } from "svelte";
  import { LoadingAuthGuard } from "$lib/utils";
  import { DashboardLayout, Loading } from "$lib";
  import Dashboard from "$lib/components/dashboard/Dashboard.svelte";

  let showRedirectLoading = $state(false);
  let hasAccess = $state(false);

  onMount(() => {
    // Async initialization
    (async () => {
      // Guard home page with loading - redirect to login if not authenticated
      const access = await LoadingAuthGuard.guardHomePage((loading) => {
        showRedirectLoading = loading;
      });

      hasAccess = access;
    })();
  });
</script>

<svelte:head>
  <title>Dashboard - Sinar Web App</title>
</svelte:head>

<DashboardLayout>
  {#snippet children()}
    {#if hasAccess}
      <Dashboard />
    {/if}
  {/snippet}
</DashboardLayout>

<!-- Redirect loading overlay -->
{#if showRedirectLoading}
  <Loading overlay={true} text="Redirecting to login..." />
{/if}