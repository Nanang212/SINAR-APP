<script lang="ts">
  import { onMount } from 'svelte';
  import { AuthGuard } from '$lib/utils';
  import AuthLayout from '@/lib/components/layout/AuthLayout.svelte';
  import LoginForm from '@/lib/components/auth/LoginForm.svelte';

  onMount(() => {
    // Guard login page - redirect to home if already authenticated
    AuthGuard.guardLoginPage();
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