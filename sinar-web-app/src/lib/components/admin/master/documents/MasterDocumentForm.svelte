<script lang="ts">
  import { onMount } from 'svelte';
  import { categoryService, type Category } from '$lib/services';

  interface $$Props {
    onSubmit?: (data: FormData) => void;
    onReset?: () => void;
    categoryData?: Category | null;
  }

  let { onSubmit, onReset, categoryData }: $$Props = $props();

  // Form state
  let formRef: HTMLFormElement;
  let isDropdownOpen = $state(false);
  let selectedParentCategories: string[] = $state([]);
  let parentCategories: Category[] = $state([]);
  let categoriesLoading = $state(true);
  
  // Check if we're in edit mode
  const isEditMode = $derived(categoryData !== null);

  // Load parent categories on mount
  onMount(async () => {
    await loadParentCategories();
  });

  // Load category data into form when provided
  $effect(() => {
    if (categoryData && formRef) {
      populateForm(categoryData);
    }
  });

  async function loadParentCategories() {
    categoriesLoading = true;
    try {
      const response = await categoryService.getAllCategories();
      if (response.status && response.data) {
        parentCategories = response.data;
      } else {
        console.error('Failed to load parent categories:', response.message);
        parentCategories = [];
      }
    } catch (error) {
      console.error('Error loading parent categories:', error);
      parentCategories = [];
    } finally {
      categoriesLoading = false;
    }
  }

  function populateForm(category: Category) {
    const form = formRef;
    if (!form) return;

    // Populate basic fields
    (form.querySelector('#name') as HTMLInputElement).value = category.name || '';
    (form.querySelector('#description') as HTMLTextAreaElement).value = category.description || '';
    
    // Reset selected parent categories for now
    selectedParentCategories = [];
  }

  function handleParentCategoryChange(categoryId: string, checked: boolean) {
    if (checked) {
      selectedParentCategories = [...selectedParentCategories, categoryId];
    } else {
      selectedParentCategories = selectedParentCategories.filter(id => id !== categoryId);
    }
  }

  function toggleDropdown() {
    isDropdownOpen = !isDropdownOpen;
  }

  function closeDropdown() {
    isDropdownOpen = false;
  }

  // Close dropdown when clicking outside
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const dropdown = document.getElementById('category-dropdown');
    const button = document.getElementById('category-dropdown-button');
    
    if (dropdown && button && !dropdown.contains(target) && !button.contains(target)) {
      closeDropdown();
    }
  }

  onMount(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });

  async function handleSubmit(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    
    // Add selected parent categories to form data
    selectedParentCategories.forEach(categoryId => {
      formData.append('parent_category_ids', categoryId);
    });

    try {
      if (isEditMode && categoryData) {
        // Update existing category
        console.log('Update category:', categoryData.id, formData);
        // TODO: Implement update category service
      } else {
        // Create new category
        console.log('Create category:', formData);
        // TODO: Implement create category service
      }
      
      handleReset();
    } catch (error) {
      console.error('Submit error:', error);
    }

    // Also call parent callback if provided
    onSubmit?.(formData);
  }

  function handleReset() {
    selectedParentCategories = [];
    isDropdownOpen = false;
    formRef?.reset();
    onReset?.();
  }

  // Get display text for selected categories
  const selectedCategoriesText = $derived(() => {
    if (selectedParentCategories.length === 0) {
      return 'Select parent categories';
    }
    
    const selectedNames = selectedParentCategories
      .map(id => parentCategories.find(cat => cat.id.toString() === id)?.name)
      .filter(Boolean);
    
    if (selectedNames.length <= 2) {
      return selectedNames.join(', ');
    }
    
    return `${selectedNames.slice(0, 2).join(', ')} + ${selectedNames.length - 2} more`;
  });
</script>

<div class="p-6">
  <div class="max-w-4xl mx-auto">
    <h2 class="text-lg font-semibold text-gray-900 mb-4">
      {isEditMode ? 'Edit Category' : 'Add New Category'}
    </h2>
    
    <form bind:this={formRef} class="space-y-8" onsubmit={handleSubmit}>
      <!-- Category Name -->
      <div>
        <label for="name" class="block text-sm font-medium text-gray-700 mb-3">
          Category Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          class="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          placeholder="Enter category name"
        />
      </div>

      <!-- Description -->
      <div>
        <label for="description" class="block text-sm font-medium text-gray-700 mb-3">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows="5"
          class="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
          placeholder="Enter category description"
        ></textarea>
      </div>

      <!-- Parent Categories (Dropdown with Checkboxes) -->
      <div class="relative">
        <label class="block text-sm font-medium text-gray-700 mb-3">
          Parent Categories
        </label>
        
        {#if categoriesLoading}
          <div class="flex items-center space-x-2 p-4 border border-gray-300 rounded-lg bg-gray-50">
            <svg class="w-5 h-5 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span class="text-base text-gray-500">Loading categories...</span>
          </div>
        {:else if parentCategories.length === 0}
          <div class="p-4 border border-gray-300 rounded-lg bg-gray-50 text-base text-gray-500">
            No parent categories available
          </div>
        {:else}
          <!-- Dropdown Button -->
          <button
            type="button"
            id="category-dropdown-button"
            class="w-full px-4 py-3 text-left border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between transition-colors"
            onclick={toggleDropdown}
          >
            <span class="text-base {selectedParentCategories.length === 0 ? 'text-gray-500' : 'text-gray-900'}">
              {selectedCategoriesText}
            </span>
            <svg 
              class="w-4 h-4 text-gray-400 transition-transform duration-200 {isDropdownOpen ? 'transform rotate-180' : ''}" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <!-- Dropdown Content -->
          {#if isDropdownOpen}
            <div 
              id="category-dropdown"
              class="absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
            >
              <div class="p-2">
                {#each parentCategories as category (category.id)}
                  <label class="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input 
                      type="checkbox" 
                      value={category.id.toString()}
                      checked={selectedParentCategories.includes(category.id.toString())}
                      onchange={(e) => handleParentCategoryChange(category.id.toString(), e.currentTarget.checked)}
                      class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3" 
                    />
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
                  </label>
                {/each}
              </div>
              
              {#if selectedParentCategories.length > 0}
                <div class="border-t border-gray-200 p-2">
                  <button
                    type="button"
                    class="text-xs text-blue-600 hover:text-blue-800"
                    onclick={() => selectedParentCategories = []}
                  >
                    Clear all selections
                  </button>
                </div>
              {/if}
            </div>
          {/if}
        {/if}
        
        {#if selectedParentCategories.length > 0}
          <p class="text-sm text-gray-500 mt-2">
            {selectedParentCategories.length} parent categor{selectedParentCategories.length === 1 ? 'y' : 'ies'} selected
          </p>
        {/if}
      </div>

      <!-- Form Actions -->
      <div class="flex items-center justify-end space-x-4 pt-6">
        <button
          type="button"
          onclick={handleReset}
          class="px-6 py-3 text-base font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors duration-200"
        >
          Reset
        </button>
        <button
          type="submit"
          class="px-6 py-3 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 border border-transparent rounded-lg transition-colors duration-200"
        >
          {isEditMode ? 'Update Category' : 'Save Category'}
        </button>
      </div>
    </form>
  </div>
</div>