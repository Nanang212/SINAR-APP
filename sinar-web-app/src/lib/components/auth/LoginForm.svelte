<script lang="ts">
  import { loginHandler } from './loginHandler';
  import { NavigationHelper } from '$lib/utils/navigation';
  import { authService } from '$lib/services';
  import { Loading } from '$lib';
  import { onMount } from 'svelte';
  
  let username = $state("");
  let password = $state("");
  let isLoading = $state(false);
  let errorMessage = $state("");
  let showPageOverlay = $state(false);
  let showPassword = $state(false);

  onMount(() => {
    // Subscribe to login handler state changes
    const unsubscribe = loginHandler.subscribe((state) => {
      isLoading = state.isLoading;
      errorMessage = state.errorMessage;
    });

    // Cleanup subscription on component destroy
    return unsubscribe;
  });

  async function handleSubmit(event: Event) {
    event.preventDefault();
    
    // Use login handler to process login
    const success = await loginHandler.handleLogin({
      username,
      password
    });

    if (success) {
      // Show page overlay loading
      showPageOverlay = true;
      
      // Minimum delay for smooth transition (500ms)
      const minDelay = new Promise(resolve => setTimeout(resolve, 500));
      
      // Wait for minimum delay before redirect
      await minDelay;
      
      // Role-based redirect after successful login
      const userRole = authService.getCurrentUserRole();
      const redirectPath = userRole === 'admin' ? '/home' : '/user/documents';
      NavigationHelper.navigateTo(redirectPath);
    }
    // Error handling is done by the handler
  }

  // Clear error when user starts typing
  function clearErrorOnInput() {
    if (errorMessage) {
      loginHandler.clearError();
    }
  }
</script>

<div
  class="w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[80vw] h-[90vh] sm:h-[85vh] md:h-[80vh] lg:h-[75vh]"
>
  <!-- Glassmorphism Card Container -->
  <div class="relative h-full">
    <!-- Main Card with Optimal Glassmorphism -->
    <div
      class="relative bg-white/5 backdrop-blur-xl border border-white/30 rounded-3xl px-4 py-6 sm:px-8 sm:py-8 md:px-12 md:py-10 lg:px-16 lg:py-12 overflow-hidden h-full"
      style="background-color: rgba(242, 233, 221, 0.22); box-shadow:
        inset 0 1px 0 0 rgba(255,255,255,0.3),
        inset 0 -1px 0 0 rgba(255,255,255,0.1),
        0 20px 40px rgba(0,0,0,0.2),
        0 8px 16px rgba(0,0,0,0.1);"
    >
      <!-- Optimal Glass Shine Effects -->
      <div
        class="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-3xl"
      ></div>
      <div
        class="absolute top-4 left-4 w-20 h-20 bg-white/20 rounded-full blur-2xl"
      ></div>

      <!-- Split Content: Responsive Layout -->
      <div
        class="flex flex-col lg:flex-row items-center relative z-10 h-full gap-4 lg:gap-0"
      >
        <!-- Logo Section -->
        <div
          class="flex-1 lg:flex-[6] flex items-center justify-center px-4 py-4 md:px-8 md:py-8 lg:px-16 lg:py-12"
        >
          <div class="text-center relative">
            <img
              src="/assets/logo.png"
              alt="SINAR Logo"
              class="w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 mx-auto mb-2 lg:mb-4 opacity-90 relative z-10"
            />
            <!-- Shiny effect overlay for sun part -->
            <div
              class="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 pointer-events-none"
              style="
                background: radial-gradient(circle, rgba(255, 193, 7, 0.3) 0%, rgba(255, 235, 59, 0.2) 30%, transparent 70%);
                border-radius: 50%;
                filter: blur(8px);
                animation: sunShine 3s ease-in-out infinite;
              "
            ></div>
          </div>
        </div>

        <!-- Login Form Section -->
        <div
          class="flex-1 lg:flex-[4] w-full lg:min-w-80 p-4 lg:p-8 h-auto lg:h-full flex flex-col justify-center"
        >
          <!-- Header Inside Glass Card -->
          <div class="mb-6 lg:mb-8">
            <h1
              class="text-2xl sm:text-3xl font-bold mb-2 lg:mb-3 tracking-tight drop-shadow-lg"
              style="color: #173242;"
            >
              Welcome back
            </h1>
            <p
              class="text-white/80 font-medium text-sm sm:text-base drop-shadow-sm"
            >
              Login to your account
            </p>
          </div>

          <!-- Error Message -->
          {#if errorMessage}
            <div class="mb-4 p-3 bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-lg">
              <p class="text-red-200 text-sm text-center">{errorMessage}</p>
            </div>
          {/if}

          <!-- Login Form -->
          <form onsubmit={handleSubmit} class="space-y-6 lg:space-y-8">
            <!-- Username Field -->
            <div>
              <label
                for="username"
                class="block text-sm font-medium text-white/90 mb-2 drop-shadow-sm"
                >Username</label
              >
              <input
                id="username"
                type="text"
                bind:value={username}
                oninput={clearErrorOnInput}
                class="w-full px-4 py-4 bg-white/17 backdrop-blur-sm border border-white/43 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/62 focus:border-white/62 focus:bg-white/26 transition-all duration-200 text-gray-800 placeholder-gray-500"
                placeholder="Enter your username"
                required
              />
            </div>

            <!-- Password Field -->
            <div>
              <label
                for="password"
                class="block text-sm font-medium text-white/90 mb-2 drop-shadow-sm"
                >Password</label
              >
              <div class="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  bind:value={password}
                  oninput={clearErrorOnInput}
                  class="w-full px-4 py-4 pr-12 bg-white/17 backdrop-blur-sm border border-white/43 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/62 focus:border-white/62 focus:bg-white/26 transition-all duration-200 text-gray-800 placeholder-gray-500"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onclick={() => showPassword = !showPassword}
                  class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800 focus:outline-none transition-colors duration-200"
                >
                  {#if showPassword}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M2.458 12C3.732 7.943 7.523 5 12 5C16.478 5 20.268 7.943 21.542 12C20.268 16.057 16.478 19 12 19C7.523 19 3.732 16.057 2.458 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  {:else}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.99902 3L20.999 21M9.8433 9.91364C9.32066 10.4536 8.99902 11.1892 8.99902 12C8.99902 13.6569 10.3422 15 11.999 15C12.8215 15 13.5667 14.669 14.1086 14.133M6.49902 6.64715C4.59972 7.90034 3.15305 9.78394 2.45703 12C3.73128 16.0571 7.52159 19 11.9992 19C13.9881 19 15.8414 18.4194 17.3988 17.4184M10.999 5.04939C11.328 5.01673 11.6617 5 11.9992 5C16.4769 5 20.2672 7.94291 21.5414 12C21.2607 12.894 20.8577 13.7338 20.3522 14.5M14.12 14.12L9.88 9.88" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  {/if}
                </button>
              </div>
            </div>

            <!-- Login Button -->
            <div class="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                class="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 rounded-xl font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 relative overflow-hidden group shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {#if isLoading}
                  <span class="relative z-10 flex items-center justify-center">
                    <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logging in...
                  </span>
                {:else}
                  <span class="relative z-10">Login</span>
                  <div
                    class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                  ></div>
                {/if}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Page overlay loading after successful login -->
{#if showPageOverlay}
  <Loading overlay={true} text="Redirecting to home..." />
{/if}

<style>
  @keyframes sunShine {
    0%,
    100% {
      opacity: 0.3;
      transform: translate(-50%, 0) scale(1);
    }
    50% {
      opacity: 0.6;
      transform: translate(-50%, 0) scale(1.1);
    }
  }
</style>
