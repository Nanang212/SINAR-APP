<script lang="ts">
  import { modalToastStore } from "$lib/stores/modal-toast";
  import ModalToast from "./modal-toast.svelte";

  $: toasts = $modalToastStore;

  function handleCloseToast(id: string) {
    modalToastStore.remove(id);
  }
</script>

<!-- Only show one modal toast at a time -->
{#if toasts.length > 0}
  <ModalToast toast={toasts[0]} onClose={handleCloseToast} />
{/if}