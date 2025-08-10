<script lang="ts">
  import { onMount } from 'svelte';
  import { documentService, categoryService, type Document, type UploadDocumentRequest, type UpdateDocumentRequest, type Category } from '$lib/services';
  import Loading from '$lib/components/ui/loading.svelte';
  import { toastStore } from '$lib/stores/toast';
  import { modalToastStore } from '$lib/stores/modal-toast';

  interface $$Props {
    onSubmit?: (data: FormData) => void;
    onReset?: () => void;
    documentData?: Document | null;
  }

  let { onSubmit, onReset, documentData }: $$Props = $props();

  // Form state
  let selectedCategories: string[] = $state([]);
  let formRef: HTMLFormElement;
  let categories: Category[] = $state([]);
  let categoriesLoading = $state(true);
  let selectedFileName = $state<string>('');
  let isCategoryDropdownOpen = $state(false);
  let isSubmitting = $state(false);
  let isFormDisabled = $state(false);
  
  // Check if we're in edit mode
  const isEditMode = $derived(documentData !== null);

  // Load categories on mount
  onMount(async () => {
    await loadCategories();
  });

  // Load document data into form when provided
  $effect(() => {
    if (documentData && formRef) {
      populateForm(documentData);
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

  function populateForm(document: Document) {
    const form = formRef;
    if (!form) return;

    // Populate basic fields
    (form.querySelector('#title') as HTMLInputElement).value = document.title || '';
    (form.querySelector('#remark') as HTMLTextAreaElement).value = document.remark || '';
    
    // Populate categories
    selectedCategories = document.categories?.map(cat => cat.id?.toString()) || [];
  }

  function handleCategoryChange(categoryId: string, checked: boolean) {
    if (checked) {
      selectedCategories = [...selectedCategories, categoryId];
    } else {
      selectedCategories = selectedCategories.filter(id => id !== categoryId);
    }
  }

  async function handleSubmit(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    
    // Clear existing category_ids from form data to avoid duplicates
    formData.delete('category_ids');
    
    // Add selected categories to form data
    selectedCategories.forEach(categoryId => {
      formData.append('category_ids', categoryId);
    });

    // Start loading and disable form
    isSubmitting = true;
    isFormDisabled = true;

    try {
      // Add delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (isEditMode && documentData) {
        // Update existing document - use FormData directly
        const result = await documentService.updateDocumentWithFormData(documentData.id, formData);
        if (result.status) {
          console.log('Document updated successfully:', result.data);
          modalToastStore.success('Document updated successfully!');
          // Refresh the document data
          await refreshDocumentData();
        } else {
          console.error('Update failed:', result.message);
          modalToastStore.error(result.message || 'Failed to update document');
          isFormDisabled = false; // Re-enable form on error
        }
      } else {
        // Create new document - use FormData directly
        const fileInput = form.querySelector('#file') as HTMLInputElement;
        const file = fileInput?.files?.[0];
        
        if (!file) {
          modalToastStore.error('File is required for new document');
          isSubmitting = false;
          isFormDisabled = false;
          return;
        }

        const result = await documentService.uploadDocumentWithFormData(formData);
        if (result.status) {
          console.log('Document uploaded successfully:', result.data);
          modalToastStore.success('Document uploaded successfully!');
          // Keep form disabled and data visible
        } else {
          console.error('Upload failed:', result.message);
          modalToastStore.error(result.message || 'Failed to upload document');
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
    selectedCategories = [];
    selectedFileName = '';
    isCategoryDropdownOpen = false;
    isFormDisabled = false;
    formRef?.reset();
    onReset?.();
  }

  async function refreshDocumentData() {
    if (isEditMode && documentData) {
      try {
        // You might need to implement a getDocumentById method in your service
        // For now, we'll just keep the current data
        console.log('Document data refreshed');
      } catch (error) {
        console.error('Failed to refresh document data:', error);
      }
    }
  }

  function handleFileAreaClick() {
    const fileInput = document.getElementById('file') as HTMLInputElement;
    fileInput?.click();
  }

  function handleFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      // Validate file type
      const allowedExtensions = ['.doc', '.docx'];
      const fileName = file.name.toLowerCase();
      const isValidType = allowedExtensions.some(ext => fileName.endsWith(ext));
      
      if (!isValidType) {
        modalToastStore.error('Only Word documents (.doc, .docx) are allowed');
        input.value = ''; // Clear the input
        selectedFileName = '';
        return;
      }
      
      selectedFileName = file.name;
    } else {
      selectedFileName = '';
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Validate file type
      const allowedExtensions = ['.doc', '.docx'];
      const fileName = file.name.toLowerCase();
      const isValidType = allowedExtensions.some(ext => fileName.endsWith(ext));
      
      if (!isValidType) {
        modalToastStore.error('Only Word documents (.doc, .docx) are allowed');
        return;
      }
      
      const fileInput = document.getElementById('file') as HTMLInputElement;
      if (fileInput) {
        fileInput.files = files;
        selectedFileName = file.name;
      }
    }
  }

  function toggleCategoryDropdown() {
    isCategoryDropdownOpen = !isCategoryDropdownOpen;
  }

  function closeCategoryDropdown() {
    isCategoryDropdownOpen = false;
  }

  // Close dropdown when clicking outside
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const dropdown = document.getElementById('category-dropdown');
    const button = document.getElementById('category-dropdown-button');
    
    if (dropdown && button && !dropdown.contains(target) && !button.contains(target)) {
      closeCategoryDropdown();
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

  // Get selected categories for badges display
  function getSelectedCategoriesForBadges() {
    return selectedCategories
      .map(id => categories.find(cat => cat.id.toString() === id))
      .filter(Boolean);
  }

  // Remove a category from selection
  function removeCategoryFromSelection(categoryId: string) {
    selectedCategories = selectedCategories.filter(id => id !== categoryId);
  }
</script>

<div class="p-6 pt-16 sm:pt-12 relative">
  <!-- Loading Overlay -->
  {#if isSubmitting}
    <Loading overlay={true} text={isEditMode ? 'Updating document...' : 'Saving document...'} />
  {/if}
  
  <div class="max-w-6xl mx-auto">
    <form bind:this={formRef} class="space-y-6" onsubmit={handleSubmit}>
      <!-- Document Title -->
      <div>
        <label for="title" class="block text-sm font-medium text-gray-700 mb-2">
          Document Title *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          required
          disabled={isFormDisabled}
          class="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
          placeholder="Enter document title"
        />
      </div>

      <!-- Remark -->
      <div>
        <label for="remark" class="block text-sm font-medium text-gray-700 mb-2">
          Remark
        </label>
        <textarea
          id="remark"
          name="remark"
          rows="4"
          disabled={isFormDisabled}
          class="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
          placeholder="Enter document remark or description"
        ></textarea>
      </div>

      <!-- Categories (Dropdown with Multiple Selection) -->
      <div class="relative">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Categories *
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
            id="category-dropdown-button"
            class="w-full px-4 py-3 text-base text-left border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between {selectedCategories.length === 0 ? 'text-red-500 border-red-300' : 'text-gray-900'} disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed min-h-[48px]"
            disabled={isFormDisabled}
            onclick={!isFormDisabled ? toggleCategoryDropdown : undefined}
          >
            <div class="flex-1 flex flex-wrap gap-2 min-h-[20px] items-center">
              {#if selectedCategories.length === 0}
                <span class="text-gray-500">Select categories</span>
              {:else}
                {#each getSelectedCategoriesForBadges() as category (category.id)}
                  <div class="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    <span>{category.name}</span>
                    <button
                      type="button"
                      class="ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                      onclick={(e) => {
                        e.stopPropagation();
                        if (!isFormDisabled) {
                          removeCategoryFromSelection(category.id.toString());
                        }
                      }}
                      disabled={isFormDisabled}
                      title="Remove {category.name}"
                    >
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                {/each}
              {/if}
            </div>
            <svg 
              class="w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2 {isCategoryDropdownOpen ? 'transform rotate-180' : ''}" 
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
              id="category-dropdown"
              class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
            >
              <div class="p-2">
                {#each categories as category (category.id)}
                  <label class="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input 
                      type="checkbox" 
                      value={category.id.toString()}
                      checked={selectedCategories.includes(category.id.toString())}
                      disabled={isFormDisabled}
                      onchange={(e) => handleCategoryChange(category.id.toString(), e.currentTarget.checked)}
                      class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3 disabled:opacity-50 disabled:cursor-not-allowed" 
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
              
              {#if selectedCategories.length > 0}
                <div class="border-t border-gray-200 p-2">
                  <button
                    type="button"
                    disabled={isFormDisabled}
                    class="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    onclick={!isFormDisabled ? () => selectedCategories = [] : undefined}
                  >
                    Clear all selections
                  </button>
                </div>
              {/if}
            </div>
          {/if}
        {/if}
        
        {#if selectedCategories.length === 0 && !categoriesLoading && categories.length > 0}
          <p class="text-xs text-red-500 mt-1">Please select at least one category</p>
        {:else if selectedCategories.length > 0}
          <p class="text-xs text-gray-500 mt-1">
            {selectedCategories.length} categor{selectedCategories.length === 1 ? 'y' : 'ies'} selected
          </p>
        {/if}
      </div>

      <!-- File Upload -->
      <div>
        <label for="file" class="block text-sm font-medium text-gray-700 mb-2">
          Document File {isEditMode ? '(Optional - leave empty to keep current file)' : '*'}
        </label>
        <div 
          class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors {isFormDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}"
          onclick={!isFormDisabled ? handleFileAreaClick : undefined}
          ondragover={!isFormDisabled ? handleDragOver : undefined}
          ondrop={!isFormDisabled ? handleDrop : undefined}
        >
          {#if selectedFileName}
            <div class="flex items-center justify-center">
              <svg class="h-8 w-8 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
              <p class="text-sm text-gray-900 font-medium">{selectedFileName}</p>
            </div>
            <p class="mt-1 text-xs text-gray-500">Click to change file</p>
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
            <p class="text-xs text-gray-500">Only Word documents (DOC, DOCX) up to 10MB</p>
          {/if}
          <input 
            type="file" 
            id="file" 
            name="file" 
            class="hidden" 
            accept=".doc,.docx"
            required={!isEditMode}
            disabled={isFormDisabled}
            onchange={handleFileChange}
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
          disabled={isSubmitting || selectedCategories.length === 0}
          class="px-6 py-3 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 border border-transparent rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {#if isSubmitting}
            <Loading size="sm" />
            <span>{isEditMode ? 'Updating...' : 'Saving...'}</span>
          {:else}
            <span>{isEditMode ? 'Update Document' : 'Save Document'}</span>
          {/if}
        </button>
      </div>
    </form>
  </div>
</div>