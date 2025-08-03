<script lang="ts">
  import { onMount } from 'svelte';
  import { documentService, reportService, type Document, type Report, type CreateReportRequest, type UpdateReportRequest } from '$lib/services';
  import Loading from '$lib/components/ui/loading.svelte';
  import { toastStore } from '$lib/stores/toast';
  import { modalToastStore } from '$lib/stores/modal-toast';

  interface $$Props {
    onSubmit?: (data: FormData) => void;
    onReset?: () => void;
    reportData?: Report | null;
  }

  let { onSubmit, onReset, reportData }: $$Props = $props();

  // Form state
  let selectedDocumentId: string = $state('');
  let formRef: HTMLFormElement;
  let documents: Document[] = $state([]);
  let documentsLoading = $state(true);
  let isDocumentDropdownOpen = $state(false);
  let isSubmitting = $state(false);
  let isFormDisabled = $state(false);
  
  // Multiple file upload states
  let selectedAudioFiles = $state<File[]>([]);
  let selectedVideoFiles = $state<File[]>([]);
  
  // Upload progress states
  let uploadProgress = $state<{
    current: number;
    total: number;
    currentFile: string;
  }>({ current: 0, total: 0, currentFile: '' });
  
  // Check if we're in edit mode
  const isEditMode = $derived(!!reportData);

  // Load documents on mount
  onMount(async () => {
    await loadDocuments();
  });

  // Load report data into form when provided
  $effect(() => {
    if (reportData && formRef) {
      populateForm(reportData);
    }
  });

  async function loadDocuments() {
    documentsLoading = true;
    try {
      const response = await documentService.getAllDocuments();
      if (response.status && response.data) {
        documents = response.data;
      } else {
        console.error('Failed to load documents:', response.message);
        documents = [];
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      documents = [];
    } finally {
      documentsLoading = false;
    }
  }

  function populateForm(report: Report) {
    const form = formRef;
    if (!form) return;

    // Populate basic fields
    selectedDocumentId = report.document_id?.toString() || '';
    (form.querySelector('#description') as HTMLTextAreaElement).value = report.description || '';
    
    // Note: For edit mode, we'll show existing files as read-only
    // The user can only add new files, not edit existing ones
  }

  function handleDocumentChange(documentId: string) {
    selectedDocumentId = documentId;
    closeDocumentDropdown();
  }

  async function handleSubmit(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    
    // Validate required fields
    if (!selectedDocumentId) {
      modalToastStore.error('Please select a document');
      return;
    }

    // Validate at least one file is selected
    if (selectedAudioFiles.length === 0 && selectedVideoFiles.length === 0) {
      modalToastStore.error('Please select at least one audio or video file');
      return;
    }

    const description = (form.querySelector('#description') as HTMLTextAreaElement).value;

    // Start loading and disable form
    isSubmitting = true;
    isFormDisabled = true;

    try {
      if (isEditMode && reportData) {
        // For edit mode, we'll handle it differently
        // For now, let's focus on create mode
        modalToastStore.error('Edit mode for multiple files not implemented yet');
        isFormDisabled = false;
        return;
      } else {
        // Create new reports with sequential API calls
        await handleMultipleFileUpload(selectedDocumentId, description);
      }
    } catch (error) {
      console.error('Submit error:', error);
      modalToastStore.error('An unexpected error occurred');
      isFormDisabled = false;
    } finally {
      isSubmitting = false;
      uploadProgress = { current: 0, total: 0, currentFile: '' };
    }

    // Also call parent callback if provided
    const formData = new FormData();
    formData.append('document_id', selectedDocumentId);
    if (description) formData.append('description', description);
    onSubmit?.(formData);
  }

  async function handleMultipleFileUpload(documentId: string, description: string) {
    const allFiles: Array<{file: File, type: 'audio' | 'video'}> = [];
    
    // Prepare all files with their types
    selectedAudioFiles.forEach(file => allFiles.push({file, type: 'audio'}));
    selectedVideoFiles.forEach(file => allFiles.push({file, type: 'video'}));

    uploadProgress.total = allFiles.length;
    uploadProgress.current = 0;

    let successCount = 0;
    let failedFiles: string[] = [];

    // Sequential upload of all files
    for (let i = 0; i < allFiles.length; i++) {
      const {file, type} = allFiles[i];
      uploadProgress.current = i + 1;
      uploadProgress.currentFile = file.name;

      try {
        const formData = new FormData();
        formData.append('document_id', documentId);
        if (description) {
          formData.append('description', description);
        }
        formData.append(type, file);

        console.log(`Uploading ${type} file ${i + 1}/${allFiles.length}: ${file.name}`);
        
        const result = await reportService.createReportWithFormData(formData);
        
        if (result.status) {
          successCount++;
          console.log(`✅ Successfully uploaded: ${file.name}`);
        } else {
          failedFiles.push(file.name);
          console.error(`❌ Failed to upload: ${file.name} - ${result.message}`);
        }

        // Small delay between uploads
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        failedFiles.push(file.name);
        console.error(`❌ Error uploading ${file.name}:`, error);
      }
    }

    // Show final results
    if (successCount > 0 && failedFiles.length === 0) {
      modalToastStore.success(`All ${successCount} files uploaded successfully!`);
      // Reset form on complete success
      handleReset();
    } else if (successCount > 0 && failedFiles.length > 0) {
      modalToastStore.error(`${successCount} files uploaded successfully, but ${failedFiles.length} failed: ${failedFiles.join(', ')}`);
    } else {
      modalToastStore.error(`All uploads failed. Files: ${failedFiles.join(', ')}`);
    }
  }

  function handleReset() {
    selectedDocumentId = '';
    selectedAudioFiles = [];
    selectedVideoFiles = [];
    uploadProgress = { current: 0, total: 0, currentFile: '' };
    isDocumentDropdownOpen = false;
    isFormDisabled = false;
    formRef?.reset();
    onReset?.();
  }

  async function refreshReportData() {
    if (isEditMode && reportData) {
      try {
        const result = await reportService.getReportById(reportData.id);
        if (result.status && result.data) {
          // Update reportData if needed
          console.log('Report data refreshed');
        }
      } catch (error) {
        console.error('Failed to refresh report data:', error);
      }
    }
  }

  // Audio file functions
  function handleAudioAreaClick() {
    const fileInput = document.getElementById('audio') as HTMLInputElement;
    fileInput?.click();
  }

  function handleAudioChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    
    if (files && files.length > 0) {
      const validFiles: File[] = [];
      const invalidFiles: string[] = [];
      const allowedExtensions = ['.mp3', '.m4a', '.wav', '.aac'];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = file.name.toLowerCase();
        const isValidType = allowedExtensions.some(ext => fileName.endsWith(ext));
        
        if (isValidType) {
          validFiles.push(file);
        } else {
          invalidFiles.push(file.name);
        }
      }
      
      if (invalidFiles.length > 0) {
        modalToastStore.error(`Invalid audio files: ${invalidFiles.join(', ')}. Only MP3, M4A, WAV, AAC are allowed.`);
      }
      
      if (validFiles.length > 0) {
        selectedAudioFiles = [...selectedAudioFiles, ...validFiles];
        modalToastStore.success(`Added ${validFiles.length} audio file(s)`);
      }
      
      // Reset input to allow selecting same files again
      input.value = '';
    }
  }

  function removeAudioFile(index: number) {
    selectedAudioFiles = selectedAudioFiles.filter((_, i) => i !== index);
  }

  // Video file functions
  function handleVideoAreaClick() {
    const fileInput = document.getElementById('video') as HTMLInputElement;
    fileInput?.click();
  }

  function handleVideoChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    
    if (files && files.length > 0) {
      const validFiles: File[] = [];
      const invalidFiles: string[] = [];
      const allowedExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.mkv'];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = file.name.toLowerCase();
        const isValidType = allowedExtensions.some(ext => fileName.endsWith(ext));
        
        if (isValidType) {
          validFiles.push(file);
        } else {
          invalidFiles.push(file.name);
        }
      }
      
      if (invalidFiles.length > 0) {
        modalToastStore.error(`Invalid video files: ${invalidFiles.join(', ')}. Only MP4, AVI, MOV, WMV, MKV are allowed.`);
      }
      
      if (validFiles.length > 0) {
        selectedVideoFiles = [...selectedVideoFiles, ...validFiles];
        modalToastStore.success(`Added ${validFiles.length} video file(s)`);
      }
      
      // Reset input to allow selecting same files again
      input.value = '';
    }
  }

  function removeVideoFile(index: number) {
    selectedVideoFiles = selectedVideoFiles.filter((_, i) => i !== index);
  }

  function toggleDocumentDropdown() {
    isDocumentDropdownOpen = !isDocumentDropdownOpen;
  }

  function closeDocumentDropdown() {
    isDocumentDropdownOpen = false;
  }

  // Close dropdown when clicking outside
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const dropdown = document.getElementById('document-dropdown');
    const button = document.getElementById('document-dropdown-button');
    
    if (dropdown && button && !dropdown.contains(target) && !button.contains(target)) {
      closeDocumentDropdown();
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

  // Get selected document for display
  function getSelectedDocument() {
    return documents.find(doc => doc.id.toString() === selectedDocumentId);
  }
</script>

<div class="p-6 relative">
  <!-- Loading Overlay -->
  {#if isSubmitting}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div class="text-center">
          <Loading size="lg" />
          <h3 class="mt-4 text-lg font-medium text-gray-900">
            {#if uploadProgress.total > 0}
              Uploading Files
            {:else if isEditMode}
              Updating Report
            {:else}
              Creating Report
            {/if}
          </h3>
          
          {#if uploadProgress.total > 0}
            <div class="mt-4">
              <div class="flex justify-between text-sm text-gray-600 mb-2">
                <span>File {uploadProgress.current} of {uploadProgress.total}</span>
                <span>{Math.round((uploadProgress.current / uploadProgress.total) * 100)}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div 
                  class="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style="width: {(uploadProgress.current / uploadProgress.total) * 100}%"
                ></div>
              </div>
              {#if uploadProgress.currentFile}
                <p class="text-sm text-gray-500 mt-2 truncate">
                  Current: {uploadProgress.currentFile}
                </p>
              {/if}
            </div>
          {:else}
            <p class="mt-2 text-sm text-gray-600">Please wait...</p>
          {/if}
        </div>
      </div>
    </div>
  {/if}
  
  <div class="max-w-6xl mx-auto">
    <form bind:this={formRef} class="space-y-6" onsubmit={handleSubmit}>
      <!-- Document Selection -->
      <div class="relative">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Document *
        </label>
        
        {#if documentsLoading}
          <div class="flex items-center space-x-2 p-3 border border-gray-300 rounded-md bg-gray-50">
            <svg class="w-4 h-4 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span class="text-sm text-gray-500">Loading documents...</span>
          </div>
        {:else if documents.length === 0}
          <div class="p-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-red-500">
            No documents available. Please try refreshing the page.
          </div>
        {:else}
          <!-- Dropdown Button -->
          <button
            type="button"
            id="document-dropdown-button"
            class="w-full px-4 py-3 text-base text-left border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between {selectedDocumentId === '' ? 'text-red-500 border-red-300' : 'text-gray-900'} disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed min-h-[48px]"
            disabled={isFormDisabled}
            onclick={!isFormDisabled ? toggleDocumentDropdown : undefined}
          >
            <div class="flex-1 min-w-0">
              {#if selectedDocumentId === ''}
                <span class="text-gray-500">Select a document</span>
              {:else}
                {@const selectedDoc = getSelectedDocument()}
                {#if selectedDoc}
                  <div>
                    <div class="text-sm font-medium text-gray-900">{selectedDoc.title}</div>
                    <div class="text-xs text-gray-500">{selectedDoc.original_name}</div>
                  </div>
                {/if}
              {/if}
            </div>
            <svg 
              class="w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2 {isDocumentDropdownOpen ? 'transform rotate-180' : ''}" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <!-- Dropdown Content -->
          {#if isDocumentDropdownOpen}
            <div 
              id="document-dropdown"
              class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
            >
              <div class="p-2">
                {#each documents as document (document.id)}
                  <button
                    type="button"
                    class="w-full text-left p-2 hover:bg-gray-50 rounded cursor-pointer {selectedDocumentId === document.id.toString() ? 'bg-blue-50' : ''}"
                    onclick={() => handleDocumentChange(document.id.toString())}
                  >
                    <div class="text-sm font-medium text-gray-900">
                      {document.title}
                    </div>
                    <div class="text-xs text-gray-500">
                      {document.original_name}
                    </div>
                    {#if document.remark}
                      <div class="text-xs text-gray-400 mt-1">
                        {document.remark}
                      </div>
                    {/if}
                  </button>
                {/each}
              </div>
            </div>
          {/if}
        {/if}
        
        {#if selectedDocumentId === '' && !documentsLoading && documents.length > 0}
          <p class="text-xs text-red-500 mt-1">Please select a document</p>
        {/if}
      </div>

      <!-- Description -->
      <div>
        <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows="4"
          disabled={isFormDisabled}
          class="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
          placeholder="Enter report description"
        ></textarea>
      </div>

      <!-- Audio Upload -->
      <div>
        <label for="audio" class="block text-sm font-medium text-gray-700 mb-2">
          Audio Files (Multiple files allowed)
        </label>
        
        <!-- Upload Area -->
        <div 
          class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors {isFormDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}"
          onclick={!isFormDisabled ? handleAudioAreaClick : undefined}
        >
          <svg class="mx-auto h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 3v10a1 1 0 001 1h8a1 1 0 001-1V7m-9 0h10M9 11v4m6-4v4"/>
          </svg>
          <p class="mt-2 text-sm text-gray-600">
            <span class="font-medium text-blue-600 hover:text-blue-500">
              Click to select audio files
            </span>
            or drag and drop
          </p>
          <p class="text-xs text-gray-500">MP3, M4A, WAV, AAC up to 50MB each</p>
          <input 
            type="file" 
            id="audio" 
            name="audio" 
            class="hidden" 
            accept=".mp3,.m4a,.wav,.aac"
            multiple
            disabled={isFormDisabled}
            onchange={handleAudioChange}
          />
        </div>
        
        <!-- Selected Audio Files -->
        {#if selectedAudioFiles.length > 0}
          <div class="mt-4 space-y-2">
            <p class="text-sm font-medium text-gray-700">Selected Audio Files ({selectedAudioFiles.length}):</p>
            <div class="space-y-2">
              {#each selectedAudioFiles as file, index (file.name + index)}
                <div class="flex items-center justify-between p-2 bg-blue-50 rounded-md">
                  <div class="flex items-center space-x-2">
                    <svg class="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                    <span class="text-sm text-gray-900">{file.name}</span>
                    <span class="text-xs text-gray-500">({Math.round(file.size / 1024 / 1024 * 100) / 100} MB)</span>
                  </div>
                  <button
                    type="button"
                    onclick={() => removeAudioFile(index)}
                    disabled={isFormDisabled}
                    class="text-red-600 hover:text-red-800 p-1 rounded disabled:opacity-50"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <!-- Video Upload -->
      <div>
        <label for="video" class="block text-sm font-medium text-gray-700 mb-2">
          Video Files (Multiple files allowed)
        </label>
        
        <!-- Upload Area -->
        <div 
          class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors {isFormDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}"
          onclick={!isFormDisabled ? handleVideoAreaClick : undefined}
        >
          <svg class="mx-auto h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
          </svg>
          <p class="mt-2 text-sm text-gray-600">
            <span class="font-medium text-blue-600 hover:text-blue-500">
              Click to select video files
            </span>
            or drag and drop
          </p>
          <p class="text-xs text-gray-500">MP4, AVI, MOV, WMV, MKV up to 100MB each</p>
          <input 
            type="file" 
            id="video" 
            name="video" 
            class="hidden" 
            accept=".mp4,.avi,.mov,.wmv,.mkv"
            multiple
            disabled={isFormDisabled}
            onchange={handleVideoChange}
          />
        </div>
        
        <!-- Selected Video Files -->
        {#if selectedVideoFiles.length > 0}
          <div class="mt-4 space-y-2">
            <p class="text-sm font-medium text-gray-700">Selected Video Files ({selectedVideoFiles.length}):</p>
            <div class="space-y-2">
              {#each selectedVideoFiles as file, index (file.name + index)}
                <div class="flex items-center justify-between p-2 bg-green-50 rounded-md">
                  <div class="flex items-center space-x-2">
                    <svg class="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                    <span class="text-sm text-gray-900">{file.name}</span>
                    <span class="text-xs text-gray-500">({Math.round(file.size / 1024 / 1024 * 100) / 100} MB)</span>
                  </div>
                  <button
                    type="button"
                    onclick={() => removeVideoFile(index)}
                    disabled={isFormDisabled}
                    class="text-red-600 hover:text-red-800 p-1 rounded disabled:opacity-50"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <!-- File Selection Summary -->
      {#if selectedAudioFiles.length > 0 || selectedVideoFiles.length > 0}
        <div class="text-sm text-green-600 flex items-center space-x-1">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
          <span>Ready to create report with {selectedAudioFiles.length + selectedVideoFiles.length} file(s)</span>
        </div>
      {:else if selectedDocumentId !== ''}
        <div class="text-sm text-amber-600 flex items-center space-x-1">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          <span>Please select at least one audio or video file</span>
        </div>
      {/if}

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
          disabled={isSubmitting || selectedDocumentId === '' || (selectedAudioFiles.length === 0 && selectedVideoFiles.length === 0)}
          class="px-6 py-3 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 border border-transparent rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {#if isSubmitting}
            <Loading size="sm" />
            <span>{isEditMode ? 'Updating...' : 'Creating...'}</span>
          {:else}
            <span>{isEditMode ? 'Update Report' : 'Create Report'}</span>
          {/if}
        </button>
      </div>
    </form>
  </div>
</div>