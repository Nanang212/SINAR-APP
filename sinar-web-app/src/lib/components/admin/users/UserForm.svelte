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
  let username = $state('');
  let password = $state('');
  let categories: Category[] = $state([]);
  let categoriesLoading = $state(true);
  let selectedCategoryId = $state<string>('');
  let isCategoryDropdownOpen = $state(false);
  let selectedRoleId = $state<string>(''); // Will be set based on mode
  let isRoleDropdownOpen = $state(false);
  
  // New fields
  let contactPerson = $state('');
  let nameMentri = $state('');
  let logoFile = $state<File | null>(null);
  let logoPreview = $state<string>('');
  let currentLogoUrl = $state<string>('');
  
  // Check if we're in edit mode
  const isEditMode = $derived(userData !== null);

  // Check if form is valid for submission
  const isFormValid = $derived(() => {
    if (isEditMode) {
      // For edit mode, only username is required
      return username.trim().length > 0;
    } else {
      // For create mode, both username and password are required
      return username.trim().length > 0 && password.trim().length > 0;
    }
  });

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
    } else if (!userData) {
      // Set default for create mode
      selectedRoleId = '2'; // Default to user role for new users
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

    // Populate basic fields and state
    username = user.username || '';
    (form.querySelector('#username') as HTMLInputElement).value = username;
    
    // Populate role - use role_id directly from API response
    selectedRoleId = user.role_id ? user.role_id.toString() : '2';
    
    // Populate category
    selectedCategoryId = user.category_id ? user.category_id.toString() : '';
    
    // Populate new fields
    contactPerson = user.contact_person || '';
    nameMentri = user.name_mentri || '';
    currentLogoUrl = user.logo || '';
    
    // Update form inputs
    const contactInput = form.querySelector('#contact_person') as HTMLInputElement;
    if (contactInput) contactInput.value = contactPerson;
    
    const mentriInput = form.querySelector('#name_mentri') as HTMLInputElement;
    if (mentriInput) mentriInput.value = nameMentri;
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

  // Handle file upload for logo
  function handleLogoUpload(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (file) {
      validateAndSetLogoFile(file);
    }
  }

  // Handle logo area click
  function handleLogoAreaClick() {
    const fileInput = formRef?.querySelector('#logo') as HTMLInputElement;
    fileInput?.click();
  }

  // Handle drag and drop
  function handleLogoDragOver(event: DragEvent) {
    event.preventDefault();
  }

  function handleLogoDrop(event: DragEvent) {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      validateAndSetLogoFile(file);
      
      // Update file input
      const fileInput = formRef?.querySelector('#logo') as HTMLInputElement;
      if (fileInput) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;
      }
    }
  }

  // Validate and set logo file
  function validateAndSetLogoFile(file: File) {
    // Validate file type - only jpg and png
    const allowedExtensions = ['.jpg', '.jpeg', '.png'];
    const fileName = file.name.toLowerCase();
    const isValidType = allowedExtensions.some(ext => fileName.endsWith(ext));
    
    if (!isValidType) {
      modalToastStore.error('Only JPG and PNG image files are allowed');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      modalToastStore.error('File size must be less than 5MB');
      return;
    }
    
    logoFile = file;
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      logoPreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  // Remove logo
  function removeLogo() {
    logoFile = null;
    logoPreview = '';
    const fileInput = formRef?.querySelector('#logo') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  // Auto-populate name_mentri based on selected category
  $effect(() => {
    if (selectedCategoryId && categories.length > 0) {
      const selectedCategory = categories.find(cat => cat.id.toString() === selectedCategoryId);
      if (selectedCategory && !isEditMode) {
        // Only auto-populate in create mode
        nameMentri = selectedCategory.name;
        const mentriInput = formRef?.querySelector('#name_mentri') as HTMLInputElement;
        if (mentriInput) mentriInput.value = nameMentri;
      }
    }
  });

  async function handleFormSubmit() {
    if (isSubmitting) {
      console.log('Already submitting, ignoring duplicate submission');
      return;
    }
    
    // Get form values manually since we're not using a form element
    const formData = {
      username: (formRef.querySelector('#username') as HTMLInputElement)?.value || '',
      password: (formRef.querySelector('#password') as HTMLInputElement)?.value || '',
      contact_person: (formRef.querySelector('#contact_person') as HTMLInputElement)?.value || '',
      name_mentri: (formRef.querySelector('#name_mentri') as HTMLInputElement)?.value || '',
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
          contact_person: formData.contact_person,
          name_mentri: formData.name_mentri,
          logo: logoFile,
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
          contact_person: formData.contact_person,
          name_mentri: formData.name_mentri,
          logo: logoFile,
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
    // Set role based on mode: edit mode keeps original role, create mode defaults to user
    selectedRoleId = isEditMode && userData ? 
      (userData.role_id ? userData.role_id.toString() : '2') : 
      '2'; // Default to user role for new users
    isCategoryDropdownOpen = false;
    isRoleDropdownOpen = false;
    isFormDisabled = false;
    
    // Reset state variables
    username = '';
    password = '';
    
    // Reset form inputs manually
    const usernameInput = formRef?.querySelector('#username') as HTMLInputElement;
    const passwordInput = formRef?.querySelector('#password') as HTMLInputElement;
    
    if (usernameInput) usernameInput.value = '';
    if (passwordInput) passwordInput.value = '';
    
    // In edit mode, repopulate with original data
    if (isEditMode && userData) {
      populateForm(userData);
    }
    
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
          bind:value={username}
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
            bind:value={password}
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
          onkeydown={handleKeyDown}
          bind:value={contactPerson}
          class="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
          placeholder="Enter contact person"
        />
      </div>

      <!-- Hidden Nama Menteri field - auto-populated based on category -->
      <input type="hidden" id="name_mentri" name="name_mentri" bind:value={nameMentri} />

      <!-- Profile Logo Upload -->
      <div>
        <label for="logo" class="block text-sm font-medium text-gray-700 mb-2">
          Profile Logo {isEditMode ? '(Optional - leave empty to keep current logo)' : ''}
        </label>
        
        <!-- Drag and Drop Area -->
        <div 
          class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors {isFormDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}"
          onclick={!isFormDisabled ? handleLogoAreaClick : undefined}
          ondragover={!isFormDisabled ? handleLogoDragOver : undefined}
          ondrop={!isFormDisabled ? handleLogoDrop : undefined}
          role="button"
          tabindex="0"
          onkeydown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !isFormDisabled) {
              e.preventDefault();
              handleLogoAreaClick();
            }
          }}
        >
          {#if logoPreview || currentLogoUrl}
            <!-- Show preview when file is selected -->
            <div class="flex flex-col items-center">
              <div class="relative mb-4">
                <img
                  src={logoPreview || currentLogoUrl}
                  alt="Logo preview"
                  class="w-24 h-24 object-cover rounded-full border-4 border-gray-200 shadow-md"
                />
                {#if logoPreview && !isFormDisabled}
                  <button
                    type="button"
                    onclick={removeLogo}
                    class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                    title="Remove logo"
                    aria-label="Remove selected logo"
                  >
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                {/if}
              </div>
              
              <div class="text-center">
                {#if logoPreview}
                  <div class="flex items-center justify-center mb-2">
                    <svg class="h-6 w-6 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                    <p class="text-sm text-gray-900 font-medium">New logo selected</p>
                  </div>
                  {#if logoFile}
                    <p class="text-xs text-gray-500">
                      {logoFile.name} ({Math.round(logoFile.size / 1024)} KB)
                    </p>
                  {/if}
                  <p class="mt-1 text-xs text-gray-500">Click to change logo</p>
                {:else}
                  <p class="text-sm text-gray-600">Current profile logo</p>
                  <p class="mt-1 text-xs text-gray-500">Click to change logo</p>
                {/if}
              </div>
            </div>
          {:else}
            <!-- Show upload area when no file selected -->
            <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M8 14s0-2 2-2 2 2 2 2m26 0s0-2 2-2 2 2 2 2M7 14s0 2 2 2 2-2 2-2m26 0s0 2 2 2 2-2 2-2M7 32s0-2 2-2 2 2 2 2m26 0s0-2 2-2 2 2 2 2M7 32s0 2 2 2 2-2 2-2m26 0s0 2 2 2 2-2 2-2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="24" cy="24" r="4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M16 24l-4-4 4-4M32 24l4-4-4-4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <div class="mt-4">
              <p class="text-lg font-medium text-gray-600">Upload Profile Logo</p>
              <p class="mt-2 text-sm text-gray-600">
                <span class="font-medium text-blue-600 hover:text-blue-500">
                  Click to upload
                </span>
                or drag and drop
              </p>
              <p class="text-xs text-gray-500 mt-1">Only JPG and PNG files up to 5MB</p>
            </div>
          {/if}
          
          <!-- Hidden file input -->
          <input 
            type="file" 
            id="logo" 
            name="logo" 
            class="hidden" 
            accept=".jpg,.jpeg,.png"
            disabled={isFormDisabled}
            onchange={handleLogoUpload}
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
          disabled={isSubmitting || !isFormValid()}
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