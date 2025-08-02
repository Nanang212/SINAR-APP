<script lang="ts">
  import { DashboardLayout } from "$lib";
  import { UserTabs, UserTable, UserForm } from "@/lib/components/admin/users";
  import type { User, CreateUserRequest, UpdateUserRequest } from "@/lib/services/users/user.service";
  import { userService } from "@/lib/services";
  import { modalToastStore } from '$lib/stores/modal-toast';

  // Component state
  let activeTab = $state("browse");
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
    console.log('✅ FIXED VERSION: Page only handling UI state - NO API CALLS');
    console.trace('Page handleFormSubmit call stack - SHOULD NOT CALL API');
    
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
          onRefresh={() => console.log('Users refreshed')}
          onRowClick={handleUserRowClick}
        />
      {/if}
    </div>
  </div>
</DashboardLayout>