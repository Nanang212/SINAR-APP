<script lang="ts">
  interface $$Props {
    fetchOnMount?: boolean;
    onRefresh?: () => void;
    searchTerm?: string;
  }

  let {
    fetchOnMount = false,
    onRefresh,
    searchTerm = "",
  }: $$Props = $props();

  // Component state
  let isLoading = $state(false);

  // Handle refresh
  async function handleRefresh() {
    isLoading = true;
    setTimeout(() => {
      isLoading = false;
      onRefresh?.();
    }, 1000);
  }

  // Public method to load reports (called from parent)
  export function loadReports() {
    return handleRefresh();
  }

  // Public method to set search term (called from parent)
  export function setSearchTerm(term: string) {
    // Search functionality not implemented yet
  }
</script>

<div class="pl-6 pr-8 pb-6 pt-12">
  <!-- Loading State -->
  {#if isLoading}
    <div class="flex justify-center items-center py-12">
      <div class="flex items-center space-x-2">
        <svg
          class="w-6 h-6 text-blue-600 animate-spin"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        <span class="text-gray-700">Loading reports...</span>
      </div>
    </div>
  {:else}
    <!-- 404 Not Found Content -->
    <div class="flex flex-col items-center justify-center py-8 px-4">
      <!-- 404 Illustration SVG -->
      <div class="mb-6">
        <svg
          class="w-64 h-64 text-gray-400"
          fill="none"
          viewBox="0 0 500 500"
          xmlns="http://www.w3.org/2000/svg"
        >
          <!-- Background Elements -->
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:0.1" />
              <stop offset="100%" style="stop-color:#8B5CF6;stop-opacity:0.1" />
            </linearGradient>
            <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#EF4444;stop-opacity:0.1" />
              <stop offset="100%" style="stop-color:#F59E0B;stop-opacity:0.1" />
            </linearGradient>
          </defs>
          
          <!-- Background Shapes -->
          <circle cx="100" cy="100" r="60" fill="url(#grad1)" opacity="0.3"/>
          <circle cx="400" cy="120" r="40" fill="url(#grad2)" opacity="0.3"/>
          <circle cx="380" cy="350" r="50" fill="url(#grad1)" opacity="0.2"/>
          <circle cx="80" cy="380" r="35" fill="url(#grad2)" opacity="0.2"/>
          
          <!-- Main Character - Robot/Explorer -->
          <g transform="translate(200, 150)">
            <!-- Robot Body -->
            <rect x="30" y="80" width="40" height="60" rx="8" fill="#3B82F6" opacity="0.8"/>
            
            <!-- Robot Head -->
            <rect x="35" y="50" width="30" height="35" rx="15" fill="#1E40AF" opacity="0.9"/>
            
            <!-- Robot Eyes -->
            <circle cx="42" cy="62" r="3" fill="#FFF"/>
            <circle cx="58" cy="62" r="3" fill="#FFF"/>
            <circle cx="42" cy="62" r="1.5" fill="#1E40AF"/>
            <circle cx="58" cy="62" r="1.5" fill="#1E40AF"/>
            
            <!-- Robot Arms -->
            <rect x="15" y="85" width="12" height="25" rx="6" fill="#3B82F6" opacity="0.7"/>
            <rect x="73" y="85" width="12" height="25" rx="6" fill="#3B82F6" opacity="0.7"/>
            
            <!-- Robot Legs -->
            <rect x="35" y="140" width="8" height="20" rx="4" fill="#1E40AF" opacity="0.8"/>
            <rect x="57" y="140" width="8" height="20" rx="4" fill="#1E40AF" opacity="0.8"/>
            
            <!-- Magnifying Glass in Hand -->
            <g transform="translate(85, 95)">
              <circle cx="0" cy="0" r="12" fill="none" stroke="#3B82F6" stroke-width="2"/>
              <line x1="8" y1="8" x2="18" y2="18" stroke="#3B82F6" stroke-width="2" stroke-linecap="round"/>
              <!-- Big Question Mark in Glass -->
              <path d="M-5 -8 Q0 -12 5 -8 Q5 -3 0 -3" fill="none" stroke="#EF4444" stroke-width="2" stroke-linecap="round"/>
              <circle cx="0" cy="3" r="1" fill="#EF4444"/>
            </g>
          </g>
          
          <!-- Floating Documents -->
          <g opacity="0.6">
            <!-- Document 1 -->
            <g transform="translate(80, 200) rotate(-15)">
              <rect width="30" height="40" rx="3" fill="#F3F4F6" stroke="#D1D5DB" stroke-width="1"/>
              <line x1="5" y1="8" x2="25" y2="8" stroke="#9CA3AF" stroke-width="1"/>
              <line x1="5" y1="14" x2="20" y2="14" stroke="#9CA3AF" stroke-width="1"/>
              <line x1="5" y1="20" x2="25" y2="20" stroke="#9CA3AF" stroke-width="1"/>
            </g>
            
            <!-- Document 2 -->
            <g transform="translate(350, 180) rotate(10)">
              <rect width="35" height="45" rx="3" fill="#FEF3C7" stroke="#F59E0B" stroke-width="1"/>
              <line x1="6" y1="10" x2="29" y2="10" stroke="#D97706" stroke-width="1"/>
              <line x1="6" y1="16" x2="24" y2="16" stroke="#D97706" stroke-width="1"/>
              <line x1="6" y1="22" x2="29" y2="22" stroke="#D97706" stroke-width="1"/>
            </g>
            
            <!-- Document 3 -->
            <g transform="translate(120, 350) rotate(20)">
              <rect width="28" height="35" rx="3" fill="#DBEAFE" stroke="#3B82F6" stroke-width="1"/>
              <line x1="4" y1="7" x2="24" y2="7" stroke="#1D4ED8" stroke-width="1"/>
              <line x1="4" y1="12" x2="19" y2="12" stroke="#1D4ED8" stroke-width="1"/>
              <line x1="4" y1="17" x2="24" y2="17" stroke="#1D4ED8" stroke-width="1"/>
            </g>
          </g>
          
          <!-- Charts/Analytics Icons -->
          <g transform="translate(320, 250)" opacity="0.4">
            <!-- Bar Chart -->
            <rect x="0" y="20" width="6" height="15" fill="#3B82F6"/>
            <rect x="8" y="10" width="6" height="25" fill="#8B5CF6"/>
            <rect x="16" y="15" width="6" height="20" fill="#EF4444"/>
            <rect x="24" y="5" width="6" height="30" fill="#10B981"/>
          </g>
          
          <!-- Pie Chart -->
          <g transform="translate(380, 280)" opacity="0.4">
            <circle cx="0" cy="0" r="15" fill="#E5E7EB"/>
            <path d="M 0 0 L 0 -15 A 15 15 0 0 1 10.6 -10.6 Z" fill="#3B82F6"/>
            <path d="M 0 0 L 10.6 -10.6 A 15 15 0 0 1 10.6 10.6 Z" fill="#8B5CF6"/>
            <path d="M 0 0 L 10.6 10.6 A 15 15 0 1 1 0 -15 Z" fill="#EF4444"/>
          </g>
          
          <!-- Floating Numbers/Stats -->
          <text x="120" y="120" class="text-2xl font-bold" fill="#3B82F6" opacity="0.3">0</text>
          <text x="350" y="100" class="text-lg font-bold" fill="#8B5CF6" opacity="0.3">%</text>
          <text x="80" y="320" class="text-xl font-bold" fill="#EF4444" opacity="0.3">?</text>
          
          <!-- Main 404 Text -->
          <text x="250" y="420" text-anchor="middle" class="text-7xl font-bold" fill="#374151" opacity="0.2">404</text>
          
          <!-- Decorative Stars -->
          <g fill="#F59E0B" opacity="0.3">
            <polygon points="450,80 452,86 458,86 453,90 455,96 450,92 445,96 447,90 442,86 448,86" />
            <polygon points="60,150 61,154 65,154 62,157 63,161 60,158 57,161 58,157 55,154 59,154" />
            <polygon points="420,200 421,203 424,203 422,205 423,208 420,206 417,208 418,205 416,203 419,203" />
          </g>
          
          <!-- Speech Bubble from Robot -->
          <g transform="translate(280, 180)">
            <ellipse cx="20" cy="0" rx="40" ry="20" fill="#FFF" stroke="#D1D5DB" stroke-width="2" opacity="0.9"/>
            <polygon points="5,10 15,5 10,15" fill="#FFF" stroke="#D1D5DB" stroke-width="2" opacity="0.9"/>
            <text x="20" y="5" text-anchor="middle" class="text-sm font-medium" fill="#374151">Reports not found!</text>
          </g>
        </svg>
      </div>

      <!-- Error Message -->
      <div class="text-center max-w-lg">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Reports Coming Soon</h1>
        <p class="text-gray-600 mb-4">
          This feature is under development and will provide analytics about your documents.
        </p>
        
        <!-- Feature Preview -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div class="flex flex-wrap justify-center gap-2 text-xs text-blue-700">
            <span class="bg-blue-100 px-2 py-1 rounded">📊 Analytics</span>
            <span class="bg-blue-100 px-2 py-1 rounded">📈 Statistics</span>
            <span class="bg-blue-100 px-2 py-1 rounded">📋 Reports</span>
            <span class="bg-blue-100 px-2 py-1 rounded">📤 Export</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3 justify-center">
          <button
            onclick={handleRefresh}
            disabled={isLoading}
            class="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors"
          >
            <svg class="w-4 h-4 mr-1 {isLoading ? 'animate-spin' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            {isLoading ? 'Checking...' : 'Check Again'}
          </button>
          
          <button
            onclick={() => window.history.back()}
            class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            Go Back
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>