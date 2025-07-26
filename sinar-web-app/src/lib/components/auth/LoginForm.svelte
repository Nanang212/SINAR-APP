<script lang="ts">
  let username = $state("");
  let password = $state("");

  function handleSubmit(event: Event) {
    event.preventDefault();
    console.log("Login attempt:", { username, password });
    // Handle login logic here
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
              <input
                id="password"
                type="password"
                bind:value={password}
                class="w-full px-4 py-4 bg-white/17 backdrop-blur-sm border border-white/43 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/62 focus:border-white/62 focus:bg-white/26 transition-all duration-200 text-gray-800 placeholder-gray-500"
                placeholder="Enter your password"
                required
              />
            </div>

            <!-- Login Button -->
            <div class="pt-4">
              <button
                type="submit"
                class="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 rounded-xl font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 relative overflow-hidden group shadow-lg"
              >
                <span class="relative z-10">Login</span>
                <div
                  class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                ></div>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  @keyframes sunShine {
    0%, 100% {
      opacity: 0.3;
      transform: translate(-50%, 0) scale(1);
    }
    50% {
      opacity: 0.6;
      transform: translate(-50%, 0) scale(1.1);
    }
  }
</style>
