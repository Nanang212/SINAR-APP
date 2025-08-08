<script lang="ts">
  import { fly } from "svelte/transition";
  import { onMount, onDestroy } from 'svelte';

  export let isOpen = false;
  export let videoUrl = '';
  export let fileName = '';
  export let onClose: () => void = () => {};

  let videoElement: HTMLVideoElement;
  let isPlaying = false;
  let currentTime = 0;
  let duration = 0;
  let volume = 1.0;
  let isLoading = false;
  let error = '';

  // Modal position, dragging, and resizing
  let modalElement: HTMLDivElement;
  let isDragging = false;
  let isResizing = false;
  let resizeHandle = '';
  let dragOffset = { x: 0, y: 0 };
  let modalPosition = { x: 0, y: 0 };
  let modalSize = { width: 600, height: 400 };
  
  const minSize = { width: 360, height: 320 }; // Ensure controls are always visible and no overlap
  const maxSize = { width: 1400, height: 900 };

  let loadVideoRetryCount = 0;
  const MAX_RETRY_COUNT = 3;

  // Initialize modal position to center
  onMount(() => {
    if (typeof window !== 'undefined') {
      modalPosition.x = (window.innerWidth - modalSize.width) / 2;
      modalPosition.y = (window.innerHeight - modalSize.height) / 2;
      
      if (videoElement) {
        videoElement.volume = volume;
      }
    }
  });

  // Prevent multiple calls to loadVideo
  let isLoadingVideo = false;
  let currentVideoUrl = '';

  $: {
    if (isOpen && videoUrl && videoUrl.length > 0 && videoUrl !== currentVideoUrl) {
      currentVideoUrl = videoUrl;
      isLoadingVideo = false; // Reset flag for new video
      setTimeout(() => {
        loadVideo();
      }, 100);
    } else if (!isOpen) {
      stopVideo();
      isLoadingVideo = false;
      currentVideoUrl = '';
    }
  }

  async function loadVideo() {
    
    if (isLoadingVideo) {
      return;
    }
    
    
    if (!videoElement) {
      if (loadVideoRetryCount < MAX_RETRY_COUNT) {
        loadVideoRetryCount++;
        setTimeout(() => {
          if (videoElement && videoUrl && !isLoadingVideo) {
            loadVideo();
          }
        }, 200);
      }
      return;
    }
    
    if (!videoUrl) {
      return;
    }
    
    isLoadingVideo = true;
    loadVideoRetryCount = 0;
    isLoading = true;
    error = '';
    
    try {
      
      // Stop any existing video
      videoElement.pause();
      videoElement.currentTime = 0;
      
      // Set properties and load (source is set via <source> elements in template)
      videoElement.volume = volume;
      videoElement.muted = false;
      
      // Clear any existing src first
      if (videoElement.src) {
        videoElement.removeAttribute('src');
        videoElement.src = '';
      }
      
      
      videoElement.load();
      
      // Simple approach - just set isLoading false after a brief delay
      setTimeout(() => {
        isLoading = false;
        isLoadingVideo = false;
      }, 1500);
      
    } catch (err) {
      error = `Failed to load video: ${err.message}`;
      isLoading = false;
      isLoadingVideo = false;
      
      // Try simple fallback - just set source and let video element handle it
      if (videoElement && videoUrl) {
        videoElement.src = videoUrl;
      }
    }
  }

  function handleLoadedData() {
    isLoading = false;
    duration = videoElement.duration;
    
    if (videoElement) {
      videoElement.volume = volume;
    }
  }

  function handleLoadError(event) {
    
    isLoading = false;
    isLoadingVideo = false;
    error = `Failed to load video file: ${videoElement?.error?.message || 'Unknown error'}`;
  }

  async function togglePlayPause() {
    if (!videoElement) return;

    try {
      if (isPlaying) {
        videoElement.pause();
        isPlaying = false;
      } else {
        videoElement.volume = Math.max(volume, 0.5);
        videoElement.muted = false;
        
        await videoElement.play();
        isPlaying = true;
      }
    } catch (playError) {
      if (!isPlaying) {
        try {
          videoElement.volume = 1.0;
          videoElement.muted = false;
          videoElement.play();
          isPlaying = true;
        } catch (altError) {
          error = 'Failed to play video';
          isPlaying = false;
        }
      }
    }
  }

  function handleTimeUpdate() {
    if (videoElement && !isSeeking) {
      currentTime = videoElement.currentTime;
    }
  }

  function handleEnded() {
    isPlaying = false;
    currentTime = 0;
  }

  // Track if user is seeking to prevent interference with time updates
  let isSeeking = false;

  function seek(event: Event) {
    const input = event.target as HTMLInputElement;
    const time = (parseFloat(input.value) / 100) * duration;
    
    if (videoElement && !isNaN(time)) {
      isSeeking = true;
      videoElement.currentTime = time;
      
      // Reset seeking flag after a short delay
      setTimeout(() => {
        isSeeking = false;
      }, 100);
    }
  }

  function changeVolume(event: Event) {
    const input = event.target as HTMLInputElement;
    volume = parseFloat(input.value) / 100;
    if (videoElement) {
      videoElement.volume = volume;
    }
  }

  function stopVideo() {
    if (videoElement) {
      videoElement.pause();
      videoElement.currentTime = 0;
      videoElement.src = '';
    }
    isPlaying = false;
    isLoading = false;
    isLoadingVideo = false;
    error = '';
    duration = 0;
    currentTime = 0;
  }

  function formatTime(seconds: number): string {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // Drag functionality
  function handleMouseDown(event: MouseEvent) {
    const target = event.target as HTMLElement;
    
    // Check if it's a resize handle
    if (target.classList.contains('resize-handle')) {
      isResizing = true;
      resizeHandle = target.dataset.handle || '';
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      event.preventDefault();
      return;
    }
    
    // Check if it's draggable area
    if (target === event.currentTarget || target.classList.contains('drag-handle')) {
      isDragging = true;
      const rect = modalElement.getBoundingClientRect();
      dragOffset.x = event.clientX - rect.left;
      dragOffset.y = event.clientY - rect.top;
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      event.preventDefault();
    }
  }

  function handleMouseMove(event: MouseEvent) {
    if (isResizing) {
      handleResize(event);
    } else if (isDragging) {
      handleDrag(event);
    }
  }

  function handleDrag(event: MouseEvent) {
    modalPosition.x = event.clientX - dragOffset.x;
    modalPosition.y = event.clientY - dragOffset.y;
    
    // Keep modal within viewport bounds
    const maxX = window.innerWidth - modalSize.width;
    const maxY = window.innerHeight - modalSize.height;
    
    modalPosition.x = Math.max(0, Math.min(modalPosition.x, maxX));
    modalPosition.y = Math.max(0, Math.min(modalPosition.y, maxY));
  }

  function handleResize(event: MouseEvent) {
    const rect = modalElement.getBoundingClientRect();
    let newWidth = modalSize.width;
    let newHeight = modalSize.height;
    let newX = modalPosition.x;
    let newY = modalPosition.y;

    switch (resizeHandle) {
      case 'se': // bottom-right
        newWidth = Math.max(minSize.width, Math.min(maxSize.width, event.clientX - rect.left));
        newHeight = Math.max(minSize.height, Math.min(maxSize.height, event.clientY - rect.top));
        break;
      case 'sw': // bottom-left
        newWidth = Math.max(minSize.width, Math.min(maxSize.width, rect.right - event.clientX));
        newHeight = Math.max(minSize.height, Math.min(maxSize.height, event.clientY - rect.top));
        newX = Math.max(0, event.clientX);
        break;
      case 'ne': // top-right
        newWidth = Math.max(minSize.width, Math.min(maxSize.width, event.clientX - rect.left));
        newHeight = Math.max(minSize.height, Math.min(maxSize.height, rect.bottom - event.clientY));
        newY = Math.max(0, event.clientY);
        break;
      case 'nw': // top-left
        newWidth = Math.max(minSize.width, Math.min(maxSize.width, rect.right - event.clientX));
        newHeight = Math.max(minSize.height, Math.min(maxSize.height, rect.bottom - event.clientY));
        newX = Math.max(0, event.clientX);
        newY = Math.max(0, event.clientY);
        break;
      case 'n': // top
        newHeight = Math.max(minSize.height, Math.min(maxSize.height, rect.bottom - event.clientY));
        newY = Math.max(0, event.clientY);
        break;
      case 's': // bottom
        newHeight = Math.max(minSize.height, Math.min(maxSize.height, event.clientY - rect.top));
        break;
      case 'w': // left
        newWidth = Math.max(minSize.width, Math.min(maxSize.width, rect.right - event.clientX));
        newX = Math.max(0, event.clientX);
        break;
      case 'e': // right
        newWidth = Math.max(minSize.width, Math.min(maxSize.width, event.clientX - rect.left));
        break;
    }

    modalSize.width = newWidth;
    modalSize.height = newHeight;
    modalPosition.x = newX;
    modalPosition.y = newY;
  }

  function handleMouseUp() {
    isDragging = false;
    isResizing = false;
    resizeHandle = '';
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }

  function closeModal() {
    stopVideo();
    isLoadingVideo = false;
    currentVideoUrl = '';
    onClose();
  }

  onDestroy(() => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  });
</script>

{#if isOpen}
  <!-- Backdrop with blur -->
  <div 
    class="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-[10000]"
    onclick={closeModal}
    transition:fly={{ duration: 300 }}
  ></div>

  <!-- Draggable & Resizable Video Modal -->
  <div
    bind:this={modalElement}
    class="fixed bg-white rounded-lg shadow-2xl border border-gray-200 z-[10001] select-none overflow-hidden"
    style="left: {modalPosition.x}px; top: {modalPosition.y}px; width: {modalSize.width}px; height: {modalSize.height}px;"
    transition:fly={{ x: 50, duration: 300 }}
    role="dialog"
    aria-modal="true"
  >
    <!-- Header with drag handle -->
    <div 
      class="drag-handle flex items-center justify-between p-3 bg-gradient-to-r from-red-500 to-pink-600 text-white cursor-move"
      onmousedown={handleMouseDown}
    >
      <div class="flex items-center space-x-2 pointer-events-none">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <span class="font-medium text-sm truncate max-w-[200px]">Video Player</span>
      </div>
      <button
        onclick={closeModal}
        class="text-white hover:text-gray-300 transition-colors p-1 rounded"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Video Content Area -->
    <div class="flex flex-col h-full">
      <!-- Video Container -->
      <div class="flex-1 bg-black relative overflow-hidden" style="min-height: {Math.max(100, modalSize.height - (modalSize.width < 400 ? 190 : 170))}px; max-height: {modalSize.height - (modalSize.width < 400 ? 190 : 170)}px;">
        {#if isLoading}
          <div class="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div class="flex flex-col items-center text-white">
              <svg class="w-8 h-8 animate-spin mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span class="text-sm">Loading video...</span>
            </div>
          </div>
        {:else if error}
          <div class="absolute inset-0 flex items-center justify-center bg-gray-900">
            <span class="text-red-400 text-sm">{error}</span>
          </div>
        {:else}
          <video
            bind:this={videoElement}
            class="w-full h-full object-contain"
            preload="metadata"
            controls={false}
            muted={false}
            onloadeddata={handleLoadedData}
            onerror={handleLoadError}
            ontimeupdate={handleTimeUpdate}
            onended={handleEnded}
            onplay={() => { 
              isPlaying = true; 
            }}
            onpause={() => { 
              isPlaying = false; 
            }}
            oncanplay={() => {
              isLoading = false;
              isLoadingVideo = false;
            }}
            onloadedmetadata={() => {
              if (videoElement && videoElement.duration) {
                duration = videoElement.duration;
                isLoading = false;
                isLoadingVideo = false;
              }
            }}
            onstalled={() => {
            }}
            onsuspend={() => {
            }}
          >
            {#if videoUrl}
              <source src={videoUrl} type="video/mp4" />
              <source src={videoUrl} type="video/webm" />
              <source src={videoUrl} type="video/ogg" />
            {/if}
            <track kind="captions">
          </video>
          
          <!-- Play overlay for paused state -->
          {#if !isPlaying && !isLoading}
            <div class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
              <button
                onclick={togglePlayPause}
                class="flex items-center justify-center w-16 h-16 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 rounded-full transition-all transform hover:scale-105 shadow-lg"
              >
                <svg class="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </div>
          {/if}
        {/if}
      </div>

      <!-- Controls Bar - Responsive -->
      {#if !error}
        <div class="bg-gradient-to-r from-gray-800 to-gray-900 border-t border-gray-600 text-white" 
             style="min-height: {modalSize.width < 400 ? '150px' : '130px'}; padding: {modalSize.width < 400 ? '12px' : '16px'}">
          <!-- File Name with improved styling -->
          <div class="mb-3">
            <div class="flex items-center space-x-2">
              <svg class="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <h3 class="{modalSize.width < 400 ? 'text-xs' : 'text-sm'} font-medium text-white truncate" title={fileName}>
                {fileName || 'Video File'}
              </h3>
            </div>
          </div>

          <!-- Progress Bar with enhanced design -->
          <div class="mb-5 px-2">
            <!-- Progress track with better styling and responsiveness -->
            <div class="relative mb-4 group">
              <!-- Background track -->
              <div class="w-full h-3 bg-gray-600 rounded-full shadow-inner"></div>
              
              <!-- Progress fill with smooth animation -->
              <div class="absolute top-0 left-0 h-3 bg-gradient-to-r from-red-400 via-red-500 to-pink-500 rounded-full transition-all duration-200 ease-out shadow-lg pointer-events-none" 
                   style="width: {duration > 0 ? (currentTime / duration) * 100 : 0}%"></div>
              
              <!-- Interactive slider with better responsiveness -->
              <input
                type="range"
                min="0"
                max="100"
                value={duration > 0 ? (currentTime / duration) * 100 : 0}
                oninput={seek}
                onchange={seek}
                class="absolute top-0 left-0 w-full h-3 opacity-0 cursor-pointer z-10"
                style="margin: 0;"
              />
              
              <!-- Progress thumb/handle with hover effect -->
              <div class="absolute top-1/2 transform -translate-y-1/2 w-5 h-5 bg-white border-2 border-red-500 rounded-full shadow-lg transition-all duration-100 group-hover:scale-110 pointer-events-none"
                   style="left: calc({duration > 0 ? (currentTime / duration) * 100 : 0}% - 10px); z-index: 5;"></div>
            </div>
            
            <!-- Time display with better spacing and design -->
            <div class="flex justify-between items-center gap-4 px-1">
              <div class="flex items-center space-x-2">
                <span class="{modalSize.width < 400 ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1.5'} font-mono text-white bg-black bg-opacity-50 rounded-full backdrop-blur-sm">
                  {formatTime(currentTime)}
                </span>
              </div>
              <div class="flex-1 text-center">
                <span class="text-xs text-gray-400">
                  {Math.round(duration > 0 ? (currentTime / duration) * 100 : 0)}%
                </span>
              </div>
              <div class="flex items-center space-x-2">
                <span class="{modalSize.width < 400 ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1.5'} font-mono text-white bg-black bg-opacity-50 rounded-full backdrop-blur-sm">
                  {formatTime(duration)}
                </span>
              </div>
            </div>
          </div>

          <!-- Control Buttons & Volume - Responsive Layout -->
          <div class="flex items-center {modalSize.width < 400 ? 'flex-col space-y-2' : 'justify-between'}">
            
            <!-- Play/Pause Button with responsive size -->
            <button
              onclick={togglePlayPause}
              class="flex items-center justify-center {modalSize.width < 400 ? 'w-10 h-10' : 'w-12 h-12'} bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-full hover:from-red-600 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg"
              disabled={isLoading}
            >
              {#if isPlaying}
                <svg class="{modalSize.width < 400 ? 'w-4 h-4' : 'w-5 h-5'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6" />
                </svg>
              {:else}
                <svg class="{modalSize.width < 400 ? 'w-4 h-4' : 'w-5 h-5'} ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              {/if}
            </button>

            <!-- Volume Control with responsive layout -->
            <div class="flex items-center space-x-2 {modalSize.width < 400 ? 'w-full' : 'flex-1 ml-4'}">
              <svg class="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M9 12a3 3 0 106 0v-1a3 3 0 00-6 0v1z" />
              </svg>
              <input
                type="range"
                min="0"
                max="100"
                value={volume * 100}
                oninput={changeVolume}
                onchange={changeVolume}
                class="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer volume-slider"
              />
              <span class="{modalSize.width < 400 ? 'text-xs' : 'text-sm'} text-gray-300 font-mono bg-gray-700 px-2 py-1 rounded min-w-[2.5rem] text-center">
                {Math.round(volume * 100)}
              </span>
            </div>
          </div>
        </div>
      {/if}
    </div>

    <!-- Resize Handles -->
    <div class="resize-handle absolute top-0 left-1/2 transform -translate-x-1/2 w-4 h-1 cursor-n-resize" data-handle="n" onmousedown={handleMouseDown}></div>
    <div class="resize-handle absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4 h-1 cursor-s-resize" data-handle="s" onmousedown={handleMouseDown}></div>
    <div class="resize-handle absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-4 cursor-w-resize" data-handle="w" onmousedown={handleMouseDown}></div>
    <div class="resize-handle absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-4 cursor-e-resize" data-handle="e" onmousedown={handleMouseDown}></div>
    
    <div class="resize-handle absolute top-0 left-0 w-2 h-2 cursor-nw-resize" data-handle="nw" onmousedown={handleMouseDown}></div>
    <div class="resize-handle absolute top-0 right-0 w-2 h-2 cursor-ne-resize" data-handle="ne" onmousedown={handleMouseDown}></div>
    <div class="resize-handle absolute bottom-0 left-0 w-2 h-2 cursor-sw-resize" data-handle="sw" onmousedown={handleMouseDown}></div>
    <div class="resize-handle absolute bottom-0 right-0 w-2 h-2 cursor-se-resize" data-handle="se" onmousedown={handleMouseDown}></div>
  </div>
{/if}

<style>

  /* Volume slider styling */
  .volume-slider::-webkit-slider-thumb {
    appearance: none;
    height: 14px;
    width: 14px;
    border-radius: 50%;
    background: linear-gradient(45deg, #ef4444, #ec4899);
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
    border: 1px solid white;
  }

  .volume-slider::-moz-range-thumb {
    height: 14px;
    width: 14px;
    border-radius: 50%;
    background: linear-gradient(45deg, #ef4444, #ec4899);
    cursor: pointer;
    border: 1px solid white;
    box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
  }

  .volume-slider::-webkit-slider-track {
    height: 8px;
    border-radius: 4px;
    background: #4b5563;
  }

  /* Drag handle styling */
  .drag-handle:active {
    cursor: grabbing;
  }

  /* Resize handle styling */
  .resize-handle {
    background: transparent;
    transition: all 0.2s ease;
  }
  
  .resize-handle:hover {
    background: rgba(239, 68, 68, 0.2);
    border-radius: 2px;
  }

  /* Responsive breakpoint adjustments */
  @media (max-width: 480px) {
    .progress-slider::-webkit-slider-thumb {
      height: 14px;
      width: 14px;
    }
    
    .volume-slider::-webkit-slider-thumb {
      height: 12px;
      width: 12px;
    }
  }
</style>