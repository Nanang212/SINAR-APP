<script lang="ts">
  import { onMount } from "svelte";
  import {
    userService,
    type User as ApiUser,
    type GetUsersParams,
  } from "@/lib/services/users/user.service";
  import ConfirmationModal from '@/lib/components/ui/ConfirmationModal.svelte';
  import { modalToastStore } from '@/lib/stores/modal-toast';

  interface User {
    id: string;
    username: string;
    contact_person: string | null;
    name_mentri: string | null;
    category?: {
      id: number;
      name: string;
    } | null;
    role?: {
      id: number;
      name: string;
    } | null;
    created_at: string;
    iconColor: string;
  }

  interface $$Props {
    fetchOnMount?: boolean;
    onDelete?: (user: User) => void;
    onRowClick?: (user: ApiUser) => void;
    onDetail?: (user: ApiUser) => void;
    searchTerm?: string;
    sortOrder?: 'asc' | 'desc';
  }

  let {
    fetchOnMount = false,
    onDelete,
    onRowClick,
    onDetail,
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
        contact_person: apiUser.contact_person || null,
        name_mentri: apiUser.name_mentri || null,
        category: apiUser.category || null,
        role: apiUser.role || null,
        created_at: apiUser.created_at,
        iconColor: getIconColorForUser(apiUser.username),
      };
    } catch (error) {
      console.error("Error transforming user:", error, apiUser);
      return {
        id: apiUser.id?.toString() || "unknown",
        username: "Error loading user",
        contact_person: null,
        name_mentri: null,
        category: null,
        created_at: new Date().toISOString(),
        iconColor: "text-gray-500",
      };
    }
  }

  // Get icon color based on username
  function getIconColorForUser(username: string | undefined): string {
    const colors = [
      "text-blue-500",
      "text-green-500", 
      "text-purple-500",
      "text-pink-500",
      "text-yellow-500",
      "text-indigo-500",
      "text-red-500",
      "text-orange-500"
    ];
    
    // Generate consistent color based on username
    const safeUsername = username || "default";
    const hash = safeUsername.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
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
        console.log("🔍 RESPONSE ANALYSIS:");
        console.log("- Full response structure:", response);
        console.log("- response.data is array?", Array.isArray(response.data));
        console.log("- response.data.data exists?", !!response.data?.data);
        console.log("- response.total:", response.total);
        console.log("- current pageSize:", pageSize);
        
        // Handle both direct array and nested object response structures (like DocumentTable)
        let usersData: ApiUser[] = [];
        let total = 0;
        
        if (Array.isArray(response.data)) {
          console.log("📊 Using DIRECT ARRAY response");
          usersData = response.data;
          total = response.total || response.data.length;
          totalPages = Math.ceil(total / pageSize);
          console.log("- usersData.length:", usersData.length);
          console.log("- total assigned:", total);
          console.log("- totalPages calculated:", totalPages);
        } else if (response.data.data && Array.isArray(response.data.data)) {
          console.log("📊 Using NESTED OBJECT response");
          usersData = response.data.data;
          total = response.data.total || 0;
          totalPages = Math.ceil(total / pageSize);
          console.log("- usersData.length:", usersData.length);
          console.log("- total assigned:", total);
          console.log("- totalPages calculated:", totalPages);
        } else {
          console.log("❌ UNKNOWN response structure!");
        }

        console.log("Processing", usersData.length, "users...");
        apiUsers = usersData;
        users = usersData.map(transformApiUser);
        totalRecords = total;
        
        console.log("🧮 Pagination calculation:");
        console.log("- totalRecords:", totalRecords);
        console.log("- pageSize:", pageSize);
        console.log("- totalPages calculated:", totalPages);
        console.log("- currentPage:", currentPage);
        console.log("- Math.ceil(totalRecords / pageSize):", Math.ceil(totalRecords / pageSize));
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
      console.error("❌ Fetch Error:", err);
      console.error("❌ Error details:", JSON.stringify(err, null, 2));
    } finally {
      isLoading = false;
      console.log("✅ fetchUsers completed, isLoading:", isLoading);
      console.log("✅ Final users count:", users.length);
      console.log("✅ Final error state:", error);
    }
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

  // Modal state
  let showDeleteModal = $state(false);
  let userToDelete = $state<User | null>(null);
  let isDeleting = $state(false);
  
  // Detail modal state
  let showDetailModal = $state(false);
  let userToShowDetail = $state<ApiUser | null>(null);
  let showImagePreview = $state(false);
  let previewImageUrl = $state<string>('');
  let authorizedImageUrl = $state<string>('');

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
      const response = await userService.deleteUser(parseInt(userToDelete.id));
      
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

  async function handleDetail(user: User) {
    // Find the corresponding API user
    const apiUser = apiUsers.find(apiUser => apiUser.id.toString() === user.id);
    if (apiUser) {
      userToShowDetail = apiUser;
      
      // Load authorized image URL if user has profile picture
      if (apiUser.logo_url || apiUser.logo || apiUser.profile_picture) {
        try {
          const blobUrl = await userService.getUserProfilePhotoUrl(apiUser.id);
          if (blobUrl) {
            authorizedImageUrl = blobUrl;
          }
        } catch (error) {
          console.error('Failed to load profile image:', error);
          authorizedImageUrl = '';
        }
      } else {
        authorizedImageUrl = '';
      }
      
      showDetailModal = true;
      // Also call parent onDetail if provided
      onDetail?.(apiUser);
    }
  }

  function closeDetailModal() {
    showDetailModal = false;
    userToShowDetail = null;
    // Clean up authorized image URL to prevent memory leaks
    if (authorizedImageUrl) {
      userService.revokeProfilePhotoUrl(authorizedImageUrl);
      authorizedImageUrl = '';
    }
  }

  function showImagePreviewModal(imageUrl: string) {
    console.log('Opening image preview for:', imageUrl);
    previewImageUrl = imageUrl;
    showImagePreview = true;
    console.log('showImagePreview state:', showImagePreview);
    console.log('previewImageUrl state:', previewImageUrl);
    
    // Focus on the modal after it opens for proper keyboard navigation
    setTimeout(() => {
      const modal = document.querySelector('[role="dialog"][aria-label="Image preview"]') as HTMLElement;
      if (modal) {
        modal.focus();
        console.log('Modal focused');
      } else {
        console.log('Modal not found for focus');
      }
    }, 100);
  }

  function closeImagePreview() {
    showImagePreview = false;
    previewImageUrl = '';
  }

  // Handle ESC key for image preview
  function handleImagePreviewKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeImagePreview();
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
              <th class="px-3 sm:px-4 lg:px-6 py-4 sm:py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-r border-gray-200 min-w-[250px] sm:min-w-[200px]">
                User
              </th>
              <!-- Category Column (Hidden on mobile) -->
              <th class="hidden md:table-cell px-3 sm:px-4 lg:px-6 py-4 sm:py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-r border-gray-200 min-w-[150px] sm:min-w-[120px]">
                Category
              </th>
              <!-- Role Column (Hidden on small screens) -->
              <th class="hidden lg:table-cell px-3 sm:px-4 lg:px-6 py-4 sm:py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-r border-gray-200 min-w-[100px] sm:min-w-[80px]">
                Role
              </th>
              <!-- Contact Person Column (Hidden on small screens) -->
              <th class="hidden xl:table-cell px-3 sm:px-4 lg:px-6 py-4 sm:py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-r border-gray-200 min-w-[130px] sm:min-w-[100px]">
                Contact Person
              </th>
              <!-- Created Date Column (Hidden on small screens) -->
              <th class="hidden sm:table-cell px-3 sm:px-4 lg:px-6 py-4 sm:py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-r border-gray-200 min-w-[170px] sm:min-w-[140px]">
                Created Date
              </th>
              <!-- Actions Column -->
              <th class="px-3 sm:px-4 lg:px-6 py-4 sm:py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 min-w-[130px] sm:min-w-[90px]">
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
                    <svg class="h-6 w-6 sm:h-8 sm:w-8 {user.iconColor} mr-2 sm:mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                    </svg>
                    <div class="min-w-0 flex-1">
                      <div class="text-sm font-medium text-gray-900 truncate" title={user.username}>
                        {user.username}
                      </div>
                      <!-- Mobile: Show category and date info -->
                      <div class="md:hidden text-xs text-gray-400 mt-1">
                        {user.category?.name || 'No category'} • {formatDate(user.created_at).split(' ')[0]}
                      </div>
                    </div>
                  </div>
                </td>
                <!-- Category Cell (Desktop only) -->
                <td class="hidden md:table-cell px-6 py-4 whitespace-nowrap border-r border-gray-200">
                  <div class="text-sm text-gray-900">{user.category?.name || 'No category'}</div>
                </td>
                <!-- Role Cell (Large screens only) -->
                <td class="hidden lg:table-cell px-6 py-4 whitespace-nowrap border-r border-gray-200">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {user.role?.name === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}">
                    {user.role?.name || 'user'}
                  </span>
                </td>
                <!-- Contact Person Cell (XL screens only) -->
                <td class="hidden xl:table-cell px-6 py-4 whitespace-nowrap border-r border-gray-200">
                  <span class="text-sm text-gray-900">
                    {user.contact_person || '-'}
                  </span>
                </td>
                <!-- Created Date Cell (Small screens and up) -->
                <td class="hidden sm:table-cell px-3 sm:px-6 py-4 text-sm text-gray-900 border-r border-gray-200">
                  <div class="sm:whitespace-nowrap">
                    <div class="font-medium">{formatDate(user.created_at).split(' ')[0]}</div>
                    <div class="text-xs text-gray-500 hidden lg:block">{formatDate(user.created_at).split(' ')[1]}</div>
                  </div>
                </td>
                <!-- Actions Cell -->
                <td class="px-3 sm:px-6 py-4 text-sm font-medium">
                  <div class="flex items-center justify-center space-x-1 sm:space-x-2" onclick={(e) => e.stopPropagation()}>
                    <!-- Detail Button -->
                    <div class="relative group">
                      <button class="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors" onclick={() => handleDetail(user)} aria-label="View user details">
                        <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                      <div class="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                        Detail
                      </div>
                    </div>
                    
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
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
  message={`Are you sure you want to delete "${userToDelete?.username}"? This action cannot be undone.`}
  confirmText="Delete"
  cancelText="Cancel"
  confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
  onConfirm={confirmDelete}
  onCancel={cancelDelete}
  isLoading={isDeleting}
/>

<!-- User Detail Modal -->
{#if showDetailModal && userToShowDetail}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4" onclick={closeDetailModal}>
    <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl" onclick={(e) => e.stopPropagation()}>
      <!-- Modal Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div class="flex items-center space-x-4">
          {#if authorizedImageUrl}
            <div class="relative">
              <img 
                src={authorizedImageUrl} 
                alt="Profile image" 
                role="button"
                tabindex="0"
                aria-label="Click to preview profile image"
                class="h-12 w-12 object-cover rounded-full border-2 border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onclick={() => showImagePreviewModal(authorizedImageUrl)}
                onkeydown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    showImagePreviewModal(authorizedImageUrl);
                  }
                }}
                onerror={(e) => {
                  e.currentTarget.style.display = 'none';
                  const nextElement = e.currentTarget.nextElementSibling;
                  if (nextElement) nextElement.style.display = 'flex';
                }}
              />
              <!-- Fallback icon in header if image fails -->
              <div class="h-12 w-12 bg-gray-100 rounded-full border-2 border-gray-200 shadow-sm flex items-center justify-center hidden">
                <svg class="h-6 w-6 {getIconColorForUser(userToShowDetail.username)}" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>
          {:else}
            <div class="h-12 w-12 bg-gray-100 rounded-full border-2 border-gray-200 shadow-sm flex items-center justify-center">
              <svg class="h-6 w-6 {getIconColorForUser(userToShowDetail.username)}" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
              </svg>
            </div>
          {/if}
          <div>
            <h2 class="text-xl font-semibold text-gray-900">User Details</h2>
            <p class="text-sm text-gray-500">{userToShowDetail.username}</p>
          </div>
        </div>
        <button onclick={closeDetailModal} class="text-gray-400 hover:text-gray-600 transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Modal Body -->
      <div class="px-6 py-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Basic Information -->
          <div class="space-y-4">
            <h3 class="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Basic Information</h3>
            
            <div>
              <label class="block text-sm font-medium text-gray-500">Username</label>
              <p class="mt-1 text-sm text-gray-900">{userToShowDetail.username || '-'}</p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-500">Role</label>
              <p class="mt-1">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {userToShowDetail.role?.name === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}">
                  {userToShowDetail.role?.name || 'user'}
                </span>
              </p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-500">Category</label>
              <p class="mt-1 text-sm text-gray-900">{userToShowDetail.category?.name || 'No category assigned'}</p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-500">Status</label>
              <p class="mt-1">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {userToShowDetail.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                  {userToShowDetail.is_active ? 'Active' : 'Inactive'}
                </span>
              </p>
            </div>
          </div>

          <!-- Additional Information -->
          <div class="space-y-4">
            <h3 class="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Additional Information</h3>
            
            <div>
              <label class="block text-sm font-medium text-gray-500">Contact Person</label>
              <p class="mt-1 text-sm text-gray-900">{userToShowDetail.contact_person || '-'}</p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-500">Name Mentri</label>
              <p class="mt-1 text-sm text-gray-900">{userToShowDetail.name_mentri || '-'}</p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-500">Created Date</label>
              <p class="mt-1 text-sm text-gray-900">{formatDate(userToShowDetail.created_at)}</p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-500">Last Updated</label>
              <p class="mt-1 text-sm text-gray-900">{formatDate(userToShowDetail.updated_at || userToShowDetail.created_at)}</p>
            </div>
          </div>
        </div>

        <!-- Profile Image/Logo -->
        <div class="mt-6 pt-6 border-t border-gray-200">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Profile Image</h3>
          <div class="flex justify-center">
            {#if authorizedImageUrl}
              <div class="relative group">
                <img 
                  src={authorizedImageUrl} 
                  alt="Profile image" 
                  role="button"
                  tabindex="0"
                  aria-label="Click to preview profile image"
                  class="w-32 h-32 object-cover rounded-full border-4 border-gray-200 shadow-md cursor-pointer hover:shadow-lg transition-all duration-200 group-hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-offset-2"
                  onclick={() => showImagePreviewModal(authorizedImageUrl)}
                  onkeydown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      showImagePreviewModal(authorizedImageUrl);
                    }
                  }}
                  onerror={(e) => {
                    e.currentTarget.style.display = 'none';
                    const nextElement = e.currentTarget.nextElementSibling?.nextElementSibling;
                    if (nextElement) nextElement.style.display = 'flex';
                  }}
                />
                <!-- Hover overlay -->
                <div 
                  class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-full transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer" 
                  role="button"
                  tabindex="0"
                  onclick={() => showImagePreviewModal(authorizedImageUrl)}
                  onkeydown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      showImagePreviewModal(authorizedImageUrl);
                    }
                  }}
                  aria-label="Preview profile image"
                >
                  <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
                <!-- Fallback icon if image fails to load -->
                <div class="w-32 h-32 bg-gray-100 rounded-full border-4 border-gray-200 shadow-md items-center justify-center hidden">
                  <svg class="w-16 h-16 {getIconColorForUser(userToShowDetail.username)}" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                  </svg>
                </div>
              </div>
            {:else}
              <!-- Default user icon when no image is available -->
              <div class="w-32 h-32 bg-gray-100 rounded-full border-4 border-gray-200 shadow-md flex items-center justify-center">
                <svg class="w-16 h-16 {getIconColorForUser(userToShowDetail.username)}" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                </svg>
              </div>
            {/if}
          </div>
          
          <!-- Image info -->
          {#if authorizedImageUrl}
            <div class="text-center mt-2">
              <p class="text-xs text-gray-500">User profile image</p>
              <p class="text-xs text-gray-400 mt-1">Click image to preview</p>
            </div>
          {:else}
            <div class="text-center mt-2">
              <p class="text-xs text-gray-500">No profile image uploaded</p>
            </div>
          {/if}
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div class="flex justify-end">
          <button onclick={closeDetailModal} class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Image Preview Modal -->
{#if showImagePreview && previewImageUrl}
  
  <div 
    class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4" 
    style="z-index: 999999;"
    onclick={closeImagePreview}
    onkeydown={handleImagePreviewKeydown}
    tabindex="-1"
    role="dialog"
    aria-modal="true"
    aria-label="Image preview"
  >
    <div class="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center" onclick={(e) => e.stopPropagation()}>
      <!-- Close button -->
      <button 
        onclick={closeImagePreview} 
        class="absolute top-4 right-4 z-10 text-white hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full p-2"
        aria-label="Close image preview"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      <!-- Image -->
      <img 
        src={previewImageUrl} 
        alt="Profile image preview" 
        class="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
        onclick={(e) => e.stopPropagation()}
        onload={() => console.log('Preview image loaded successfully')}
        onerror={(e) => console.error('Preview image failed to load:', e)}
      />
      
      <!-- Image info overlay -->
      <div class="absolute bottom-4 left-4 right-4 text-center">
        <div class="bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg inline-block">
          <p class="text-sm">
            {#if userToShowDetail?.username}
              {userToShowDetail.username}'s profile image
            {:else}
              Profile image
            {/if}
          </p>
          <p class="text-xs text-gray-300 mt-1">Click outside or press ESC to close</p>
        </div>
      </div>
    </div>
  </div>
{/if}


