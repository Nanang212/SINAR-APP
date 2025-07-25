<script lang="ts">
  import Header from './Header.svelte';
  import Footer from './Footer.svelte';
  import type { Snippet } from "svelte";

  interface $$Props {
    children?: Snippet;
  }

  let { children }: $$Props = $props();
</script>

<div class="min-h-screen flex flex-col">
  <Header />
  
  <main class="flex-1">
    {@render children?.()}
  </main>
  
  <Footer />
</div>