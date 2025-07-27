<script lang="ts">
  interface Activity {
    id: string;
    type: 'user' | 'project' | 'payment' | 'task';
    message: string;
    timestamp: string;
    color: string;
  }

  const activities: Activity[] = [
    {
      id: '1',
      type: 'user',
      message: 'New user registered - John Doe',
      timestamp: '2 min ago',
      color: 'bg-blue-500'
    },
    {
      id: '2',
      type: 'project',
      message: 'Project "Website Redesign" completed',
      timestamp: '1 hour ago',
      color: 'bg-green-500'
    },
    {
      id: '3',
      type: 'payment',
      message: 'Payment received from Client ABC',
      timestamp: '3 hours ago',
      color: 'bg-yellow-500'
    },
    {
      id: '4',
      type: 'task',
      message: 'New task assigned to team',
      timestamp: '5 hours ago',
      color: 'bg-purple-500'
    },
    {
      id: '5',
      type: 'user',
      message: 'User profile updated - Jane Smith',
      timestamp: '1 day ago',
      color: 'bg-blue-500'
    },
    {
      id: '6',
      type: 'project',
      message: 'Project milestone reached',
      timestamp: '2 days ago',
      color: 'bg-green-500'
    }
  ];
</script>

<div class="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-200/50">
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-lg font-semibold text-gray-800">Recent Activity</h3>
    <button class="text-sm text-blue-600 hover:text-blue-800 font-medium">
      View All
    </button>
  </div>
  
  <div class="space-y-4 max-h-96 overflow-y-auto">
    {#each activities as activity}
      <div class="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50/50 transition-colors duration-200">
        <div class="w-2 h-2 {activity.color} rounded-full flex-shrink-0"></div>
        <div class="flex-1 min-w-0">
          <p class="text-sm text-gray-600 truncate">{activity.message}</p>
        </div>
        <span class="text-xs text-gray-400 flex-shrink-0">{activity.timestamp}</span>
      </div>
    {/each}
  </div>
  
  <!-- Empty state -->
  {#if activities.length === 0}
    <div class="text-center py-8">
      <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      <p class="text-gray-500 text-sm">No recent activity</p>
    </div>
  {/if}
</div>