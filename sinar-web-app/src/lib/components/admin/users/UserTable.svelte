<script lang="ts">
  import { onMount } from "svelte";
  import {
    userService,
    type User as ApiUser,
    type GetUsersParams,
  } from "@/lib/services/users/user.service";
  import ConfirmationModal from '@/lib/components/ui/ConfirmationModal.svelte';
  import { modalToastStore } from '@/lib/stores/modal-toast';
  import Loading from '$lib/components/ui/loading.svelte';

  interface User {
    id: string;
    username: string;
    name_mentri: string | null;
    contact_person: string | null;
    logo_url: string | null;
    role: string;
    category_name: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    statusColor: string;
    roleColor: string;
  }

  interface $$Props {
    fetchOnMount?: boolean;
    onDelete?: (user: User) => void;
    onRefresh?: () => void;
    onRowClick?: (user: ApiUser) => void;
    searchTerm?: string;
    sortOrder?: 'asc' | 'desc';
  }

  let {
    fetchOnMount = false,
    onDelete,
    onRefresh,
    onRowClick,
    searchTerm = "",
    sortOrder = 'desc',
  }: $$Props = $props();

  // Component state
  let isLoading = $state(false);
  let error = $state<string | null>(null);
  let users = $state<User[]>([]);
  let apiUsers = $state<ApiUser[]>([]);

  // Server-side pagination state
  let currentPage = $state(1);
  let pageSize = $state(10);
  let totalRecords = $state(0);
  let totalPages = $state(0);

  // Transform API user to table format
  function transformApiUser(apiUser: ApiUser): User {
    try {
      return {
        id: apiUser.id.toString(),
        username: apiUser.username || "Unknown",
        name_mentri: apiUser.name_mentri || null,
        contact_person: apiUser.contact_person || null,
        logo_url: apiUser.logo_url || null,
        role: apiUser.role?.name || "user",
        category_name: apiUser.category?.name || null,
        is_active: apiUser.is_active ?? true,
        created_at: apiUser.created_at,
        updated_at: apiUser.updated_at,
        statusColor: getStatusColor(apiUser.is_active ?? true),
        roleColor: getRoleColor(apiUser.role?.name || "user"),
      };
    } catch (error) {
      console.error("Error transforming user:", error, apiUser);
      return {
        id: apiUser.id?.toString() || "unknown",
        username: "Error loading user",
        name_mentri: null,
        contact_person: null,
        logo_url: null,
        role: "user",
        category_name: null,
        is_active: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        statusColor: "text-gray-500",
        roleColor: "text-gray-500",
      };
    }
  }

  // Get status color based on active status
  function getStatusColor(isActive: boolean): string {
    return isActive ? "text-green-500" : "text-red-500";
  }

  // Get role color based on role
  function getRoleColor(role: string): string {
    switch (role.toLowerCase()) {
      case "admin":
        return "text-purple-500";
      case "manager":
        return "text-blue-500";
      case "user":
        return "text-gray-500";
      default:
        return "text-gray-500";
    }
  }

  // Fetch users with server-side pagination
  async function fetchUsers() {
    console.log("Starting fetchUsers with server-side pagination...");
    isLoading = true;
    error = null;

    try {
      const params: GetUsersParams = {
        page: currentPage,
        limit: pageSize,
        search: searchTerm.trim(),
        order: sortOrder
      };

      console.log("🚀 UserTable fetchUsers called with:");
      console.log("- currentPage:", currentPage);
      console.log("- pageSize:", pageSize);  
      console.log("- searchTerm:", searchTerm);
      console.log("- sortOrder:", sortOrder);
      console.log("- constructed params:", params);
      console.log("Calling userService.getAllUsersWithPagination() with params:", params);
      const response = await userService.getAllUsersWithPagination(params);
      console.log("API Response:", response);

      if (response.status === true && response.data) {
        console.log("Full response structure:", response);
        console.log("response.data is array?", Array.isArray(response.data));
        console.log("response.data.data exists?", !!response.data?.data);
        console.log("response.total:", response.total);
        
        // Handle both direct array and nested object response structures (like DocumentTable)
        let usersData: ApiUser[] = [];
        let total = 0;
        
        if (Array.isArray(response.data)) {
          // Direct array response
          usersData = response.data;
          total = response.total || response.data.length;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          // Nested object response  
          usersData = response.data.data;
          total = response.data.total || 0;
          totalPages = Math.ceil(total / pageSize);
        }
        
        const page = response.page || 1;
        const limit = 10; // Our pageSize

        // Calculate totalPages based on total records and pageSize
        totalPages = Math.ceil(total / pageSize);

        console.log("✅ FIXED: Processing", usersData.length, "users");
        console.log("✅ Pagination: total:", total, "page:", page, "limit:", limit);
        console.log("✅ First user sample:", usersData[0]);
        console.log("✅ Setting totalRecords to:", total);
        
        apiUsers = usersData;
        users = usersData.map(transformApiUser);
        totalRecords = total;
        
        console.log("✅ After assignment:");
        console.log("- apiUsers.length:", apiUsers.length);
        console.log("- users.length:", users.length); 
        console.log("- totalRecords:", totalRecords);
        console.log("- totalPages:", totalPages);
        console.log("- currentPage:", currentPage);
        console.log("- Should next be enabled?", currentPage < totalPages);
        error = null;
      } else {
        error = response.message || "Failed to fetch users";
        users = [];
        apiUsers = [];
        totalRecords = 0;
        totalPages = 0;
        console.warn("API Error:", response.status, response.message);
      }
    } catch (err) {
      error = err instanceof Error ? err.message : "Unknown error occurred";
      users = [];
      apiUsers = [];
      totalRecords = 0;
      totalPages = 0;
      console.error("Fetch Error:", err);
    } finally {
      isLoading = false;
      console.log("fetchUsers completed, isLoading:", isLoading);
    }
  }

  // Handle refresh
  async function handleRefresh() {
    await fetchUsers();
    onRefresh?.();
  }

  // Fetch on mount if required
  onMount(() => {
    if (fetchOnMount) {
      fetchUsers();
    }
  });

  // Public method to fetch users (called from parent)
  export function loadUsers() {
    return fetchUsers();
  }

  // Public method to set search and sort parameters (called from parent)
  export function setSearchParams(term: string, order: 'asc' | 'desc') {
    searchTerm = term;
    sortOrder = order;
    currentPage = 1; // Reset to first page when searching
    fetchUsers();
  }

  // Watch for changes in searchTerm and sortOrder to trigger refetch
  let prevSearchTerm = searchTerm;
  let prevSortOrder = sortOrder;
  
  $effect(() => {
    console.log("🔄 UserTable $effect triggered:");
    console.log("- prevSearchTerm:", prevSearchTerm, "→ searchTerm:", searchTerm);
    console.log("- prevSortOrder:", prevSortOrder, "→ sortOrder:", sortOrder);
    
    // Only trigger if search term or sort order actually changed
    if (prevSearchTerm !== searchTerm || prevSortOrder !== sortOrder) {
      console.log("🎯 Search/Sort changed, triggering debounced fetchUsers");
      prevSearchTerm = searchTerm;
      prevSortOrder = sortOrder;
      
      // Debounce search to avoid too many requests
      const timeoutId = setTimeout(() => {
        console.log("⏰ Debounced timeout fired - calling fetchUsers");
        currentPage = 1; // Reset to first page when searching
        fetchUsers();
      }, 500);

      return () => clearTimeout(timeoutId);
    }
    
    // Return undefined if no cleanup needed
    return undefined;
  });

  // Modal state
  let showDeleteModal = $state(false);
  let userToDelete = $state<User | null>(null);
  let isDeleting = $state(false);

  function handlePageChange(newPage: number) {
    if (newPage >= 1 && newPage <= totalPages) {
      currentPage = newPage;
      fetchUsers();
    }
  }

  function handleDelete(user: User) {
    userToDelete = user;
    showDeleteModal = true;
  }

  async function confirmDelete() {
    if (!userToDelete) return;

    isDeleting = true;
    try {
      const response = await userService.deleteUser(userToDelete.id);
      
      if (response.status) {
        modalToastStore.success('User deleted successfully!');
        
        // Calculate if current page will be empty after deletion
        const remainingRecords = totalRecords - 1;
        const maxPageAfterDelete = Math.ceil(remainingRecords / pageSize);
        
        // If current page would be empty after delete, go to previous page
        if (currentPage > maxPageAfterDelete && maxPageAfterDelete > 0) {
          currentPage = maxPageAfterDelete;
        }
        
        // Refresh the user list after successful deletion
        await fetchUsers();
        onDelete?.(userToDelete);
      } else {
        modalToastStore.error('Failed to delete user: ' + response.message);
      }
    } catch (error) {
      console.error('Delete failed:', error);
      modalToastStore.error('Failed to delete user: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      isDeleting = false;
      showDeleteModal = false;
      userToDelete = null;
    }
  }

  function cancelDelete() {
    showDeleteModal = false;
    userToDelete = null;
  }

  function handleRowClick(user: User) {
    // Find the corresponding API user
    const apiUser = apiUsers.find(apiUser => apiUser.id.toString() === user.id);
    if (apiUser && onRowClick) {
      onRowClick(apiUser);
    }
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
  }
</script>

<div class="h-full flex flex-col pl-2 sm:pl-4 lg:pl-6 pr-2 sm:pr-4 lg:pr-8 pb-4 sm:pb-6 pt-6 sm:pt-10">

  <!-- Loading State -->
  {#if isLoading}
    <div class="flex justify-center items-center py-12">
      <div class="flex items-center space-x-2">
        <svg
          class="w-6 h-6 text-blue-600 animate-spin"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        <span class="text-gray-700">Loading users...</span>
      </div>
    </div>
  {:else}
    <!-- Data Table -->
    <div class="flex-1 pr-0 sm:pr-4 overflow-auto">
      <div class="mt-16 sm:mt-8">
        <table class="min-w-full divide-y divide-gray-200 border border-gray-200">
          <thead class="bg-gray-50 sticky top-12 sm:-top-1 z-10">
            <tr>
              <!-- User Column -->
              <th class="px-3 sm:px-4 lg:px-6 py-4 sm:py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-r border-gray-200 min-w-[280px] sm:min-w-[220px]">
                User
              </th>
              <!-- Role Column (Hidden on mobile) -->
              <th class="hidden md:table-cell px-3 sm:px-4 lg:px-6 py-4 sm:py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-r border-gray-200 min-w-[120px] sm:min-w-[100px]">
                Role
              </th>
              <!-- Category Column (Hidden on small screens) -->
              <th class="hidden lg:table-cell px-3 sm:px-4 lg:px-6 py-4 sm:py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-r border-gray-200 min-w-[150px] sm:min-w-[130px]">
                Category
              </th>
              <!-- Contact Person Column (Hidden on small screens) -->
              <th class="hidden sm:table-cell px-3 sm:px-4 lg:px-6 py-4 sm:py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-r border-gray-200 min-w-[140px] sm:min-w-[120px]">
                Contact Person
              </th>
              <!-- Created At Column (Hidden on small screens) -->
              <th class="hidden sm:table-cell px-3 sm:px-4 lg:px-6 py-4 sm:py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-r border-gray-200 min-w-[170px] sm:min-w-[140px]">
                Created At
              </th>
              <!-- Actions Column -->
              <th class="px-3 sm:px-4 lg:px-6 py-4 sm:py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 min-w-[100px] sm:min-w-[80px]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each users as user (user.id)}
              <tr class="hover:bg-gray-50 cursor-pointer border-b border-gray-200" onclick={() => handleRowClick(user)}>
                <!-- User Cell -->
                <td class="px-3 sm:px-6 py-4 border-r border-gray-200">
                  <div class="flex items-center">
                    <!-- User Avatar/Logo -->
                    <div class="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 mr-2 sm:mr-3">
                      {#if user.logo_url}
                        <img 
                          src={user.logo_url} 
                          alt="Profile" 
                          class="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                          onerror={(e) => {
                            // Fallback to icon if image fails to load
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling.style.display = 'flex';
                          }}
                        />
                        <!-- Fallback icon -->
                        <div class="hidden h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gray-300 items-center justify-center">
                          <svg class="h-4 w-4 sm:h-6 sm:w-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                          </svg>
                        </div>
                      {:else}
                        <div class="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <svg class="h-4 w-4 sm:h-6 sm:w-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                          </svg>
                        </div>
                      {/if}
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="text-sm font-medium text-gray-900 truncate" title={user.username}>
                        {user.username.length > 30 ? user.username.substring(0, 30) + '...' : user.username}
                      </div>
                      {#if user.name_mentri}
                        <div class="text-xs text-gray-500 truncate" title={user.name_mentri}>
                          {user.name_mentri.length > 35 ? user.name_mentri.substring(0, 35) + '...' : user.name_mentri}
                        </div>
                      {/if}
                      {#if user.contact_person}
                        <div class="text-xs text-gray-400 truncate" title={user.contact_person}>
                          📞 {user.contact_person.length > 25 ? user.contact_person.substring(0, 25) + '...' : user.contact_person}
                        </div>
                      {/if}
                      <!-- Mobile: Show role and category -->
                      <div class="md:hidden text-xs text-gray-400 mt-1 space-x-2">
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 {user.roleColor}">
                          {user.role}
                        </span>
                        {#if user.category_name}
                          <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {user.category_name}
                          </span>
                        {/if}
                      </div>
                    </div>
                  </div>
                </td>
                <!-- Role Cell (Desktop only) -->
                <td class="hidden md:table-cell px-6 py-4 whitespace-nowrap border-r border-gray-200">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 {user.roleColor}">
                    {user.role}
                  </span>
                </td>
                <!-- Category Cell (Large screens only) -->
                <td class="hidden lg:table-cell px-6 py-4 whitespace-nowrap border-r border-gray-200">
                  {#if user.category_name}
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {user.category_name}
                    </span>
                  {:else}
                    <span class="text-gray-400 text-sm">No Category</span>
                  {/if}
                </td>
                <!-- Contact Person Cell (Small screens and up) -->
                <td class="hidden sm:table-cell px-3 sm:px-6 py-4 whitespace-nowrap border-r border-gray-200">
                  {#if user.contact_person}
                    <div class="text-sm text-gray-900 flex items-center">
                      <svg class="w-4 h-4 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {user.contact_person}
                    </div>
                  {:else}
                    <span class="text-gray-400 text-sm">No Contact</span>
                  {/if}
                </td>
                <!-- Created At Cell (Small screens and up) -->
                <td class="hidden sm:table-cell px-3 sm:px-6 py-4 text-sm text-gray-900 border-r border-gray-200">
                  <div class="sm:whitespace-nowrap">
                    <div class="font-medium">{formatDate(user.created_at).split(' ')[0]}</div>
                    <div class="text-xs text-gray-500 hidden lg:block">{formatDate(user.created_at).split(' ')[1]}</div>
                  </div>
                </td>
                <!-- Actions Cell -->
                <td class="px-3 sm:px-6 py-4 text-sm font-medium">
                  <div class="flex items-center justify-center" onclick={(e) => e.stopPropagation()}>
                    <!-- Delete Button -->
                    <div class="relative group">
                      <button class="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors" onclick={() => handleDelete(user)} aria-label="Delete user">
                        <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      <div class="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                        Delete
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Empty State -->
    {#if users.length === 0}
      <div class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No users found</h3>
        <p class="mt-1 text-sm text-gray-500">
          {searchTerm ? "Try adjusting your search terms." : "Get started by adding some users."}
        </p>
      </div>
    {/if}

    <!-- Pagination -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6 pt-4 border-t border-gray-200 bg-white sticky bottom-0 z-10">
      <!-- Results Info -->
      <div class="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
        <!-- Debug: Let's see what values are being used -->
        {#if totalRecords === 0}
          <span class="text-red-500">🚨 DEBUG: totalRecords={totalRecords}, currentPage={currentPage}, pageSize={pageSize}</span>
        {:else}
          <span class="hidden sm:inline">Showing </span>
          <span class="font-medium">{Math.min((currentPage - 1) * pageSize + 1, totalRecords)}</span>
          <span class="hidden sm:inline"> to </span>
          <span class="sm:hidden">-</span>
          <span class="font-medium">{Math.min(currentPage * pageSize, totalRecords)}</span>
          <span class="hidden sm:inline"> of </span>
          <span class="sm:hidden">/</span>
          <span class="font-medium">{totalRecords}</span>
          <span class="hidden sm:inline"> results</span>
          {#if searchTerm.trim()}
            <span class="text-gray-500 block sm:inline"> (filtered)</span>
          {/if}
        {/if}
      </div>

      <!-- Pagination Controls -->
      <div class="flex items-center justify-center space-x-1 sm:space-x-2">
        <!-- Mobile: Simplified pagination -->
        <div class="flex sm:hidden items-center space-x-2">
          <button onclick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} class="px-3 py-1 text-sm text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
            ←
          </button>
          <span class="px-3 py-1 text-sm text-white bg-blue-600 border border-blue-600 rounded-md">
            {currentPage}/{totalPages}
          </span>
          <button onclick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages} class="px-3 py-1 text-sm text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
            →
          </button>
        </div>

        <!-- Desktop: Full pagination -->
        <div class="hidden sm:flex items-center space-x-2">
          <button onclick={() => handlePageChange(1)} disabled={currentPage === 1} class="px-3 py-1 text-sm text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
            First
          </button>
          <button onclick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} class="px-3 py-1 text-sm text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
            Previous
          </button>
          <span class="px-3 py-1 text-sm text-white bg-blue-600 border border-blue-600 rounded-md">
            {currentPage} of {Math.max(1, totalPages)}
          </span>
          <button onclick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages} class="px-3 py-1 text-sm text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
            Next
          </button>
          <button onclick={() => handlePageChange(totalPages)} disabled={currentPage >= totalPages} class="px-3 py-1 text-sm text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
            Last
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<!-- Delete Confirmation Modal -->
<ConfirmationModal
  isOpen={showDeleteModal}
  title="Delete User"
  message={`Are you sure you want to delete user "${userToDelete?.username}"? This action cannot be undone.`}
  confirmText="Delete"
  cancelText="Cancel"
  confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
  onConfirm={confirmDelete}
  onCancel={cancelDelete}
  isLoading={isDeleting}
/>