<script lang="ts">
  import { fly } from "svelte/transition";
  import { reportService } from '$lib/services';
  import AudioPlayerModal from './AudioPlayerModal.svelte';
  import VideoPlayerModal from './VideoPlayerModal.svelte';
  import Loading from './loading.svelte';

  interface Report {
    id: number;
    type: string;
    content: string;
    original_name: string | null;
    description: string | null;
    created_at: string;
    user: {
      id: number;
      username: string;
    };
    download_url: string | null;
    preview_url: string | null;
  }

  interface ReportData {
    document: {
      id: number;
      original_name: string;
      url: string;
    };
    reports: {
      TEXT: Report[];
      LINK: Report[];
      AUDIO: Report[];
      VIDEO: Report[];
    };
  }

  export let isOpen = false;
  export let reportData: ReportData | null = null;
  export let onClose: () => void = () => {};

  // Audio player modal state
  let isAudioModalOpen = false;
  let currentAudioUrl = '';
  let currentAudioFileName = '';
  
  // Video player modal state
  let isVideoModalOpen = false;
  let currentVideoUrl = '';
  let currentVideoFileName = '';
  
  // Loading states
  let isLoadingVideo = false;
  let isLoadingAudio = false;
  let isDownloading = false;

  function formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      
      return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
    } catch (error) {
      return dateString;
    }
  }

  function handleOverlayClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  async function handlePreview(reportId: number, reportType: string, fileName: string) {
    try {
      if (reportType === 'AUDIO') {
        isLoadingAudio = true;
        
        // Use reportService to get audio blob with proper authentication
        const audioBlob = await reportService.getAudioBlob(reportId);
        
        currentAudioUrl = URL.createObjectURL(audioBlob);
        currentAudioFileName = fileName;
        
        isLoadingAudio = false;
        isAudioModalOpen = true;
      } else if (reportType === 'VIDEO') {
        isLoadingVideo = true;
        
        // Use reportService to get video blob with proper authentication
        const videoBlob = await reportService.getVideoBlob(reportId);
        
        currentVideoUrl = URL.createObjectURL(videoBlob);
        currentVideoFileName = fileName;
        
        isLoadingVideo = false;
        isVideoModalOpen = true;
      } else {
        // Open other types in new tab
        await reportService.previewReportById(reportId);
      }
    } catch (error) {
      console.error('Failed to preview report:', error);
      isLoadingVideo = false;
      isLoadingAudio = false;
      // Could add toast notification here
    }
  }

  function closeAudioModal() {
    isAudioModalOpen = false;
    isLoadingAudio = false;
    if (currentAudioUrl) {
      URL.revokeObjectURL(currentAudioUrl);
      currentAudioUrl = '';
    }
    currentAudioFileName = '';
  }

  function closeVideoModal() {
    isVideoModalOpen = false;
    isLoadingVideo = false;
    if (currentVideoUrl) {
      URL.revokeObjectURL(currentVideoUrl);
      currentVideoUrl = '';
    }
    currentVideoFileName = '';
  }

  async function handleDownload(reportId: number, originalName?: string) {
    try {
      isDownloading = true;
      await reportService.downloadReportById(reportId, originalName);
    } catch (error) {
      console.error('Failed to download report:', error);
      // Could add toast notification here
    } finally {
      isDownloading = false;
    }
  }

  // Get total counts
  $: totalCounts = reportData ? {
    text: reportData.reports.TEXT?.length || 0,
    link: reportData.reports.LINK?.length || 0,
    audio: reportData.reports.AUDIO?.length || 0,
    video: reportData.reports.VIDEO?.length || 0,
    total: (reportData.reports.TEXT?.length || 0) + 
           (reportData.reports.LINK?.length || 0) + 
           (reportData.reports.AUDIO?.length || 0) + 
           (reportData.reports.VIDEO?.length || 0)
  } : null;
</script>

{#if isOpen && reportData}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
    onclick={handleOverlayClick}
    transition:fly={{ y: -50, duration: 300 }}
  >
    <div class="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-200">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Report Details</h3>
            <p class="text-sm text-gray-600 mt-1">{reportData.document.original_name}</p>
          </div>
          <button
            onclick={onClose}
            class="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 rounded-md hover:bg-gray-100"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        
        <!-- Summary Badges -->
        {#if totalCounts}
          <div class="flex flex-wrap gap-2 mt-3">
            <div class="flex items-center space-x-2 text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
              <span class="font-medium">Total Reports:</span>
              <span class="font-bold">{totalCounts.total}</span>
            </div>
            {#if totalCounts.text > 0}
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                {totalCounts.text} Text{totalCounts.text > 1 ? 's' : ''}
              </span>
            {/if}
            {#if totalCounts.link > 0}
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {totalCounts.link} Link{totalCounts.link > 1 ? 's' : ''}
              </span>
            {/if}
            {#if totalCounts.audio > 0}
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {totalCounts.audio} Audio{totalCounts.audio > 1 ? 's' : ''}
              </span>
            {/if}
            {#if totalCounts.video > 0}
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {totalCounts.video} Video{totalCounts.video > 1 ? 's' : ''}
              </span>
            {/if}
          </div>
        {/if}
      </div>

      <!-- Content -->
      <div class="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
        <!-- TEXT Reports -->
        {#if reportData.reports.TEXT && reportData.reports.TEXT.length > 0}
          <div class="mb-8">
            <h4 class="text-md font-semibold text-gray-900 mb-4 flex items-center">
              <div class="w-3 h-3 bg-amber-500 rounded-full mr-2"></div>
              Text Reports ({reportData.reports.TEXT.length})
            </h4>
            <div class="space-y-3">
              {#each reportData.reports.TEXT as report}
                <div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div class="flex justify-between items-start mb-2">
                    <div class="flex-1">
                      <p class="text-gray-900 font-medium mb-2">{report.content}</p>
                    </div>
                  </div>
                  <div class="flex justify-between items-center text-xs text-gray-500 mt-3 pt-3 border-t border-amber-200">
                    <span>By {report.user.username}</span>
                    <span>{formatDate(report.created_at)}</span>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- LINK Reports -->
        {#if reportData.reports.LINK && reportData.reports.LINK.length > 0}
          <div class="mb-8">
            <h4 class="text-md font-semibold text-gray-900 mb-4 flex items-center">
              <div class="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
              Link Reports ({reportData.reports.LINK.length})
            </h4>
            <div class="space-y-3">
              {#each reportData.reports.LINK as report}
                <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div class="flex justify-between items-start mb-2">
                    <div class="flex-1">
                      <a href={report.content} target="_blank" rel="noopener noreferrer" 
                         class="text-purple-700 hover:text-purple-900 font-medium underline break-all">
                        {report.content}
                      </a>
                    </div>
                  </div>
                  <div class="flex justify-between items-center text-xs text-gray-500 mt-3 pt-3 border-t border-purple-200">
                    <span>By {report.user.username}</span>
                    <span>{formatDate(report.created_at)}</span>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- AUDIO Reports -->
        {#if reportData.reports.AUDIO && reportData.reports.AUDIO.length > 0}
          <div class="mb-8">
            <h4 class="text-md font-semibold text-gray-900 mb-4 flex items-center">
              <div class="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              Audio Reports ({reportData.reports.AUDIO.length})
            </h4>
            <div class="space-y-3">
              {#each reportData.reports.AUDIO as report}
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div class="flex justify-between items-start mb-3">
                    <div class="flex-1">
                      <div class="flex items-center space-x-2 mb-2">
                        <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                        <p class="text-gray-900 font-medium">{report.original_name || 'Audio File'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Action Buttons -->
                  <div class="flex space-x-2 mb-3">
                    <button
                      onclick={() => handlePreview(report.id, report.type, report.original_name || 'Audio File')}
                      disabled={isLoadingAudio}
                      class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-500 rounded-md transition-colors"
                    >
                      {#if isLoadingAudio}
                        <svg class="w-4 h-4 mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="m12 2a10 10 0 0 1 10 10h-4a6 6 0 0 0-6-6v-4z"></path>
                        </svg>
                        Loading...
                      {:else}
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h8a2 2 0 012 2v8a2 2 0 01-2-2V8a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Preview
                      {/if}
                    </button>
                    <button
                      onclick={() => handleDownload(report.id, report.original_name)}
                      disabled={isDownloading}
                      class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 disabled:bg-gray-100 disabled:text-gray-500 rounded-md transition-colors"
                    >
                      {#if isDownloading}
                        <svg class="w-4 h-4 mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="m12 2a10 10 0 0 1 10 10h-4a6 6 0 0 0-6-6v-4z"></path>
                        </svg>
                        Downloading...
                      {:else}
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-4-4m4 4l4-4m5-7V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-1" />
                        </svg>
                        Download
                      {/if}
                    </button>
                  </div>
                  
                  <div class="flex justify-between items-center text-xs text-gray-500 pt-3 border-t border-blue-200">
                    <span>By {report.user.username}</span>
                    <span>{formatDate(report.created_at)}</span>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- VIDEO Reports -->
        {#if reportData.reports.VIDEO && reportData.reports.VIDEO.length > 0}
          <div class="mb-8">
            <h4 class="text-md font-semibold text-gray-900 mb-4 flex items-center">
              <div class="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              Video Reports ({reportData.reports.VIDEO.length})
            </h4>
            <div class="space-y-3">
              {#each reportData.reports.VIDEO as report}
                <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div class="flex justify-between items-start mb-3">
                    <div class="flex-1">
                      <div class="flex items-center space-x-2 mb-2">
                        <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <p class="text-gray-900 font-medium">{report.original_name || 'Video File'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Action Buttons -->
                  <div class="flex space-x-2 mb-3">
                    <button
                      onclick={() => handlePreview(report.id, report.type, report.original_name || 'Video File')}
                      disabled={isLoadingVideo}
                      class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-500 rounded-md transition-colors"
                    >
                      {#if isLoadingVideo}
                        <svg class="w-4 h-4 mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="m12 2a10 10 0 0 1 10 10h-4a6 6 0 0 0-6-6v-4z"></path>
                        </svg>
                        Loading...
                      {:else}
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h8a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2z" />
                        </svg>
                        Preview
                      {/if}
                    </button>
                    <button
                      onclick={() => handleDownload(report.id, report.original_name)}
                      disabled={isDownloading}
                      class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 disabled:bg-gray-100 disabled:text-gray-500 rounded-md transition-colors"
                    >
                      {#if isDownloading}
                        <svg class="w-4 h-4 mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="m12 2a10 10 0 0 1 10 10h-4a6 6 0 0 0-6-6v-4z"></path>
                        </svg>
                        Downloading...
                      {:else}
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-4-4m4 4l4-4m5-7V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-1" />
                        </svg>
                        Download
                      {/if}
                    </button>
                  </div>
                  
                  <div class="flex justify-between items-center text-xs text-gray-500 pt-3 border-t border-red-200">
                    <span>By {report.user.username}</span>
                    <span>{formatDate(report.created_at)}</span>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Empty State -->
        {#if totalCounts && totalCounts.total === 0}
          <div class="text-center py-12">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">No reports found</h3>
            <p class="mt-1 text-sm text-gray-500">This document has no associated reports yet.</p>
          </div>
        {/if}
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
        <button
          onclick={onClose}
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Audio Player Modal -->
<AudioPlayerModal 
  isOpen={isAudioModalOpen}
  audioUrl={currentAudioUrl}
  fileName={currentAudioFileName}
  onClose={closeAudioModal}
/>

<!-- Video Player Modal -->
<VideoPlayerModal 
  isOpen={isVideoModalOpen}
  videoUrl={currentVideoUrl}
  fileName={currentVideoFileName}
  onClose={closeVideoModal}
/>

<!-- Loading Overlays -->
{#if isLoadingVideo}
  <Loading 
    overlay={true} 
    size="xl" 
    text="Loading video preview..." 
  />
{/if}

{#if isLoadingAudio}
  <Loading 
    overlay={true} 
    size="lg" 
    text="Loading audio preview..." 
  />
{/if}

{#if isDownloading}
  <Loading 
    overlay={true} 
    size="lg" 
    text="Preparing download..." 
  />
{/if}