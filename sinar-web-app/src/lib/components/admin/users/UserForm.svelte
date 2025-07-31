<script lang="ts">
  import { onMount } from 'svelte';
  import { userService, type User, type CreateUserRequest, type UpdateUserRequest } from '$lib/services';
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
  let formRef: HTMLFormElement;
  let isSubmitting = $state(false);
  let isFormDisabled = $state(false);
  
  // Check if we're in edit mode
  const isEditMode = $derived(userData !== null);

  // Load user data into form when provided
  $effect(() => {
    if (userData && formRef) {
      populateForm(userData);
    }
  });

  function populateForm(user: User) {
    const form = formRef;
    if (!form) return;

    // Populate basic fields
    (form.querySelector('#username') as HTMLInputElement).value = user.username || '';
    (form.querySelector('#email') as HTMLInputElement).value = user.email || '';
    (form.querySelector('#role') as HTMLSelectElement).value = user.role || 'user';
    (form.querySelector('#is_active') as HTMLInputElement).checked = user.is_active || false;
  }

  async function handleSubmit(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    // Start loading and disable form
    isSubmitting = true;
    isFormDisabled = true;

    try {
      // Add delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (isEditMode && userData) {
        // Update existing user
        const updateData: UpdateUserRequest = {
          username: formData.get('username') as string,
          email: formData.get('email') as string,
          role: formData.get('role') as string,
          is_active: formData.has('is_active'),
        };

        // Only include password if provided
        const password = formData.get('password') as string;
        if (password && password.trim()) {
          updateData.password = password;
        }

        const result = await userService.updateUser(userData.id, updateData);
        if (result.status) {
          console.log('User updated successfully:', result.data);
          modalToastStore.success('User updated successfully!');
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
          username: formData.get('username') as string,
          email: formData.get('email') as string,
          password: formData.get('password') as string,
          role: formData.get('role') as string,
          is_active: formData.has('is_active'),
        };

        const result = await userService.createUser(createData);
        if (result.status) {
          console.log('User created successfully:', result.data);
          modalToastStore.success('User created successfully!');
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

    // Also call parent callback if provided
    onSubmit?.(formData);
  }

  function handleReset() {
    isFormDisabled = false;
    formRef?.reset();
    onReset?.();
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

      <!-- Email -->
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
          Email Address *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          disabled={isFormDisabled}
          class="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
          placeholder="Enter email address"
        />
      </div>

      <!-- Password -->
      <div>
        <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
          Password {isEditMode ? '(leave blank to keep current)' : '*'}
        </label>
        <input
          type="password"
          id="password"
          name="password"
          required={!isEditMode}
          disabled={isFormDisabled}
          class="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
          placeholder={isEditMode ? 'Enter new password (optional)' : 'Enter password'}
        />
      </div>

      <!-- Role -->
      <div>
        <label for="role" class="block text-sm font-medium text-gray-700 mb-2">
          Role *
        </label>
        <select
          id="role"
          name="role"
          required
          disabled={isFormDisabled}
          class="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
        </select>
      </div>

      <!-- Status -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Status
        </label>
        <div class="flex items-center">
          <input
            type="checkbox"
            id="is_active"
            name="is_active"
            disabled={isFormDisabled}
            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3 disabled:opacity-50 disabled:cursor-not-allowed"
            checked
          />
          <label for="is_active" class="text-sm text-gray-700">
            User is active
          </label>
        </div>
        <p class="text-xs text-gray-500 mt-1">
          Inactive users cannot log in to the system
        </p>
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
            <span>{isEditMode ? 'Updating...' : 'Saving...'}</span>
          {:else}
            <span>{isEditMode ? 'Update User' : 'Save User'}</span>
          {/if}
        </button>
      </div>
    </form>
  </div>
</div>