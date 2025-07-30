<script lang="ts">
  import DashboardHeader from './DashboardHeader.svelte';
  import DashboardSidebar from './DashboardSidebar.svelte';
  import { ToastContainer } from '$lib';
  import ModalToastContainer from '$lib/components/ui/modal-toast-container.svelte';

  interface Props {
    children: import('svelte').Snippet;
  }

  let { children }: Props = $props();
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex">
  <!-- Sidebar -->
  <DashboardSidebar />
  
  <!-- Main Content Area -->
  <div class="flex-1 flex flex-col min-w-0 h-screen">
    <!-- Header - Fixed/Sticky -->
    <div class="sticky top-0 z-[100]">
      <DashboardHeader />
    </div>
    
    <!-- Page Content - Scrollable -->
    <main class="flex-1 overflow-auto">
      <div class="w-[92%] mx-auto px-4 py-8 mt-4">
        {@render children()}
      </div>
    </main>
  </div>
</div>

<ToastContainer />
<ModalToastContainer />