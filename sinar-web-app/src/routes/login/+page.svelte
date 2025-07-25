<script lang="ts">
  import AuthLayout from '@/lib/components/layout/AuthLayout.svelte';
  import LoginForm from '@/lib/components/auth/LoginForm.svelte';
</script>

<svelte:head>
  <title>Sinar Web App</title>
</svelte:head>

<AuthLayout>
  {#snippet children()}
    <LoginForm />
  {/snippet}
</AuthLayout>