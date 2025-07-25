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

    <!-- Main Card with Realistic Glassmorphism -->
    <div
      class="relative bg-white/8 backdrop-blur-xl border border-white/40 rounded-3xl overflow-hidden h-full"
      style="box-shadow: 
           inset 0 1px 0 0 rgba(255,255,255,0.4), 
           inset 0 -1px 0 0 rgba(255,255,255,0.2),
           inset -1px 0 0 0 rgba(255,255,255,0.1),
           inset 1px 0 0 0 rgba(255,255,255,0.1);"
    >
      <!-- Enhanced Glass Shine Effects -->
      <div
        class="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/15 to-transparent rounded-t-3xl"
      ></div>
      <div
        class="absolute top-4 left-4 w-20 h-20 bg-white/10 rounded-full blur-3xl"
      ></div>
      <div
        class="absolute top-1/3 right-8 w-12 h-12 bg-white/6 rounded-full blur-2xl"
      ></div>
      <div
        class="absolute bottom-1/4 left-1/3 w-8 h-8 bg-white/4 rounded-full blur-xl"
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
        <div class="flex-[4] min-w-80 bg-white rounded-r-3xl p-8 shadow-lg h-full flex flex-col justify-center">
          <!-- Header Inside Glass Card -->
          <div class="mb-8">
            <h1 class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3 tracking-tight">Welcome back</h1>
            <p class="text-slate-500 font-medium text-base">Login to your account</p>
          </div>

          <!-- Login Form -->
          <form onsubmit={handleSubmit} class="space-y-8">
            <!-- Username Field -->
            <div>
              <label for="username" class="block text-sm font-medium text-gray-700 mb-2"
                >Username</label
              >
              <input
                id="username"
                type="text"
                bind:value={username}
                class="w-full px-4 py-4 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                placeholder="Enter your username"
                required
              />
            </div>

            <!-- Password Field -->
            <div>
              <label
                for="password"
                class="block text-sm font-medium text-gray-700 mb-2">Password</label
              >
              <input
                id="password"
                type="password"
                bind:value={password}
                class="w-full px-4 py-4 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
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
