<script lang="ts">
  interface $$Props {
    activeTab: string;
    onTabChange: (tab: string) => void;
  }

  let { activeTab, onTabChange }: $$Props = $props();

  const tabs = [
    { id: "input", label: "Input Category", icon: "📝" },
    { id: "browse", label: "Browse Categories", icon: "📋" }
  ];

  function handleTabClick(tabId: string) {
    console.log('Tab clicked:', tabId);
    onTabChange(tabId);
  }
</script>

<div class="mb-6">
  <div class="border-b border-gray-200">
    <nav class="-mb-px flex space-x-8" aria-label="Tabs">
      {#each tabs as tab (tab.id)}
        <button
          class="group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 {activeTab === tab.id
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
          onclick={() => handleTabClick(tab.id)}
        >
          <span class="mr-2 text-lg">{tab.icon}</span>
          {tab.label}
        </button>
      {/each}
    </nav>
  </div>
</div>