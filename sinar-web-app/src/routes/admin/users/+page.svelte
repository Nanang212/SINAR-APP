<script lang="ts">
  import { onMount } from "svelte";
  import { LoadingAuthGuard } from "$lib/utils";
  import { Loading } from "$lib";
  import { DashboardLayout } from "$lib";
  import { UserTabs, UserTable, UserForm } from "@/lib/components/admin/users";
  import type { User, CreateUserRequest, UpdateUserRequest } from "@/lib/services/users/user.service";
  import { userService } from "@/lib/services";

  let hasAccess = $state(false);
  let showRedirectLoading = $state(false);

  onMount(async () => {
    // Guard admin page with loading - redirect if not authenticated or not admin
    const access = await LoadingAuthGuard.guardAdminPage((loading) => {
      showRedirectLoading = loading;
    });
    hasAccess = access;
  });

  // Component state
  let activeTab = $state("input");
  let searchTerm = $state("");
  let isLoading = $state(false);
  let selectedUser = $state<User | null>(null);

  // Table reference
  let userTableRef: any;

  // Tab change handler
  function handleTabChange(tab: string) {
    console.log('Page: Tab changed to:', tab);
    activeTab = tab;
    selectedUser = null; // Clear selection when changing tabs
    
    // Fetch users when switching to browse tab
    if (tab === "browse" && userTableRef) {
      console.log('Loading users...');
      userTableRef.loadUsers();
    }
  }

  // Search handler
  function handleSearch(term: string) {
    console.log('Page: Search term:', term);
    searchTerm = term;
    if (userTableRef) {
      userTableRef.setSearchTerm(term);
    }
  }

  // Refresh handler
  async function handleRefresh() {
    console.log('Page: Refreshing users...');
    isLoading = true;
    if (userTableRef) {
      userTableRef.loadUsers().finally(() => {
        isLoading = false;
      });
    }
  }

  // User row click handler
  function handleUserRowClick(user: User) {
    console.log('Page: User row clicked:', user);
    selectedUser = user;
    activeTab = "input"; // Switch to form tab for editing
  }

  // User delete handler
  async function handleUserDelete(user: any) {
    console.log('Page: Delete user requested:', user);
    
    const confirmed = confirm(`Are you sure you want to delete user "${user.username}"?`);
    if (!confirmed) return;

    isLoading = true;
    try {
      const response = await userService.deleteUser(user.id);
      
      if (response.status) {
        console.log('User deleted successfully');
        // Refresh the table
        if (userTableRef) {
          await userTableRef.loadUsers();
        }
      } else {
        console.error('Failed to delete user:', response.message);
        alert(`Failed to delete user: ${response.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('An error occurred while deleting the user');
    } finally {
      isLoading = false;
    }
  }

  // Form reset handler
  function handleReset() {
    console.log('Page: Form reset');
    // Clear selected user when form is reset
    selectedUser = null;
    // Refresh user table
    if (userTableRef) {
      userTableRef.loadUsers();
    }
  }

  // Form submit handler - NO API CALLS HERE!
  function handleFormSubmit() {
    console.log('✅ REGULAR USERS PAGE - FIXED: Only handling UI state');
    
    // UserForm already handled the API call successfully
    // This function ONLY handles UI state changes
    
    selectedUser = null;
    activeTab = "browse";
    
    if (userTableRef) {
      userTableRef.loadUsers();
    }
  }

</script>

<svelte:head>
  <title>Master User - Admin Panel</title>
</svelte:head>

<DashboardLayout>
  {#if hasAccess}
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 relative" style="height: calc(100vh - 150px);">
      <!-- Gradient line at top -->
      <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 z-10 rounded-t-lg"></div>
      
      <!-- Fixed Header and Tabs -->
      <div class="absolute top-1 left-0 right-0 bg-white z-20 border-b border-gray-200 shadow-sm">
        <div class="px-6 pt-5 pb-4">
          <UserTabs 
            {activeTab} 
            onTabChange={handleTabChange}
            onSearch={handleSearch}
            onRefresh={handleRefresh}
            {searchTerm}
            {isLoading}
          />
        </div>
      </div>
      
      <!-- Tab Content -->
      <div class="absolute inset-0 pt-[100px] overflow-y-auto overflow-x-hidden">
        {#if activeTab === "input"}
          <UserForm 
            userData={selectedUser}
            onSubmit={handleFormSubmit}
            onReset={handleReset}
          />
        {:else if activeTab === "browse"}
          <UserTable 
            bind:this={userTableRef}
            fetchOnMount={true}
            onDelete={handleUserDelete}
            onRefresh={() => console.log('Users refreshed')}
            onRowClick={handleUserRowClick}
          />
        {/if}
      </div>
    </div>
  {/if}
</DashboardLayout>

<!-- Redirect loading overlay -->
{#if showRedirectLoading}
  <Loading overlay={true} text="Redirecting..." />
{/if}