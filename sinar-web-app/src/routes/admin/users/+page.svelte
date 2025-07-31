<script lang="ts">
  import { DashboardLayout } from "$lib";
  import { UserTabs, UserTable, UserForm } from "@/lib/components/admin/users";
  import type { User, CreateUserRequest, UpdateUserRequest } from "@/lib/services/users/user.service";
  import { userService } from "@/lib/services";

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

  // Form submit handler
  async function handleFormSubmit(data: CreateUserRequest | UpdateUserRequest) {
    console.log('Page: Form submitted:', data);
    isLoading = true;
    
    try {
      let response;
      
      if (selectedUser) {
        // Update existing user
        response = await userService.updateUser(selectedUser.id, data as UpdateUserRequest);
      } else {
        // Create new user
        response = await userService.createUser(data as CreateUserRequest);
      }
      
      if (response.status) {
        console.log('User saved successfully:', response.data);
        
        // Reset form and switch to browse tab
        selectedUser = null;
        activeTab = "browse";
        
        // Refresh the table
        if (userTableRef) {
          await userTableRef.loadUsers();
        }
      } else {
        console.error('Failed to save user:', response.message);
        alert(`Failed to save user: ${response.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving user:', error);
      alert('An error occurred while saving the user');
    } finally {
      isLoading = false;
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
          onDelete={handleUserDelete}
          onRefresh={() => console.log('Users refreshed')}
          onRowClick={handleUserRowClick}
        />
      {/if}
    </div>
  </div>
</DashboardLayout>