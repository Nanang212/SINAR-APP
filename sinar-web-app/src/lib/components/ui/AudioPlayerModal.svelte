<script lang="ts">
  import { fly } from "svelte/transition";
  import { onMount, onDestroy } from 'svelte';

  export let isOpen = false;
  export let audioUrl = '';
  export let fileName = '';
  export let onClose: () => void = () => {};
  

  let audioElement: HTMLAudioElement;
  let isPlaying = false;
  let currentTime = 0;
  let duration = 0;
  let volume = 1.0;
  let isLoading = false;
  let error = '';

  // Modal position and dragging
  let modalElement: HTMLDivElement;
  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };
  let modalPosition = { x: 0, y: 0 };

  // Equalizer animation
  let equalizerBars = Array(5).fill(0);
  let animationInterval: NodeJS.Timeout;
  
  // Single AudioContext instance
  let audioContext: AudioContext | null = null;

  // Initialize modal position to right side
  onMount(async () => {
    if (typeof window !== 'undefined') {
      modalPosition.x = window.innerWidth - 380; // Position to right
      modalPosition.y = 100;
      
      // Handle browser audio autoplay policies
      if (audioElement) {
        audioElement.volume = volume;
        
        // Initialize single AudioContext if needed
        try {
          if (!audioContext) {
            audioContext = new AudioContext();
          }
          if (audioContext.state === 'suspended') {
            await audioContext.resume();
          }
        } catch (err) {
          console.warn('AudioContext setup:', err);
        }
      }
    }
  });

  $: {
    if (isOpen && audioUrl && audioUrl.length > 0) {
      // Use setTimeout to ensure audioElement is bound
      setTimeout(() => {
        loadAudio();
      }, 0);
    } else {
      stopAudio();
    }
  }

  let loadAudioRetryCount = 0;
  const MAX_RETRY_COUNT = 3;
  
  async function loadAudio() {
    if (!audioElement) {
      if (loadAudioRetryCount < MAX_RETRY_COUNT) {
        loadAudioRetryCount++;
        setTimeout(() => {
          if (audioElement && audioUrl) {
            loadAudio();
          }
        }, 100);
      }
      return;
    }
    
    if (!audioUrl) {
      return;
    }
    
    loadAudioRetryCount = 0;
    
    isLoading = true;
    error = '';
    
    try {
      // Stop any existing audio
      audioElement.pause();
      audioElement.currentTime = 0;
      
      // Set source and properties
      audioElement.src = audioUrl;
      audioElement.volume = volume;
      audioElement.muted = false;
      
      // Set audio output device if supported
      if ('setSinkId' in audioElement && navigator.mediaDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const audioOutputDevice = devices.find(device => device.kind === 'audiooutput');
          if (audioOutputDevice && audioOutputDevice.deviceId !== 'default') {
            await audioElement.setSinkId(audioOutputDevice.deviceId);
          }
        } catch (err) {
          // Silently fail for unsupported devices
        }
      }
      
      audioElement.load();
      
      // Wait for audio to be ready
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          audioElement.removeEventListener('canplay', handleCanPlay);
          audioElement.removeEventListener('error', handleError);
          reject(new Error('Audio load timeout'));
        }, 10000); // 10 second timeout
        
        const handleCanPlay = () => {
          clearTimeout(timeout);
          audioElement.removeEventListener('canplay', handleCanPlay);
          audioElement.removeEventListener('error', handleError);
          resolve(null);
        };
        
        const handleError = (e) => {
          clearTimeout(timeout);
          audioElement.removeEventListener('canplay', handleCanPlay);
          audioElement.removeEventListener('error', handleError);
          reject(e);
        };
        
        audioElement.addEventListener('canplay', handleCanPlay);
        audioElement.addEventListener('error', handleError);
      });
      
    } catch (err) {
      error = `Failed to load audio: ${err.message}`;
      isLoading = false;
    }
  }

  function handleLoadedData() {
    isLoading = false;
    duration = audioElement.duration;
    
    // Ensure audio is ready for playback
    if (audioElement) {
      audioElement.volume = volume;
    }
  }

  function handleLoadError() {
    isLoading = false;
    error = 'Failed to load audio file';
  }

  async function togglePlayPause() {
    if (!audioElement) return;

    try {
      if (isPlaying) {
        audioElement.pause();
        stopEqualizerAnimation();
        isPlaying = false;
      } else {
        // Resume AudioContext if suspended
        try {
          if (audioContext && audioContext.state === 'suspended') {
            await audioContext.resume();
          }
        } catch (err) {
          // Silently handle AudioContext errors
        }
        
        // Set volume and play
        audioElement.volume = Math.max(volume, 0.5);
        audioElement.muted = false;
        
        await audioElement.play();
        startEqualizerAnimation();
        isPlaying = true;
      }
    } catch (playError) {
      // Try alternative play method
      if (!isPlaying) {
        try {
          audioElement.volume = 1.0;
          audioElement.muted = false;
          audioElement.play();
          isPlaying = true;
          startEqualizerAnimation();
        } catch (altError) {
          error = 'Failed to play audio';
          isPlaying = false;
          stopEqualizerAnimation();
        }
      }
    }
  }

  function handleTimeUpdate() {
    if (audioElement) {
      currentTime = audioElement.currentTime;
    }
  }

  function handleEnded() {
    isPlaying = false;
    currentTime = 0;
    stopEqualizerAnimation();
  }

  function seek(event: Event) {
    const input = event.target as HTMLInputElement;
    const time = (parseFloat(input.value) / 100) * duration;
    if (audioElement) {
      audioElement.currentTime = time;
    }
  }

  function changeVolume(event: Event) {
    const input = event.target as HTMLInputElement;
    volume = parseFloat(input.value) / 100;
    if (audioElement) {
      audioElement.volume = volume;
    }
  }

  function stopAudio() {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }
    isPlaying = false;
    stopEqualizerAnimation();
  }

  function formatTime(seconds: number): string {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // Equalizer animation functions - optimized to reduce re-renders
  function startEqualizerAnimation() {
    if (animationInterval) clearInterval(animationInterval);
    animationInterval = setInterval(() => {
      // Only update if modal is visible and playing
      if (isOpen && isPlaying) {
        equalizerBars = equalizerBars.map(() => Math.random() * 100);
      }
    }, 200); // Increased interval to reduce CPU usage
  }

  function stopEqualizerAnimation() {
    if (animationInterval) {
      clearInterval(animationInterval);
      animationInterval = null;
    }
    equalizerBars = Array(5).fill(0);
  }

  // Drag functionality
  function handleMouseDown(event: MouseEvent) {
    if (event.target === event.currentTarget || (event.target as HTMLElement).classList.contains('drag-handle')) {
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
    if (!isDragging) return;
    
    modalPosition.x = event.clientX - dragOffset.x;
    modalPosition.y = event.clientY - dragOffset.y;
    
    // Keep modal within viewport bounds
    const maxX = window.innerWidth - 350;
    const maxY = window.innerHeight - 200;
    
    modalPosition.x = Math.max(0, Math.min(modalPosition.x, maxX));
    modalPosition.y = Math.max(0, Math.min(modalPosition.y, maxY));
  }

  function handleMouseUp() {
    isDragging = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }

  function closeModal() {
    stopAudio();
    onClose();
  }

  onDestroy(() => {
    stopEqualizerAnimation();
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    // Clean up AudioContext
    if (audioContext && audioContext.state !== 'closed') {
      audioContext.close();
      audioContext = null;
    }
  });
</script>

{#if isOpen}
  <!-- Backdrop with blur -->
  <div 
    class="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-[10000]"
    onclick={closeModal}
    transition:fly={{ duration: 300 }}
  ></div>

  <!-- Draggable Audio Modal -->
  <div
    bind:this={modalElement}
    class="fixed bg-white rounded-lg shadow-2xl border border-gray-200 z-[10001] select-none"
    style="left: {modalPosition.x}px; top: {modalPosition.y}px; width: 350px;"
    transition:fly={{ x: 50, duration: 300 }}
    role="dialog"
    aria-modal="true"
  >
    <!-- Header with drag handle -->
    <div 
      class="drag-handle flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg cursor-move"
      onmousedown={handleMouseDown}
    >
      <div class="flex items-center space-x-2 pointer-events-none">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
        <span class="font-medium text-sm truncate max-w-[200px]">Audio Player</span>
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

    <!-- Audio Player Content -->
    <div class="p-4">
      <!-- File Name -->
      <div class="mb-4">
        <h3 class="text-sm font-medium text-gray-900 truncate" title={fileName}>
          {fileName || 'Audio File'}
        </h3>
      </div>

      <!-- Equalizer Visualization -->
      <div class="flex items-end justify-center space-x-1 mb-4 h-16 bg-gray-50 rounded-lg p-2">
        {#each equalizerBars as height, i}
          <div 
            class="bg-gradient-to-t from-blue-500 to-purple-600 rounded-sm transition-all duration-150 ease-out"
            style="width: 12px; height: {Math.max(4, height)}%;"
          ></div>
        {/each}
      </div>

      <!-- Loading/Error State -->
      {#if isLoading}
        <div class="text-center py-2">
          <div class="inline-flex items-center">
            <svg class="w-4 h-4 text-blue-600 animate-spin mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span class="text-sm text-gray-600">Loading audio...</span>
          </div>
        </div>
      {:else if error}
        <div class="text-center py-2">
          <span class="text-sm text-red-600">{error}</span>
        </div>
      {:else}
        <!-- Progress Bar -->
        <div class="mb-3">
          <input
            type="range"
            min="0"
            max="100"
            value={duration > 0 ? (currentTime / duration) * 100 : 0}
            oninput={seek}
            onchange={seek}
            class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div class="flex justify-between text-xs text-gray-500 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <!-- Controls -->
        <div class="flex items-center justify-between mb-3">
          <!-- Play/Pause Button -->
          <button
            onclick={togglePlayPause}
            class="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
            disabled={isLoading}
          >
            {#if isPlaying}
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6" />
              </svg>
            {:else}
              <svg class="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            {/if}
          </button>
          

          <!-- Volume Control -->
          <div class="flex items-center space-x-2 flex-1 ml-4">
            <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M9 12a3 3 0 106 0v-1a3 3 0 00-6 0v1z" />
            </svg>
            <input
              type="range"
              min="0"
              max="100"
              value={volume * 100}
              oninput={changeVolume}
              onchange={changeVolume}
              class="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <span class="text-xs text-gray-500 w-8">{Math.round(volume * 100)}</span>
          </div>
        </div>
      {/if}

      <!-- Audio Element -->
      <audio
        bind:this={audioElement}
        preload="auto"
        controls={false}
        muted={false}
        onloadeddata={handleLoadedData}
        onerror={handleLoadError}
        ontimeupdate={handleTimeUpdate}
        onended={handleEnded}
        oncanplay={() => { 
          isLoading = false; 
        }}
        onplay={() => { 
          isPlaying = true; 
          startEqualizerAnimation(); 
        }}
        onpause={() => { 
          isPlaying = false; 
          stopEqualizerAnimation(); 
        }}
      ></audio>
    </div>
  </div>
{/if}

<style>
  /* Custom slider styling */
  .slider::-webkit-slider-thumb {
    appearance: none;
    height: 16px;
    width: 16px;
    border-radius: 50%;
    background: linear-gradient(45deg, #3b82f6, #8b5cf6);
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .slider::-moz-range-thumb {
    height: 16px;
    width: 16px;
    border-radius: 50%;
    background: linear-gradient(45deg, #3b82f6, #8b5cf6);
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .drag-handle:active {
    cursor: grabbing;
  }
</style>