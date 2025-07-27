
<script lang="ts">
  interface StatCard {
    title: string;
    value: string;
    change: string;
    changeType: 'positive' | 'negative';
    icon: string;
    iconBg: string;
    iconColor: string;
  }

  const stats: StatCard[] = [
    {
      title: 'Total Users',
      value: '1,234',
      change: '+5.2% from last month',
      changeType: 'positive',
      icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>`,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Active Projects',
      value: '56',
      change: '+12.1% from last month',
      changeType: 'positive',
      icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>`,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      title: 'Revenue',
      value: '$24,567',
      change: '+8.3% from last month',
      changeType: 'positive',
      icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>`,
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600'
    },
    {
      title: 'Tasks Complete',
      value: '89%',
      change: '+2.1% from last week',
      changeType: 'positive',
      icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2 2z"></path>`,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600'
    }
  ];
</script>

<!-- Stats Cards -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
  {#each stats as stat}
    <div class="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-200/50 hover:shadow-md transition-shadow duration-200">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600">{stat.title}</p>
          <p class="text-2xl font-bold text-gray-800">{stat.value}</p>
        </div>
        <div class="w-12 h-12 {stat.iconBg} rounded-lg flex items-center justify-center">
          <svg class="w-6 h-6 {stat.iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {@html stat.icon}
          </svg>
        </div>
      </div>
      <div class="mt-4">
        <span class="text-sm {stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}">
          {stat.change}
        </span>
      </div>
    </div>
  {/each}
</div>