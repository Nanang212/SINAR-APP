<script lang="ts">
  import { onMount } from 'svelte';
  import { userService, categoryService, type User, type CreateUserRequest, type UpdateUserRequest, type Category } from '$lib/services';
  import Loading from '$lib/components/ui/loading.svelte';
  import { toastStore } from '$lib/stores/toast';
  import { modalToastStore } from '$lib/stores/modal-toast';

  interface $$Props {
    onSubmit?: (data: FormData) => void;
    onReset?: () => void;
    userData?: User | null;
  }

  let { onSubmit, onReset, userData }: $$Props = $props();

  // Form state
  let selectedCategory: string = $state('');
  let selectedRole: string = $state('2'); // Default to "User" (role_id = 2)
  let formRef: HTMLFormElement;
  let categories: Category[] = $state([]);
  let categoriesLoading = $state(true);
  let selectedLogoFile = $state<File | null>(null);
  let isRoleDropdownOpen = $state(false);
  let isCategoryDropdownOpen = $state(false);
  let isSubmitting = $state(false);
  let isFormDisabled = $state(false);
  
  // Hardcoded roles
  const roles = [
    { id: 1, name: 'Admin' },
    { id: 2, name: 'User' }
  ];
  
  // Check if we're in edit mode
  const isEditMode = $derived(userData !== null);

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
    (form.querySelector('#contact_person') as HTMLInputElement).value = user.contact_person || '';
    (form.querySelector('#name_mentri') as HTMLInputElement).value = user.name_mentri || '';
    
    // Populate category and role
    selectedCategory = user.category_id?.toString() || '';
    selectedRole = user.role?.id?.toString() || '2';
  }

  function handleCategoryChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    selectedCategory = select.value;
  }

  function handleRoleSelect(roleId: string) {
    selectedRole = roleId;
    isRoleDropdownOpen = false;
    
    // If Admin is selected, clear and hide category
    if (selectedRole === '1') {
      selectedCategory = '';
    }
  }

  function handleCategorySelect(categoryId: string) {
    selectedCategory = categoryId;
    isCategoryDropdownOpen = false;
  }

  function toggleRoleDropdown() {
    if (!isFormDisabled) {
      isRoleDropdownOpen = !isRoleDropdownOpen;
      isCategoryDropdownOpen = false;
    }
  }

  function toggleCategoryDropdown() {
    if (!isFormDisabled) {
      isCategoryDropdownOpen = !isCategoryDropdownOpen;
      isRoleDropdownOpen = false;
    }
  }

  // Get name_mentri based on selected category
  function getNameMentriFromCategory(): string {
    if (!selectedCategory) return '';
    
    const category = categories.find(cat => cat.id.toString() === selectedCategory);
    return category ? category.name : '';
  }

  async function handleSubmit(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    
    // Start loading and disable form
    isSubmitting = true;
    isFormDisabled = true;

    try {
      if (isEditMode && userData) {
        // Update existing user
        const updateData: UpdateUserRequest = {
          username: formData.get('username') as string,
          role_id: parseInt(selectedRole),
          contact_person: formData.get('contact_person') as string || undefined,
          name_mentri: formData.get('name_mentri') as string || undefined,
          category_id: selectedRole === '1' ? null : (selectedCategory ? parseInt(selectedCategory) : undefined),
          logo: selectedLogoFile || undefined
        };

        const result = await userService.updateUser(userData.id, updateData);
        if (result.status) {
          console.log('User updated successfully:', result.data);
          modalToastStore.success('User updated successfully!');
        } else {
          console.error('Update failed:', result.message);
          modalToastStore.error(result.message || 'Failed to update user');
          isFormDisabled = false;
        }
      } else {
        // Create new user
        const password = formData.get('password') as string;
        if (!password) {
          modalToastStore.error('Password is required for new user');
          isSubmitting = false;
          isFormDisabled = false;
          return;
        }

        const createData: CreateUserRequest = {
          username: formData.get('username') as string,
          password: password,
          role_id: parseInt(selectedRole),
          contact_person: formData.get('contact_person') as string || undefined,
          name_mentri: formData.get('name_mentri') as string || undefined,
          category_id: selectedRole === '1' ? null : (selectedCategory ? parseInt(selectedCategory) : undefined),
          logo: selectedLogoFile || undefined
        };

        const result = await userService.createUser(createData);
        if (result.status) {
          console.log('User created successfully:', result.data);
          modalToastStore.success('User created successfully!');
        } else {
          console.error('Create failed:', result.message);
          modalToastStore.error(result.message || 'Failed to create user');
          isFormDisabled = false;
        }
      }
    } catch (error) {
      console.error('Submit error:', error);
      modalToastStore.error('An unexpected error occurred');
      isFormDisabled = false;
    } finally {
      isSubmitting = false;
    }

    // Also call parent callback if provided
    onSubmit?.(formData);
  }

  function handleReset() {
    selectedCategory = '';
    selectedRole = '2'; // Reset to "User" default
    selectedLogoFile = null;
    isRoleDropdownOpen = false;
    isCategoryDropdownOpen = false;
    isFormDisabled = false;
    formRef?.reset();
    onReset?.();
  }

  function handleFileAreaClick() {
    const fileInput = document.getElementById('logo') as HTMLInputElement;
    fileInput?.click();
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        selectedLogoFile = file;
      } else {
        modalToastStore.error('Only image files are allowed');
      }
    }
  }
  // Handle logo file selection
  function handleLogoSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    selectedLogoFile = file || null;
  }
</script>

<div class="p-6 pt-16 sm:pt-12 relative">
  <!-- Loading Overlay -->
  {#if isSubmitting}
    <Loading overlay={true} text={isEditMode ? 'Updating user...' : 'Creating user...'} />
  {/if}
  
  <div class="max-w-6xl mx-auto">
    <form bind:this={formRef} class="space-y-6" onsubmit={handleSubmit}>
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
          class="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
          placeholder="Enter username"
        />
      </div>

      <!-- Password (only for new users) -->
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
            class="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
            placeholder="Enter password"
          />
        </div>
      {/if}

      <!-- Contact Person -->
      <div>
        <label for="contact_person" class="block text-sm font-medium text-gray-700 mb-2">
          Contact Person
        </label>
        <input
          type="text"
          id="contact_person"
          name="contact_person"
          disabled={isFormDisabled}
          class="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
          placeholder="Enter contact person"
        />
      </div>

      <!-- Name Mentri (hidden but auto-filled from category) -->
      <div style="display: none;">
        <input
          type="text"
          id="name_mentri"
          name="name_mentri"
          value={getNameMentriFromCategory()}
          readonly
        />
      </div>

      <!-- Role -->
      <div class="relative">
        <label class="block text-sm font-medium text-gray-700 mb-3">
          Role <span class="text-red-500">*</span>
        </label>
        
        <!-- Hidden input for form submission -->
        <input type="hidden" name="role" value={selectedRole} required />
        
        <!-- Custom dropdown trigger -->
        <div class="relative">
          <button
            type="button"
            onclick={toggleRoleDropdown}
            disabled={isFormDisabled}
            class="w-full px-3 py-3 text-left text-sm border-2 border-gray-200 rounded-lg bg-gradient-to-br from-white to-gray-50 shadow-sm hover:shadow-md hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed cursor-pointer"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                {#if selectedRole === '1'}
                  <div class="w-2 h-2 bg-red-500 rounded-full"></div>
                  <div>
                    <div class="font-medium text-gray-900 text-sm">Admin</div>
                  </div>
                {:else}
                  <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <div class="font-medium text-gray-900 text-sm">User</div>
                  </div>
                {/if}
              </div>
              <svg class="w-4 h-4 text-gray-400 transition-transform duration-200 {isRoleDropdownOpen ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
          
          <!-- Dropdown menu -->
          {#if isRoleDropdownOpen}
            <div class="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg overflow-hidden">
              {#each roles as role}
                <button
                  type="button"
                  onclick={() => handleRoleSelect(role.id.toString())}
                  class="w-full px-3 py-2.5 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors duration-150 border-b border-gray-100 last:border-b-0 {selectedRole === role.id.toString() ? 'bg-blue-50 border-blue-200' : ''}"
                >
                  <div class="flex items-center space-x-2">
                    <div class="w-2 h-2 {role.id === 1 ? 'bg-red-500' : 'bg-blue-500'} rounded-full"></div>
                    <div class="flex-1">
                      <div class="font-medium text-gray-900 text-sm">{role.name}</div>
                      <div class="text-xs text-gray-500 mt-0.5">
                        {role.id === 1 ? 'Full access' : 'Category access'}
                      </div>
                    </div>
                    {#if selectedRole === role.id.toString()}
                      <svg class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                      </svg>
                    {/if}
                  </div>
                </button>
              {/each}
            </div>
          {/if}
        </div>
      </div>

      <!-- Category (only show for User role) -->
      {#if selectedRole === '2'}
      <div class="relative">
        <label class="block text-sm font-medium text-gray-700 mb-3">
          Category
          <span class="text-xs font-normal text-gray-500 ml-1">(Optional)</span>
        </label>
        
        <!-- Hidden input for form submission -->
        <input type="hidden" name="category" value={selectedCategory} />
        
        {#if categoriesLoading}
          <div class="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 shadow-sm">
            <svg class="w-5 h-5 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span class="text-sm text-gray-600 font-medium">Loading categories...</span>
          </div>
        {:else}
          <div class="relative">
            <!-- Custom dropdown trigger -->
            <button
              type="button"
              onclick={toggleCategoryDropdown}
              disabled={isFormDisabled}
              class="w-full px-3 py-3 text-left text-sm border-2 border-gray-200 rounded-lg bg-gradient-to-br from-white to-gray-50 shadow-sm hover:shadow-md hover:border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed cursor-pointer"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  {#if selectedCategory}
                    {@const selectedCat = categories.find(c => c.id.toString() === selectedCategory)}
                    <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <div class="font-medium text-gray-900 text-sm">{selectedCat?.name}</div>
                    </div>
                  {:else}
                    <div class="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <div>
                      <div class="font-medium text-gray-500 text-sm">Choose category...</div>
                    </div>
                  {/if}
                </div>
                <svg class="w-4 h-4 text-gray-400 transition-transform duration-200 {isCategoryDropdownOpen ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            
            <!-- Dropdown menu -->
            {#if isCategoryDropdownOpen}
              <div class="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                <!-- None option -->
                <button
                  type="button"
                  onclick={() => handleCategorySelect('')}
                  class="w-full px-3 py-2.5 text-left hover:bg-green-50 focus:bg-green-50 focus:outline-none transition-colors duration-150 border-b border-gray-100 {selectedCategory === '' ? 'bg-green-50 border-green-200' : ''}"
                >
                  <div class="flex items-center space-x-2">
                    <div class="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <div class="flex-1">
                      <div class="font-medium text-gray-900 text-sm">No Category</div>
                      <div class="text-xs text-gray-500 mt-0.5">General access</div>
                    </div>
                    {#if selectedCategory === ''}
                      <svg class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                      </svg>
                    {/if}
                  </div>
                </button>
                
                <!-- Category options -->
                {#each categories as category}
                  <button
                    type="button"
                    onclick={() => handleCategorySelect(category.id.toString())}
                    class="w-full px-3 py-2.5 text-left hover:bg-green-50 focus:bg-green-50 focus:outline-none transition-colors duration-150 border-b border-gray-100 last:border-b-0 {selectedCategory === category.id.toString() ? 'bg-green-50 border-green-200' : ''}"
                  >
                    <div class="flex items-center space-x-2">
                      <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div class="flex-1">
                        <div class="font-medium text-gray-900 text-sm">{category.name}</div>
                        <div class="text-xs text-gray-500 mt-0.5">
                          {category.description || 'Department access'}
                        </div>
                      </div>
                      {#if selectedCategory === category.id.toString()}
                        <svg class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                        </svg>
                      {/if}
                    </div>
                  </button>
                {/each}
              </div>
            {/if}
          </div>
        {/if}
      </div>
      {/if}

      <!-- Logo Upload -->
      <div>
        <label for="logo" class="block text-sm font-medium text-gray-700 mb-2">
          Logo {isEditMode ? '(Optional - leave empty to keep current logo)' : '(Optional)'}
        </label>
        <div 
          class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors {isFormDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}"
          onclick={!isFormDisabled ? handleFileAreaClick : undefined}
          ondragover={!isFormDisabled ? handleDragOver : undefined}
          ondrop={!isFormDisabled ? handleDrop : undefined}
        >
          {#if selectedLogoFile}
            <div class="flex items-center justify-center">
              <svg class="h-8 w-8 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
              <p class="text-sm text-gray-900 font-medium">{selectedLogoFile.name}</p>
            </div>
            <p class="mt-1 text-xs text-gray-500">Click to change logo</p>
          {:else}
            <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <p class="mt-2 text-sm text-gray-600">
              <span class="font-medium text-blue-600 hover:text-blue-500">
                Click to upload
              </span>
              or drag and drop
            </p>
            <p class="text-xs text-gray-500">Images (PNG, JPG, GIF) up to 5MB</p>
          {/if}
          <input 
            type="file" 
            id="logo" 
            name="logo" 
            class="hidden" 
            accept="image/*"
            disabled={isFormDisabled}
            onchange={handleLogoSelect}
          />
        </div>
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
        <button
          type="submit"
          disabled={isSubmitting}
          class="px-6 py-3 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 border border-transparent rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {#if isSubmitting}
            <Loading size="sm" />
            <span>{isEditMode ? 'Updating...' : 'Creating...'}</span>
          {:else}
            <span>{isEditMode ? 'Update User' : 'Create User'}</span>
          {/if}
        </button>
      </div>
    </form>
  </div>
</div>