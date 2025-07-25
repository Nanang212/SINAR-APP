<script lang="ts">
  let email = $state("");
  let password = $state("");

  function handleSubmit(event: Event) {
    event.preventDefault();
    console.log("Login attempt:", { email, password });
    // Handle login logic here
  }
</script>

<div class="w-full max-w-2xl">
  <!-- Glassmorphism Card Container -->
  <div class="relative">
    <!-- 3D Shadow Effects -->
    <div
      class="absolute inset-0 bg-black/20 rounded-3xl transform translate-x-2 translate-y-2 blur-lg"
    ></div>
    <div
      class="absolute inset-0 bg-black/10 rounded-3xl transform translate-x-1 translate-y-1 blur-md"
    ></div>

    <!-- Main Card with Enhanced Glassmorphism -->
    <div
      class="relative bg-white/5 backdrop-blur-xl border border-white/30 rounded-3xl px-16 py-12 shadow-2xl overflow-hidden"
      style="box-shadow: 
           inset 0 1px 0 0 rgba(255,255,255,0.2), 
           inset 0 -1px 0 0 rgba(255,255,255,0.1),
           0 20px 40px rgba(0,0,0,0.3),
           0 8px 16px rgba(0,0,0,0.2);"
    >
      <!-- Glass Shine Effect -->
      <div
        class="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent rounded-t-3xl"
      ></div>
      <div
        class="absolute top-4 left-4 w-20 h-20 bg-white/5 rounded-full blur-xl"
      ></div>

      <!-- Header Inside Glass Card -->
      <div class="mb-8 relative z-10">
        <h1 class="text-2xl font-semibold text-white mb-2">Welcome back</h1>
        <p class="text-gray-300">Login to your account</p>
      </div>

      <!-- Login Form -->
      <form onsubmit={handleSubmit} class="space-y-8 relative z-10">
        <!-- Email Field -->
        <div>
          <label for="email" class="block text-sm font-medium text-white mb-2"
            >Email</label
          >
          <input
            id="email"
            type="email"
            bind:value={email}
            class="w-full px-4 py-4 bg-white/20 backdrop-blur-sm border border-white/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/60 focus:border-white/60 focus:bg-white/30 transition-all duration-200"
            placeholder="m@example.com"
            required
          />
        </div>

        <!-- Password Field -->
        <div>
          <label
            for="password"
            class="block text-sm font-medium text-white mb-2">Password</label
          >
          <input
            id="password"
            type="password"
            bind:value={password}
            class="w-full px-4 py-4 bg-white/20 backdrop-blur-sm border border-white/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/60 focus:border-white/60 focus:bg-white/30 transition-all duration-200"
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
