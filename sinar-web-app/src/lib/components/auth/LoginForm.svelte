<script lang="ts">
  let username = $state("");
  let password = $state("");

  function handleSubmit(event: Event) {
    event.preventDefault();
    console.log("Login attempt:", { username, password });
    // Handle login logic here
  }
</script>

<div class="w-[80vw] h-[75vh]">
  <!-- Glassmorphism Card Container -->
  <div class="relative h-full">

    <!-- Main Card with Optimal Glassmorphism -->
    <div
      class="relative bg-white/5 backdrop-blur-xl border border-white/30 rounded-3xl px-16 py-12 overflow-hidden h-full"
      style="box-shadow: 
           inset 0 1px 0 0 rgba(255,255,255,0.2), 
           inset 0 -1px 0 0 rgba(255,255,255,0.1),
           0 20px 40px rgba(0,0,0,0.3),
           0 8px 16px rgba(0,0,0,0.2);"
    >
      <!-- Optimal Glass Shine Effects -->
      <div
        class="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent rounded-t-3xl"
      ></div>
      <div
        class="absolute top-4 left-4 w-20 h-20 bg-white/5 rounded-full blur-xl"
      ></div>

      <!-- Split Content: 60% Logo, 40% Login Form -->
      <div class="flex items-center relative z-10 h-full">
        <!-- Logo Section (60%) -->
        <div class="flex-[6] flex items-center justify-center px-16 py-12">
          <div class="text-center">
            <img
              src="/assets/logo.png"
              alt="SINAR Logo"
              class="w-80 h-80 mx-auto mb-4 opacity-90"
            />
          </div>
        </div>

        <!-- Login Form Section (40%) -->
        <div class="flex-[4] min-w-80 p-8 h-full flex flex-col justify-center">
          <!-- Header Inside Glass Card -->
          <div class="mb-8">
            <h1 class="text-3xl font-bold text-white mb-3 tracking-tight drop-shadow-sm">Welcome back</h1>
            <p class="text-white/80 font-medium text-base drop-shadow-sm">Login to your account</p>
          </div>

          <!-- Login Form -->
          <form onsubmit={handleSubmit} class="space-y-8">
            <!-- Username Field -->
            <div>
              <label for="username" class="block text-sm font-medium text-white/90 mb-2 drop-shadow-sm"
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
                class="block text-sm font-medium text-white/90 mb-2 drop-shadow-sm">Password</label
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
