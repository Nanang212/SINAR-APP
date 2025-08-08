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
  
  // Infinite scrolling state
  let currentPage = $state(1);
  let hasMorePages = $state(true);
  let isLoadingMore = $state(false);
  let totalDocuments = $state(0);
  
  // Search state
  let searchQuery = $state('');
  let isSearching = $state(false);
  
  // Media items (notes is now separate media type)
  interface MediaItem {
    id: string;
    type: 'audio' | 'video' | 'url' | 'notes';
    file?: File;
    url?: string;
    text?: string; // for notes content
    createdAt: Date;
  }
  
  let mediaItems = $state<MediaItem[]>([]);
  
  // Modal/dropdown states
  let showAddMediaDropdown = $state(false);
  let showMediaForm = $state(false);
  let currentMediaType = $state<'audio' | 'video' | 'url' | 'notes' | null>(null);
  
  // Form states for adding media
  let selectedFile = $state<File | null>(null);
  let urlInput = $state('http://');
  let textInput = $state(''); // renamed from noteInput, now for notes content
  
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
    await loadDocuments(1, '', false);
  });

  // Load report data into form when provided
  $effect(() => {
    if (reportData && formRef) {
      populateForm(reportData);
    }
  });

  async function loadDocuments(page = 1, search = '', append = false) {
    console.log(`🚀 Loading documents - Page: ${page}, Search: "${search}", Append: ${append}`);
    
    if (page === 1) {
      documentsLoading = true;
    } else {
      isLoadingMore = true;
    }
    
    try {
      // Use paginated documents with fixed order 'desc' (newest first)
      const response = await documentService.getPaginatedDocuments({
        page: page,
        limit: 10,
        search: search.trim() || undefined,
        order: 'desc' // Always newest first
      });
      
      console.log('📋 Document response:', response);
      
      if (response.status && response.data) {
        const paginatedData = response.data;
        const newDocuments = paginatedData.data || [];
        
        if (append && page > 1) {
          // Append new documents to existing list
          documents = [...documents, ...newDocuments];
          console.log(`➕ Appended ${newDocuments.length} documents. Total: ${documents.length}`);
        } else {
          // Replace documents (first load or search)
          documents = newDocuments;
          console.log(`🔄 Loaded ${newDocuments.length} documents`);
        }
        
        // Update pagination info
        currentPage = page;
        totalDocuments = paginatedData.total || 0;
        hasMorePages = page < (paginatedData.totalPages || 0);
        
        console.log(`📊 Page ${page}/${paginatedData.totalPages || 0}, Total: ${totalDocuments}, HasMore: ${hasMorePages}`);
      } else {
        console.error('Failed to load documents:', response.message);
        if (!append) {
          documents = [];
          totalDocuments = 0;
          hasMorePages = false;
        }
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      if (!append) {
        documents = [];
        totalDocuments = 0;
        hasMorePages = false;
      }
    } finally {
      documentsLoading = false;
      isLoadingMore = false;
      isSearching = false;
    }
  }
  
  // Load more documents for infinite scroll
  async function loadMoreDocuments() {
    if (!hasMorePages || isLoadingMore) return;
    
    const nextPage = currentPage + 1;
    await loadDocuments(nextPage, searchQuery, true);
  }
  
  // Handle search with debouncing
  let searchTimeout: NodeJS.Timeout;
  async function handleSearchChange(query: string) {
    searchQuery = query;
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // If search is empty, reset to initial state
    if (query.trim() === '') {
      console.log('🔍 Search cleared, resetting to initial state');
      currentPage = 1;
      hasMorePages = true;
      await loadDocuments(1, '', false);
      return;
    }
    
    // Debounce search
    isSearching = true;
    searchTimeout = setTimeout(async () => {
      console.log('🔍 Searching for:', query);
      currentPage = 1;
      hasMorePages = true;
      await loadDocuments(1, query, false);
    }, 500);
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

    // Validate at least one media item is provided
    if (mediaItems.length === 0) {
      modalToastStore.error('Please add at least one media item');
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
        await handleMultipleContentUpload(selectedDocumentId, description);
      }
    } catch (error) {
      console.error('Submit error:', error);
      modalToastStore.error('An unexpected error occurred');
    } finally {
      isSubmitting = false;
      isFormDisabled = false;
      uploadProgress = { current: 0, total: 0, currentFile: '' };
    }

    // Also call parent callback if provided
    const formData = new FormData();
    formData.append('document_id', selectedDocumentId);
    if (description) formData.append('description', description);
    onSubmit?.(formData);
  }

  async function handleMultipleContentUpload(documentId: string, description: string) {
    uploadProgress.total = mediaItems.length;
    uploadProgress.current = 0;

    let successCount = 0;
    let failedItems: string[] = [];

    // Sequential upload of all media items
    for (let i = 0; i < mediaItems.length; i++) {
      const item = mediaItems[i];
      uploadProgress.current = i + 1;
      
      const displayName = item.file ? item.file.name : 
                         item.url ? item.url.substring(0, 30) + '...' : 
                         item.text ? `Notes: ${item.text.substring(0, 30)}...` :
                         `${item.type} item`;
      uploadProgress.currentFile = displayName;

      try {
        const formData = new FormData();
        formData.append('document_id', documentId);
        if (description) {
          formData.append('description', description);
        }
        
        // Add content based on type
        if (item.file) {
          formData.append(item.type, item.file);
        } else if (item.url) {
          formData.append('link', item.url);
        } else if (item.text) {
          formData.append('text', item.text);
        }

        console.log(`Uploading ${item.type} ${i + 1}/${mediaItems.length}: ${displayName}`);
        
        const result = await reportService.createReportWithFormData(formData);
        
        if (result.status) {
          successCount++;
          console.log(`✅ Successfully uploaded: ${displayName}`);
        } else {
          failedItems.push(displayName);
          console.error(`❌ Failed to upload: ${displayName} - ${result.message}`);
          
          // Show specific error message immediately when create fails
          modalToastStore.error(result.message || 'Failed to create report');
          
          // Re-enable form so user can fix the issue
          isFormDisabled = false;
          
          // Stop the upload process on first failure
          break;
        }

        // Small delay between uploads
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        failedItems.push(displayName);
        console.error(`❌ Error uploading ${displayName}:`, error);
        
        // Show specific error message immediately
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        modalToastStore.error(errorMessage);
        
        // Re-enable form so user can fix the issue
        isFormDisabled = false;
        
        // Stop the upload process on error
        break;
      }
    }

    // Show final results
    if (successCount > 0 && failedItems.length === 0) {
      modalToastStore.success(`All ${successCount} items uploaded successfully!`);
      // Reset form on complete success
      handleReset();
    }
    // Don't show additional error messages as they were already shown immediately
  }

  function handleReset() {
    selectedDocumentId = '';
    mediaItems = [];
    uploadProgress = { current: 0, total: 0, currentFile: '' };
    isDocumentDropdownOpen = false;
    isFormDisabled = false;
    showAddMediaDropdown = false;
    showMediaForm = false;
    currentMediaType = null;
    selectedFile = null;
    urlInput = 'http://';
    textInput = '';
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

  // Media handling functions
  function toggleAddMediaDropdown() {
    showAddMediaDropdown = !showAddMediaDropdown;
    if (!showAddMediaDropdown) {
      showMediaForm = false;
      currentMediaType = null;
    }
  }

  function selectMediaType(type: 'audio' | 'video' | 'url' | 'notes') {
    currentMediaType = type;
    showMediaForm = true;
    showAddMediaDropdown = false;
    
    // Reset form
    selectedFile = null;
    urlInput = 'http://';
    textInput = '';
  }

  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file && currentMediaType) {
      const allowedExtensions = currentMediaType === 'audio' 
        ? ['.mp3', '.m4a', '.wav', '.aac']
        : ['.mp4', '.avi', '.mov', '.wmv', '.mkv'];
      
      const fileName = file.name.toLowerCase();
      const isValidType = allowedExtensions.some(ext => fileName.endsWith(ext));
      
      if (isValidType) {
        selectedFile = file;
      } else {
        modalToastStore.error(`Invalid ${currentMediaType} file. Allowed: ${allowedExtensions.join(', ')}`);
        input.value = '';
      }
    }
  }

  function addMediaItem() {
    if (!currentMediaType) return;

    // Validation
    if (currentMediaType === 'url') {
      const trimmedUrl = urlInput.trim();
      if (!trimmedUrl || trimmedUrl === 'http://' || trimmedUrl === 'https://') {
        modalToastStore.error('Please enter a valid URL');
        return;
      }
      
      // Add URL media item
      const newItem: MediaItem = {
        id: Date.now().toString(),
        type: 'url',
        url: trimmedUrl,
        createdAt: new Date()
      };
      
      mediaItems = [...mediaItems, newItem];
    } else if (currentMediaType === 'notes') {
      const trimmedText = textInput.trim();
      if (!trimmedText) {
        modalToastStore.error('Please enter notes content');
        return;
      }
      
      // Add Notes media item
      const newItem: MediaItem = {
        id: Date.now().toString(),
        type: 'notes',
        text: trimmedText,
        createdAt: new Date()
      };
      
      mediaItems = [...mediaItems, newItem];
    } else {
      // Audio or Video file
      if (!selectedFile) {
        modalToastStore.error(`Please select a ${currentMediaType} file`);
        return;
      }
      
      const newItem: MediaItem = {
        id: Date.now().toString(),
        type: currentMediaType,
        file: selectedFile,
        createdAt: new Date()
      };
      
      mediaItems = [...mediaItems, newItem];
    }

    // Reset form
    showMediaForm = false;
    currentMediaType = null;
    selectedFile = null;
    urlInput = 'http://';
    textInput = '';
  }

  function removeMediaItem(id: string) {
    mediaItems = mediaItems.filter(item => item.id !== id);
  }

  function cancelMediaForm() {
    showMediaForm = false;
    currentMediaType = null;
    selectedFile = null;
    urlInput = 'http://';
    textInput = '';
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
        {:else if documents.length === 0 && searchQuery.trim() === ''}
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
                    <div class="mt-1">
                      <span
                        class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {selectedDoc.is_downloaded
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'}"
                      >
                        {selectedDoc.is_downloaded ? "Downloaded" : "Not Downloaded"}
                      </span>
                    </div>
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
              class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden"
            >
              <!-- Search Bar inside dropdown -->
              <div class="p-3 border-b border-gray-100 bg-gray-50">
                <div class="relative">
                  <input
                    type="text"
                    placeholder="Search documents..."
                    bind:value={searchQuery}
                    oninput={(e) => handleSearchChange(e.currentTarget.value)}
                    disabled={isFormDisabled}
                    class="w-full pl-8 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                    autofocus
                  />
                  <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    {#if isSearching}
                      <svg class="h-4 w-4 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    {:else}
                      <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    {/if}
                  </div>
                </div>
                
                <!-- Search results info -->
                <div class="mt-1 text-xs text-gray-600">
                  {#if searchQuery.trim() !== ''}
                    {#if isSearching}
                      Searching...
                    {:else}
                      Found {totalDocuments} document{totalDocuments !== 1 ? 's' : ''} for "{searchQuery}"
                      {#if totalDocuments === 0}
                        - <button 
                          onclick={() => handleSearchChange('')} 
                          class="text-blue-600 hover:text-blue-800 underline"
                        >
                          Clear search
                        </button>
                      {/if}
                    {/if}
                  {:else if totalDocuments > 0}
                    Total {totalDocuments} documents (newest first)
                  {/if}
                </div>
              </div>
              
              <!-- Documents List -->
              <div class="max-h-48 overflow-y-auto"
                   onscroll={(e) => {
                     const element = e.currentTarget;
                     const threshold = 50; // Load more when within 50px of bottom
                     if (element.scrollTop + element.clientHeight >= element.scrollHeight - threshold) {
                       loadMoreDocuments();
                     }
                   }}
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
                    <div class="mt-1">
                      <span
                        class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {document.is_downloaded
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'}"
                      >
                        {document.is_downloaded ? "Downloaded" : "Not Downloaded"}
                      </span>
                    </div>
                  </button>
                {/each}
                
                <!-- Load More Indicator -->
                {#if isLoadingMore}
                  <div class="flex items-center justify-center p-3">
                    <svg class="w-4 h-4 text-blue-600 animate-spin mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span class="text-sm text-gray-600">Loading more...</span>
                  </div>
                {:else if hasMorePages && documents.length > 0}
                  <div class="text-center p-2">
                    <button
                      type="button"
                      onclick={loadMoreDocuments}
                      class="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Load more documents
                    </button>
                  </div>
                {:else if !hasMorePages && documents.length > 0}
                  <div class="text-center p-2">
                    <span class="text-xs text-gray-500">
                      All {totalDocuments} documents loaded
                    </span>
                  </div>
                {/if}
                
                <!-- No results for search -->
                {#if documents.length === 0 && searchQuery.trim() !== '' && !isSearching}
                  <div class="text-center p-6">
                    <svg class="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <div class="text-sm text-gray-600 mb-3">
                      No documents found for <span class="font-medium">"{searchQuery}"</span>
                    </div>
                    <div class="text-xs text-gray-500 mb-3">
                      Try different keywords or check your spelling
                    </div>
                    <button
                      type="button"
                      onclick={() => handleSearchChange('')}
                      class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                    >
                      <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Show all documents
                    </button>
                  </div>
                {/if}
                </div>
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

      <!-- Media Upload Section -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-4">
          Media & Content
        </label>
        
        <div class="relative">
          <!-- Add Media Button -->
          <button
            type="button"
            onclick={toggleAddMediaDropdown}
            disabled={isFormDisabled}
            class="w-full px-4 py-3 text-base border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span class="text-gray-600 font-medium">Add Media</span>
          </button>

          <!-- Add Media Dropdown -->
          {#if showAddMediaDropdown}
            <div class="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <div class="p-2">
                <button
                  type="button"
                  onclick={() => selectMediaType('audio')}
                  class="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 rounded-md transition-colors"
                >
                  <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                  <div>
                    <div class="text-sm font-medium text-gray-900">Audio File</div>
                    <div class="text-xs text-gray-500">MP3, M4A, WAV, AAC</div>
                  </div>
                </button>
                
                <button
                  type="button"
                  onclick={() => selectMediaType('video')}
                  class="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 rounded-md transition-colors"
                >
                  <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <div class="text-sm font-medium text-gray-900">Video File</div>
                    <div class="text-xs text-gray-500">MP4, AVI, MOV, WMV, MKV</div>
                  </div>
                </button>
                
                <button
                  type="button"
                  onclick={() => selectMediaType('url')}
                  class="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 rounded-md transition-colors"
                >
                  <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <div>
                    <div class="text-sm font-medium text-gray-900">URL Link</div>
                    <div class="text-xs text-gray-500">Website or online resource</div>
                  </div>
                </button>
                
                <button
                  type="button"
                  onclick={() => selectMediaType('notes')}
                  class="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 rounded-md transition-colors"
                >
                  <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <div>
                    <div class="text-sm font-medium text-gray-900">Notes</div>
                    <div class="text-xs text-gray-500">Text notes or observations</div>
                  </div>
                </button>
              </div>
            </div>
          {/if}
        </div>

        <!-- Media Form Modal -->
        {#if showMediaForm && currentMediaType}
          <div class="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-medium text-gray-900 capitalize">
                Add {currentMediaType} {currentMediaType === 'url' ? 'Link' : 'File'}
              </h3>
              <button
                type="button"
                onclick={cancelMediaForm}
                class="text-gray-400 hover:text-gray-600"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="space-y-4">
              {#if currentMediaType === 'url'}
                <!-- URL Input -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    URL *
                  </label>
                  <input
                    type="url"
                    bind:value={urlInput}
                    placeholder="https://example.com"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              {:else if currentMediaType === 'notes'}
                <!-- Notes Text Input -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Notes Content *
                  </label>
                  <textarea
                    bind:value={textInput}
                    rows="4"
                    placeholder="Enter your notes, observations, or text content..."
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  ></textarea>
                </div>
              {:else}
                <!-- File Input -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    {currentMediaType === 'audio' ? 'Audio' : 'Video'} File *
                  </label>
                  <div class="border-2 border-dashed border-gray-300 rounded-md p-4 text-center hover:border-gray-400 transition-colors">
                    <input
                      type="file"
                      accept={currentMediaType === 'audio' ? '.mp3,.m4a,.wav,.aac' : '.mp4,.avi,.mov,.wmv,.mkv'}
                      onchange={handleFileSelect}
                      class="hidden"
                      id="mediaFileInput"
                    />
                    <label for="mediaFileInput" class="cursor-pointer">
                      {#if selectedFile}
                        <div class="flex items-center justify-center space-x-2">
                          <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span class="text-sm text-gray-900">{selectedFile.name}</span>
                          <span class="text-xs text-gray-500">({Math.round(selectedFile.size / 1024 / 1024 * 100) / 100} MB)</span>
                        </div>
                      {:else}
                        <div>
                          <svg class="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p class="mt-2 text-sm text-gray-600">
                            Click to select {currentMediaType} file
                          </p>
                          <p class="text-xs text-gray-500">
                            {currentMediaType === 'audio' ? 'MP3, M4A, WAV, AAC' : 'MP4, AVI, MOV, WMV, MKV'}
                          </p>
                        </div>
                      {/if}
                    </label>
                  </div>
                </div>
              {/if}

              <!-- Form Actions -->
              <div class="flex justify-end space-x-3">
                <button
                  type="button"
                  onclick={cancelMediaForm}
                  class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onclick={addMediaItem}
                  class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                >
                  Add {currentMediaType === 'url' ? 'Link' : currentMediaType === 'notes' ? 'Notes' : 'File'}
                </button>
              </div>
            </div>
          </div>
        {/if}

        <!-- Media Items Table -->
        {#if mediaItems.length > 0}
          <div class="mt-6">
            <h4 class="text-sm font-medium text-gray-700 mb-3">Added Media Items ({mediaItems.length})</h4>
            <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Content</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Content</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  {#each mediaItems as item (item.id)}
                    <tr class="hover:bg-gray-50">
                      <td class="px-4 py-3 whitespace-nowrap">
                        <div class="flex items-center">
                          {#if item.type === 'audio'}
                            <div class="flex items-center space-x-2">
                              <div class="w-2 h-2 bg-blue-600 rounded-full"></div>
                              <span class="text-xs font-medium text-blue-600 uppercase">Audio</span>
                            </div>
                          {:else if item.type === 'video'}
                            <div class="flex items-center space-x-2">
                              <div class="w-2 h-2 bg-green-600 rounded-full"></div>
                              <span class="text-xs font-medium text-green-600 uppercase">Video</span>
                            </div>
                          {:else if item.type === 'url'}
                            <div class="flex items-center space-x-2">
                              <div class="w-2 h-2 bg-purple-600 rounded-full"></div>
                              <span class="text-xs font-medium text-purple-600 uppercase">URL</span>
                            </div>
                          {:else if item.type === 'notes'}
                            <div class="flex items-center space-x-2">
                              <div class="w-2 h-2 bg-amber-600 rounded-full"></div>
                              <span class="text-xs font-medium text-amber-600 uppercase">Notes</span>
                            </div>
                          {/if}
                        </div>
                      </td>
                      <td class="px-4 py-3">
                        <div class="text-sm text-gray-900">
                          {#if item.file}
                            <div class="flex items-center space-x-2">
                              <span class="truncate max-w-[200px]" title={item.file.name}>{item.file.name}</span>
                              <span class="text-xs text-gray-500">({Math.round(item.file.size / 1024 / 1024 * 100) / 100} MB)</span>
                            </div>
                          {:else if item.url}
                            <a href={item.url} target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline truncate max-w-[200px] block" title={item.url}>
                              {item.url.length > 40 ? item.url.substring(0, 40) + '...' : item.url}
                            </a>
                          {:else if item.text}
                            <div class="text-sm text-gray-900">
                              <span class="truncate max-w-[200px] block" title={item.text}>
                                {item.text.length > 50 ? item.text.substring(0, 50) + '...' : item.text}
                              </span>
                            </div>
                          {/if}
                        </div>
                      </td>
                      <td class="px-4 py-3">
                        <div class="text-sm text-gray-600">
                          {#if item.type === 'notes'}
                            <span class="text-gray-400 italic">Text Content</span>
                          {:else}
                            <span class="text-gray-400 italic">Media File</span>
                          {/if}
                        </div>
                      </td>
                      <td class="px-4 py-3 whitespace-nowrap">
                        <div class="flex items-center space-x-2">
                          {#if item.isExisting}
                            <button
                              type="button"
                              onclick={() => replaceExistingReport(item)}
                              disabled={isFormDisabled}
                              class="text-blue-600 hover:text-blue-800 p-1 rounded disabled:opacity-50"
                              title="Replace this report"
                            >
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </button>
                          {/if}
                          <button
                            type="button"
                            onclick={() => removeMediaItem(item.id)}
                            disabled={isFormDisabled}
                            class="text-red-600 hover:text-red-800 p-1 rounded disabled:opacity-50"
                            title={item.isExisting ? "Delete from server" : "Remove item"}
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        {/if}

        <!-- Summary -->
        {#if mediaItems.length > 0}
          <div class="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div class="text-sm text-green-700 font-medium">
              Ready to upload {mediaItems.length} media item(s)
            </div>
          </div>
        {:else if selectedDocumentId !== ''}
          <div class="mt-4 text-sm text-amber-600 flex items-center space-x-1">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            <span>Please add at least one media item</span>
          </div>
        {/if}
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
          disabled={isSubmitting || selectedDocumentId === '' || mediaItems.length === 0}
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