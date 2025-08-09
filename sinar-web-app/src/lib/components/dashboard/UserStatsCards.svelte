<script lang="ts">
  import type { UserStatistics } from '$lib/services/dashboard/dashboard.service';

  interface Props {
    data: UserStatistics;
  }

  let { data }: Props = $props();

  // Calculate percentage
  const activePercentage = Math.round((data.active_users / data.total_users) * 100);
  const inactivePercentage = 100 - activePercentage;
</script>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  
  <!-- Total Users Card -->
  <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div class="flex items-center">
      <div class="flex-shrink-0">
        <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
          <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-1a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        </div>
      </div>
      <div class="ml-4 flex-1">
        <p class="text-sm font-medium text-gray-600">Total Users</p>
        <p class="text-2xl font-bold text-gray-900">{data.total_users}</p>
        <p class="text-xs text-gray-500 mt-1">All registered users</p>
      </div>
    </div>
  </div>

  <!-- Active Users Card -->
  <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div class="flex items-center">
      <div class="flex-shrink-0">
        <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
          <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
      <div class="ml-4 flex-1">
        <p class="text-sm font-medium text-gray-600">Active Users</p>
        <p class="text-2xl font-bold text-gray-900">{data.active_users}</p>
        <div class="flex items-center mt-1">
          <span class="text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
            {activePercentage}%
          </span>
          <span class="text-xs text-gray-500 ml-2">of total users</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Inactive Users Card -->
  <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div class="flex items-center">
      <div class="flex-shrink-0">
        <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
          <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
          </svg>
        </div>
      </div>
      <div class="ml-4 flex-1">
        <p class="text-sm font-medium text-gray-600">Inactive Users</p>
        <p class="text-2xl font-bold text-gray-900">{data.inactive_users}</p>
        <div class="flex items-center mt-1">
          <span class="text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
            {inactivePercentage}%
          </span>
          <span class="text-xs text-gray-500 ml-2">of total users</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Users by Role Card -->
  <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div class="flex items-center mb-4">
      <div class="flex-shrink-0">
        <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
          <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
      </div>
      <div class="ml-4 flex-1">
        <p class="text-sm font-medium text-gray-600">By Role</p>
        <p class="text-xs text-gray-500">User distribution</p>
      </div>
    </div>
    <div class="space-y-2">
      {#each data.by_role as role}
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <div class="w-3 h-3 rounded-full mr-2 {role.role_name === 'admin' ? 'bg-yellow-400' : 'bg-blue-400'}"></div>
            <span class="text-sm font-medium text-gray-700 capitalize">{role.role_name}</span>
          </div>
          <span class="text-sm font-bold text-gray-900">{role.total_users}</span>
        </div>
      {/each}
    </div>
  </div>

</div>