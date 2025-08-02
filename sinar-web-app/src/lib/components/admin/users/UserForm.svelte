<script lang="ts">
  import { onMount } from 'svelte';
  import { userService, categoryService, type User, type CreateUserRequest, type UpdateUserRequest, type Category } from '$lib/services';
  import Loading from '$lib/components/ui/loading.svelte';
  import { toastStore } from '$lib/stores/toast';
  import { modalToastStore } from '$lib/stores/modal-toast';

  interface $$Props {
    onSubmit?: () => void;
    onReset?: () => void;
    userData?: User | null;
  }

  let { onSubmit, onReset, userData }: $$Props = $props();

  // Form state
  let formRef: HTMLDivElement;
  let isSubmitting = $state(false);
  let isFormDisabled = $state(false);
  let categories: Category[] = $state([]);
  let categoriesLoading = $state(true);
  let selectedCategoryId = $state<string>('');
  let isCategoryDropdownOpen = $state(false);
  let selectedRoleId = $state<string>('2'); // Default to user role
  let isRoleDropdownOpen = $state(false);
  
  // Check if we're in edit mode
  const isEditMode = $derived(userData !== null);

  // Role options with IDs (sesuai dengan backend)
  const roleOptions = [
    { id: 1, name: 'admin' },
    { id: 2, name: 'user' }
  ];

  // Load categories on mount
  onMount(async () => {
    await loadCategories();
  });

  // Load user data into form when provided
  $effect(() => {
    if (userData && formRef) {
      populateForm(userData);
    }
  });

  async function loadCategories() {
    categoriesLoading = true;
    try {
      const response = await categoryService.getAllCategories();
      if (response.status && response.data) {
        categories = response.data;
      } else {
        console.error('Failed to load categories:', response.message);
        categories = [];
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      categories = [];
    } finally {
      categoriesLoading = false;
    }
  }

  function populateForm(user: User) {
    const form = formRef;
    if (!form) return;

    // Populate basic fields
    (form.querySelector('#username') as HTMLInputElement).value = user.username || '';
    
    // Populate role - map role name to role_id
    if (user.role === 'admin') {
      selectedRoleId = '1';
    } else {
      selectedRoleId = '2'; // default to user
    }
    
    // Populate category
    selectedCategoryId = user.category_id ? user.category_id.toString() : '';
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      console.log('Enter key pressed, preventing form submission');
      event.preventDefault();
      event.stopPropagation();
      // Optionally trigger form submit manually
      // handleFormSubmit();
    }
  }

  async function handleFormSubmit() {
    if (isSubmitting) {
      console.log('Already submitting, ignoring duplicate submission');
      return;
    }
    
    // Get form values manually since we're not using a form element
    const formData = {
      username: (formRef.querySelector('#username') as HTMLInputElement)?.value || '',
      password: (formRef.querySelector('#password') as HTMLInputElement)?.value || '',
      is_active: true, // Default active for now
    };
    console.log('Form data:', formData);

    // Start loading and disable form
    isSubmitting = true;
    isFormDisabled = true;

    try {
      // Add delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (isEditMode && userData) {
        // Update existing user
        const updateData: UpdateUserRequest = {
          username: formData.username,
          role_id: parseInt(selectedRoleId),
          category_id: selectedCategoryId ? parseInt(selectedCategoryId) : null,
          is_active: formData.is_active,
        };

        console.log('Update data:', updateData);

        const result = await userService.updateUser(userData.id, updateData);
        if (result.status) {
          console.log('User updated successfully:', result.data);
          modalToastStore.success('User updated successfully!');
          // Call parent onSubmit callback if provided (after success)
          onSubmit?.();
          // Refresh the user data
          await refreshUserData();
        } else {
          console.error('Update failed:', result.message);
          modalToastStore.error(result.message || 'Failed to update user');
          isFormDisabled = false; // Re-enable form on error
        }
      } else {
        // Create new user
        const createData: CreateUserRequest = {
          username: formData.username,
          password: formData.password,
          role_id: parseInt(selectedRoleId),
          category_id: selectedCategoryId ? parseInt(selectedCategoryId) : null,
        };

        const result = await userService.createUser(createData);
        if (result.status) {
          console.log('User created successfully:', result.data);
          modalToastStore.success('User created successfully!');
          // For create user, don't call onSubmit to avoid tab switching
          // Just keep form disabled and data visible for review
          // Keep form disabled and data visible
        } else {
          console.error('Create failed:', result.message);
          modalToastStore.error(result.message || 'Failed to create user');
          isFormDisabled = false; // Re-enable form on error
        }
      }
    } catch (error) {
      console.error('Submit error:', error);
      modalToastStore.error('An unexpected error occurred');
      isFormDisabled = false; // Re-enable form on error
    } finally {
      isSubmitting = false;
    }
  }

  function handleReset() {
    selectedCategoryId = '';
    selectedRoleId = '2'; // Reset to default user role
    isCategoryDropdownOpen = false;
    isRoleDropdownOpen = false;
    isFormDisabled = false;
    
    // Reset form inputs manually
    const usernameInput = formRef?.querySelector('#username') as HTMLInputElement;
    const passwordInput = formRef?.querySelector('#password') as HTMLInputElement;
    
    if (usernameInput) usernameInput.value = '';
    if (passwordInput) passwordInput.value = '';
    
    onReset?.();
  }

  // Category dropdown functions
  function toggleCategoryDropdown() {
    isCategoryDropdownOpen = !isCategoryDropdownOpen;
  }

  function closeCategoryDropdown() {
    isCategoryDropdownOpen = false;
  }

  function selectCategory(categoryId: string, categoryName: string) {
    selectedCategoryId = categoryId;
    closeCategoryDropdown();
  }

  // Role dropdown functions
  function toggleRoleDropdown() {
    isRoleDropdownOpen = !isRoleDropdownOpen;
  }

  function closeRoleDropdown() {
    isRoleDropdownOpen = false;
  }

  function selectRole(roleId: string, roleName: string) {
    selectedRoleId = roleId;
    closeRoleDropdown();
  }

  // Reset password function  
  let showPasswordModal = $state(false);
  let newPasswordInput = $state('');
  
  async function handleResetPassword() {
    if (!userData) return;
    showPasswordModal = true;
    newPasswordInput = '';
  }
  
  function closePasswordModal() {
    showPasswordModal = false;
    newPasswordInput = '';
  }
  
  async function confirmResetPassword() {
    if (!newPasswordInput || !newPasswordInput.trim()) {
      modalToastStore.error('Please enter a new password');
      return;
    }
    
    if (newPasswordInput.length < 6) {
      modalToastStore.error('Password must be at least 6 characters long');
      return;
    }
    
    isSubmitting = true;
    try {
      const result = await userService.resetPassword(userData!.id, {
        new_password: newPasswordInput
      });
      
      if (result.status) {
        modalToastStore.success('Password reset successfully!');
        closePasswordModal();
      } else {
        modalToastStore.error(result.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      modalToastStore.error('An error occurred while resetting password');
    } finally {
      isSubmitting = false;
    }
  }

  // Close dropdown when clicking outside
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    
    // Check category dropdown
    const categoryDropdown = document.getElementById('user-category-dropdown');
    const categoryButton = document.getElementById('user-category-dropdown-button');
    
    if (categoryDropdown && categoryButton && !categoryDropdown.contains(target) && !categoryButton.contains(target)) {
      closeCategoryDropdown();
    }
    
    // Check role dropdown
    const roleDropdown = document.getElementById('user-role-dropdown');
    const roleButton = document.getElementById('user-role-dropdown-button');
    
    if (roleDropdown && roleButton && !roleDropdown.contains(target) && !roleButton.contains(target)) {
      closeRoleDropdown();
    }
  }

  // Add click outside listener
  onMount(() => {
    const handleClick = (event: MouseEvent) => handleClickOutside(event);
    document.addEventListener('click', handleClick);
    
    return () => {
      document.removeEventListener('click', handleClick);
    };
  });

  // Get selected category for display
  function getSelectedCategoryText(): string {
    if (!selectedCategoryId) {
      return 'Select Category (Optional)';
    }
    
    const category = categories.find(cat => cat.id.toString() === selectedCategoryId);
    return category ? category.name : 'Select Category (Optional)';
  }

  // Get selected role for display
  function getSelectedRoleText(): string {
    const role = roleOptions.find(r => r.id.toString() === selectedRoleId);
    return role ? role.name : 'Select Role';
  }

  async function refreshUserData() {
    if (isEditMode && userData) {
      try {
        // You might need to implement a getUserById method in your service
        // For now, we'll just keep the current data
        console.log('User data refreshed');
      } catch (error) {
        console.error('Failed to refresh user data:', error);
      }
    }
  }
</script>

<div class="p-6 relative">
  <!-- Loading Overlay -->
  {#if isSubmitting}
    <Loading overlay={true} text={isEditMode ? 'Updating user...' : 'Saving user...'} />
  {/if}
  
  <div class="max-w-6xl mx-auto">
    <h2 class="text-lg font-semibold text-gray-900 mb-4">
      {isEditMode ? 'Edit User' : 'Add New User'}
    </h2>
    
    <div bind:this={formRef} class="space-y-6">
      <!-- Username -->
      <div>
        <label for="username" class="block text-sm font-medium text-gray-700 mb-2">
          Username *
        </label>
        <input
          type="text"
          id="username"
          name="username"
          required
          disabled={isFormDisabled}
          autocomplete="username"
          onkeydown={handleKeyDown}
          class="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
          placeholder="Enter username"
        />
      </div>

      <!-- Password (Only for Create Mode) -->
      {#if !isEditMode}
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
            Password *
          </label>
          <input
            type="password"
            id="password"
            name="password"
            required
            disabled={isFormDisabled}
            autocomplete="new-password"
            onkeydown={handleKeyDown}
            class="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
            placeholder="Enter password"
          />
        </div>
      {/if}

      <!-- Role (Enhanced Dropdown) -->
      <div class="relative">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Role *
        </label>
        
        <!-- Dropdown Button -->
        <button
          type="button"
          id="user-role-dropdown-button"
          class="w-full px-4 py-3 text-base text-left border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between {!selectedRoleId ? 'text-red-500 border-red-300' : 'text-gray-900'} disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
          disabled={isFormDisabled}
          onclick={!isFormDisabled ? toggleRoleDropdown : undefined}
        >
          <span class="{!selectedRoleId ? 'text-gray-500' : 'text-gray-900'}">
            {getSelectedRoleText()}
          </span>
          <svg 
            class="w-4 h-4 text-gray-400 transition-transform duration-200 {isRoleDropdownOpen ? 'transform rotate-180' : ''}" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <!-- Dropdown Content -->
        {#if isRoleDropdownOpen}
          <div 
            id="user-role-dropdown"
            class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg"
          >
            <div class="p-2">
              <!-- Role options -->
              {#each roleOptions as role (role.id)}
                <button
                  type="button"
                  class="w-full flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer text-left {selectedRoleId === role.id.toString() ? 'bg-blue-50 text-blue-600' : ''}"
                  onclick={() => selectRole(role.id.toString(), role.name)}
                >
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium text-gray-900">
                      {role.name}
                    </div>
                    <div class="text-xs text-gray-500">
                      {role.name === 'admin' ? 'Full access to all features' : 'Limited access based on category'}
                    </div>
                  </div>
                  {#if selectedRoleId === role.id.toString()}
                    <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                  {/if}
                </button>
              {/each}
            </div>
          </div>
        {/if}
        
        <!-- Hidden input for form submission -->
        <input type="hidden" name="role_id" value={selectedRoleId} />
        
        {#if !selectedRoleId}
          <p class="text-xs text-red-500 mt-1">Please select a role</p>
        {/if}
      </div>

      <!-- Category (Enhanced Dropdown) -->
      <div class="relative">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Category
        </label>
        
        {#if categoriesLoading}
          <div class="flex items-center space-x-2 p-3 border border-gray-300 rounded-md bg-gray-50">
            <svg class="w-4 h-4 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span class="text-sm text-gray-500">Loading categories...</span>
          </div>
        {:else if categories.length === 0}
          <div class="p-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-red-500">
            No categories available. Please try refreshing the page.
          </div>
        {:else}
          <!-- Dropdown Button -->
          <button
            type="button"
            id="user-category-dropdown-button"
            class="w-full px-4 py-3 text-base text-left border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between text-gray-900 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
            disabled={isFormDisabled}
            onclick={!isFormDisabled ? toggleCategoryDropdown : undefined}
          >
            <span class="{!selectedCategoryId ? 'text-gray-500' : 'text-gray-900'}">
              {getSelectedCategoryText()}
            </span>
            <svg 
              class="w-4 h-4 text-gray-400 transition-transform duration-200 {isCategoryDropdownOpen ? 'transform rotate-180' : ''}" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <!-- Dropdown Content -->
          {#if isCategoryDropdownOpen}
            <div 
              id="user-category-dropdown"
              class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
            >
              <div class="p-2">
                <!-- Clear selection option -->
                <button
                  type="button"
                  class="w-full flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer text-left {!selectedCategoryId ? 'bg-blue-50 text-blue-600' : ''}"
                  onclick={() => selectCategory('', '')}
                >
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium text-gray-500 italic">
                      No Category (Optional)
                    </div>
                  </div>
                  {#if !selectedCategoryId}
                    <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                  {/if}
                </button>
                
                <!-- Category options -->
                {#each categories as category (category.id)}
                  <button
                    type="button"
                    class="w-full flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer text-left {selectedCategoryId === category.id.toString() ? 'bg-blue-50 text-blue-600' : ''}"
                    onclick={() => selectCategory(category.id.toString(), category.name)}
                  >
                    <div class="flex-1 min-w-0">
                      <div class="text-sm font-medium text-gray-900">
                        {category.name}
                      </div>
                      {#if category.description}
                        <div class="text-xs text-gray-500 truncate">
                          {category.description}
                        </div>
                      {/if}
                    </div>
                    {#if selectedCategoryId === category.id.toString()}
                      <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                    {/if}
                  </button>
                {/each}
              </div>
            </div>
          {/if}
        {/if}
        
        <!-- Hidden input for form submission -->
        <input type="hidden" name="category_id" value={selectedCategoryId} />
      </div>


      <!-- Form Actions -->
      <div class="flex items-center justify-end space-x-4 pt-4">
        <button
          type="button"
          onclick={handleReset}
          disabled={isSubmitting}
          class="px-6 py-3 text-base font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Reset
        </button>
        
        {#if isEditMode}
          <button
            type="button"
            onclick={handleResetPassword}
            disabled={isSubmitting}
            class="px-6 py-3 text-base font-medium text-white bg-orange-600 hover:bg-orange-700 border border-transparent rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {#if isSubmitting}
              <Loading size="sm" />
              <span>Resetting...</span>
            {:else}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 12H9v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-2.172a2 2 0 01.586-1.414l8.828-8.828A6 6 0 0119 9z" />
              </svg>
              <span>Reset Password</span>
            {/if}
          </button>
        {/if}
        
        <button
          type="button"
          onclick={handleFormSubmit}
          disabled={isSubmitting}
          class="px-6 py-3 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 border border-transparent rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {#if isSubmitting}
            <Loading size="sm" />
            <span>{isEditMode ? 'Updating...' : 'Saving...'}</span>
          {:else}
            <span>{isEditMode ? 'Update User' : 'Save User'}</span>
          {/if}
        </button>
      </div>
    </div>
  </div>
</div>

<!-- Reset Password Modal -->
{#if showPasswordModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" onclick={closePasswordModal}>
    <div class="bg-white rounded-lg p-6 w-96 max-w-md mx-4 relative z-[10000]" onclick={(e) => e.stopPropagation()}>
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Reset Password</h3>
      <p class="text-sm text-gray-600 mb-4">
        Enter new password for user: <strong>{userData?.username}</strong>
      </p>
      
      <div class="mb-4">
        <label for="new-password" class="block text-sm font-medium text-gray-700 mb-2">
          New Password *
        </label>
        <input
          type="password"
          id="new-password"
          bind:value={newPasswordInput}
          autocomplete="new-password"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter new password"
          disabled={isSubmitting}
        />
      </div>
      
      <div class="flex items-center justify-end space-x-3">
        <button
          type="button"
          onclick={closePasswordModal}
          disabled={isSubmitting}
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="button"
          onclick={confirmResetPassword}
          disabled={isSubmitting}
          class="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 border border-transparent rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {#if isSubmitting}
            <Loading size="sm" />
            <span>Resetting...</span>
          {:else}
            <span>Reset Password</span>
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}