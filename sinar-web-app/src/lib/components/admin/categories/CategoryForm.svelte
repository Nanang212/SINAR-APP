<script lang="ts">
  import { onMount } from 'svelte';
  import { categoryService, type Category, type CreateCategoryRequest, type UpdateCategoryRequest } from '$lib/services';
  import Loading from '$lib/components/ui/loading.svelte';
  import { modalToastStore } from '$lib/stores/modal-toast';

  interface $$Props {
    onSubmit?: () => void;
    onReset?: () => void;
    categoryData?: Category | null;
  }

  let { onSubmit, onReset, categoryData }: $$Props = $props();

  // Form state
  let formRef: HTMLDivElement;
  let isSubmitting = $state(false);
  let isFormDisabled = $state(false);
  let categoryName = $state('');
  
  // Check if we're in edit mode
  const isEditMode = $derived(categoryData !== null);

  // Check if form is valid for submission
  const isFormValid = $derived(() => {
    return categoryName.trim().length > 0;
  });


  // Load category data into form when provided
  $effect(() => {
    if (categoryData && formRef) {
      populateForm(categoryData);
      // Ensure form is enabled when editing
      isFormDisabled = false;
    }
  });

  function populateForm(category: Category) {
    const form = formRef;
    if (!form) return;

    // Populate basic fields and state
    categoryName = category.name || '';
    // Don't manually set DOM value, let Svelte handle it with bind:value
    // (form.querySelector('#name') as HTMLInputElement).value = categoryName;
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      console.log('Enter key pressed, preventing form submission');
      event.preventDefault();
      event.stopPropagation();
    }
  }

  async function handleFormSubmit() {
    if (isSubmitting) {
      console.log('Already submitting, ignoring duplicate submission');
      return;
    }
    
    // Get form values manually since we're not using a form element
    const formData = {
      name: (formRef.querySelector('#name') as HTMLInputElement)?.value || '',
    };
    
    // Validation
    if (!formData.name.trim()) {
      modalToastStore.error('Category name is required');
      return;
    }
    
    console.log('Form data:', formData);

    // Start loading and disable form
    isSubmitting = true;
    isFormDisabled = true;

    try {
      // Add delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (isEditMode && categoryData) {
        // Update existing category
        const updateData: UpdateCategoryRequest = {
          name: formData.name,
        };

        console.log('Update data:', updateData);

        const result = await categoryService.updateCategory(categoryData.id, updateData);
        if (result.status) {
          console.log('Category updated successfully:', result.data);
          modalToastStore.success('Category updated successfully!');
          // Call parent onSubmit callback to refresh data and switch to browse tab
          onSubmit?.();
        } else {
          console.error('Update failed:', result.message);
          modalToastStore.error(result.message || 'Failed to update category');
          isFormDisabled = false; // Re-enable form on error
        }
      } else {
        // Create new category
        const createData: CreateCategoryRequest = {
          name: formData.name,
        };

        const result = await categoryService.createCategory(createData);
        if (result.status) {
          console.log('Category created successfully:', result.data);
          modalToastStore.success('Category created successfully!');
          // Call parent onSubmit callback to refresh data and switch to browse tab
          onSubmit?.();
        } else {
          console.error('Create failed:', result.message);
          modalToastStore.error(result.message || 'Failed to create category');
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
    isFormDisabled = false;
    
    // Reset state variables
    categoryName = '';
    
    // Reset form inputs manually
    const nameInput = formRef?.querySelector('#name') as HTMLInputElement;
    
    if (nameInput) nameInput.value = '';
    
    onReset?.();
  }


  async function refreshCategoryData() {
    if (isEditMode && categoryData) {
      try {
        // You might need to implement a getCategoryById method in your service
        // For now, we'll just keep the current data
        console.log('Category data refreshed');
      } catch (error) {
        console.error('Failed to refresh category data:', error);
      }
    }
  }
</script>

<div class="p-6 pt-16 sm:pt-12 relative">
  <!-- Loading Overlay -->
  {#if isSubmitting}
    <Loading overlay={true} text={isEditMode ? 'Updating category...' : 'Saving category...'} />
  {/if}
  
  <div class="max-w-6xl mx-auto">    
    <div bind:this={formRef} class="space-y-6">
      <!-- Category Name -->
      <div>
        <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
          Category Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          disabled={isFormDisabled}
          autocomplete="off"
          onkeydown={handleKeyDown}
          bind:value={categoryName}
          class="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
          placeholder="Enter category name"
        />
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
          type="button"
          onclick={handleFormSubmit}
          disabled={isSubmitting || !isFormValid()}
          class="px-6 py-3 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 border border-transparent rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {#if isSubmitting}
            <Loading size="sm" />
            <span>{isEditMode ? 'Updating...' : 'Saving...'}</span>
          {:else}
            <span>{isEditMode ? 'Update Category' : 'Save Category'}</span>
          {/if}
        </button>
      </div>
    </div>
  </div>
</div>