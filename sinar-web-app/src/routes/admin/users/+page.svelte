<script lang="ts">
  import { onMount } from "svelte";
  import { LoadingAuthGuard } from "$lib/utils";
  import { Loading } from "$lib";
  import { DashboardLayout } from "$lib";
  import { UserTabs, UserTable, UserForm } from "$lib/components/admin/userstwo";
  import type { User } from "@/lib/services/users/user.service";
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

  let activeTab = $state("browse");
  let userTableRef = $state<UserTable>();
  let selectedUser = $state<User | null>(null);
  let searchTerm = $state("");
  let sortOrder = $state<'asc' | 'desc'>('desc');
  let isLoading = $state(false);

  // Tab change handler
  function handleTabChange(tab: string) {
    console.log('Tab change requested:', tab);
    console.log('Current activeTab:', activeTab);
    
    // If switching from browse to input, only reset if no user is selected or create mode
    // Don't reset if we have selectedUser (edit mode) - let the user manually reset or select new data
    if (activeTab === "browse" && tab === "input") {
      console.log('Switching to input tab');
      // Only clear selectedUser if we're in create mode (no user selected)
      // For edit mode, keep the selectedUser so form maintains its state
      if (!selectedUser) {
        console.log('No selected user - clearing for create mode');
        selectedUser = null;
      } else {
        console.log('Keeping selected user for edit mode');
      }
    }
    
    activeTab = tab;
    console.log('New activeTab:', activeTab);
    
    // Fetch users when switching to browse tab
    if (tab === "browse" && userTableRef) {
      console.log('Loading users...');
      userTableRef.loadUsers();
    }
  }

  function handleSearch(term: string) {
    console.log('Page: Search term:', term);
    searchTerm = term;
    if (userTableRef) {
      userTableRef.setSearchParams(term, sortOrder);
    }
  }

  function handleSortChange(order: 'asc' | 'desc') {
    sortOrder = order;
    if (userTableRef) {
      userTableRef.setSearchParams(searchTerm, order);
    }
  }

  async function handleRefresh() {
    console.log('Page: Refreshing users...');
    isLoading = true;
    if (userTableRef) {
      userTableRef.loadUsers().finally(() => {
        isLoading = false;
      });
    }
  }

  function handleFormSubmit(data: FormData) {
    console.log('Form submitted:', data);
    // Clear selected user and switch to browse tab after successful submission
    selectedUser = null;
    activeTab = "browse";
    // Refresh user table after successful submit
    if (userTableRef) {
      userTableRef.loadUsers();
    }
  }

  function handleFormReset() {
    console.log('Form reset');
    // Clear selected user when form is reset
    selectedUser = null;
    // Refresh user table
    if (userTableRef) {
      userTableRef.loadUsers();
    }
  }

  function handleUserDelete(user: any) {
    console.log('Delete user:', user);
    // Handle user delete logic here
  }

  function handleRowClick(user: User) {
    console.log('Row clicked:', user);
    selectedUser = user;
    activeTab = "input"; // Switch to input tab
  }

  function handleUserDetail(user: User) {
    console.log('View user detail:', user);
    // Detail handler - modal will be handled by UserTable component
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
            onSortChange={handleSortChange}
            onRefresh={handleRefresh}
            {searchTerm}
            {sortOrder}
            {isLoading}
          />
        </div>
      </div>
      
      <!-- Tab Content -->
      <div class="absolute inset-0 pt-[120px] sm:pt-[130px]">
        <!-- UserForm - always rendered but hidden when not active -->
        <div class="{activeTab === 'input' ? 'block overflow-y-auto overflow-x-hidden' : 'hidden'} h-full">
          <UserForm onSubmit={handleFormSubmit} onReset={handleFormReset} userData={selectedUser} />
        </div>
        
        <!-- UserTable - always rendered but hidden when not active -->
        <div class="{activeTab === 'browse' ? 'block overflow-hidden' : 'hidden'} h-full">
          <UserTable 
            bind:this={userTableRef}
            fetchOnMount={true}
            onDelete={handleUserDelete}
            onRefresh={() => console.log('Users refreshed')}
            onRowClick={handleRowClick}
            onDetail={handleUserDetail}
            {searchTerm}
            {sortOrder}
          />
        </div>
      </div>
    </div>
  {/if}
</DashboardLayout>

<!-- Redirect loading overlay -->
{#if showRedirectLoading}
  <Loading overlay={true} text="Redirecting..." />
{/if}