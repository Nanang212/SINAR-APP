<script lang="ts">
  import { toastStore } from "$lib/stores/toast";
  import Toast from "./toast.svelte";

  $: toasts = $toastStore;

  function handleCloseToast(id: string) {
    toastStore.remove(id);
  }
</script>

<div class="fixed top-4 right-4 z-50 flex flex-col items-end space-y-2">
  {#each toasts as toast (toast.id)}
    <Toast {toast} onClose={handleCloseToast} />
  {/each}
</div>