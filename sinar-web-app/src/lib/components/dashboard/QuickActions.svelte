<script lang="ts">
  interface QuickAction {
    id: string;
    title: string;
    icon: string;
    iconBg: string;
    iconColor: string;
    href?: string;
    onClick?: () => void;
  }

  const actions: QuickAction[] = [
    {
      id: 'add-user',
      title: 'Add User',
      icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>`,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      href: '/users/new'
    },
    {
      id: 'new-project',
      title: 'New Project',
      icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>`,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      href: '/projects/new'
    },
    {
      id: 'reports',
      title: 'Reports',
      icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2 2z"></path>`,
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      href: '/reports'
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>`,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      href: '/settings'
    },
    {
      id: 'backup',
      title: 'Backup',
      icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>`,
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      onClick: () => alert('Backup feature coming soon!')
    },
    {
      id: 'export',
      title: 'Export Data',
      icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>`,
      iconBg: 'bg-pink-100',
      iconColor: 'text-pink-600',
      onClick: () => alert('Export feature coming soon!')
    }
  ];

  function handleActionClick(action: QuickAction) {
    if (action.onClick) {
      action.onClick();
    } else if (action.href) {
      // In a real app, you would use router navigation here
      console.log(`Navigate to: ${action.href}`);
    }
  }
</script>

<div class="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-200/50">
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-lg font-semibold text-gray-800">Quick Actions</h3>
    <button class="text-sm text-blue-600 hover:text-blue-800 font-medium">
      Customize
    </button>
  </div>
  
  <div class="grid grid-cols-2 lg:grid-cols-3 gap-4">
    {#each actions as action}
      <button
        onclick={() => handleActionClick(action)}
        class="p-4 text-left rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 group"
      >
        <div class="w-8 h-8 {action.iconBg} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200">
          <svg class="w-4 h-4 {action.iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {@html action.icon}
          </svg>
        </div>
        <p class="text-sm font-medium text-gray-800 group-hover:text-gray-900">{action.title}</p>
      </button>
    {/each}
  </div>
  
  <!-- Add Custom Action Button -->
  <div class="mt-4 pt-4 border-t border-gray-200">
    <button class="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors duration-200 flex items-center justify-center space-x-2">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
      </svg>
      <span class="text-sm font-medium">Add Custom Action</span>
    </button>
  </div>
</div>