<script lang="ts">
  import { onMount } from 'svelte';
  import { LoadingAuthGuard } from '$lib/utils';
  import { Loading } from '$lib';
  import AuthLayout from '@/lib/components/layout/AuthLayout.svelte';
  import LoginForm from '@/lib/components/auth/LoginForm.svelte';

  let showRedirectLoading = $state(false);

  onMount(async () => {
    // Guard login page with loading - redirect to home if already authenticated
    await LoadingAuthGuard.guardLoginPage((loading) => {
      showRedirectLoading = loading;
    });
  });
</script>

<svelte:head>
  <title>Sinar Web App</title>
</svelte:head>

<AuthLayout>
  {#snippet children()}
    <LoginForm />
  {/snippet}
</AuthLayout>

<!-- Redirect loading overlay -->
{#if showRedirectLoading}
  <Loading overlay={true} text="Redirecting..." />
{/if}