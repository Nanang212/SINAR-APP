<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import {
    authService,
    userService,
    type ChangePasswordRequest,
  } from "$lib/services";
  import { NavigationHelper } from "$lib/utils";
  import { Loading, toastStore, ConfirmationModal } from "$lib";
  import { modalToastStore } from "$lib/stores/modal-toast";

  let currentTime = $state("");
  let userName = $state("Admin");
  let userInitial = $state("A");
  let userRoleId = $state<number | null>(null);
  let userLogo = $state<string | null>(null);
  let cachedPhotoUrl = $state<string | null>(null);
  let cacheKey = $state<string | null>(null);
  let isLoggingOut = $state(false);
  let showLogoutOverlay = $state(false);
  let showProfileDropdown = $state(false);
  let showChangePasswordModal = $state(false);
  let showChangePasswordConfirmation = $state(false);
  let isChangingPassword = $state(false);

  // Change password form data
  let changePasswordForm = $state({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });

  onMount(() => {
    // Check if this is a fresh session (after login/logout/token refresh)
    const isFreshSession = checkIfFreshSession();
    if (isFreshSession) {
      console.log("Fresh session detected, clearing all cache");
      clearAllCache();
    }

    // Load cached profile photo immediately if available (and not fresh session)
    if (!isFreshSession) {
      loadCachedPhotoImmediately();
    }

    // Async initialization
    (async () => {
      // Get user data from backend
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        let shouldUseCache = false;

        // Only use cache if NOT a fresh session and cache exists
        if (!isFreshSession) {
          const cachedUser = getCachedUserData(currentUser.id);
          if (cachedUser) {
            console.log("Using cached user data, no API call needed");
            await setUserDataFromCache(cachedUser);
            shouldUseCache = true;
          }
        }

        if (!shouldUseCache) {
          console.log(
            "Fresh session or no cache - fetching user data from API"
          );

          try {
            // Use userService instead of authService to get full user data including logo_url
            const response = await userService.getUserById(currentUser.id);

            if (response.status && response.data) {
              // Cache the user data
              setCachedUserData(currentUser.id, response.data);

              userName = response.data.username;
              userInitial = response.data.username.charAt(0).toUpperCase();

              // Try multiple ways to get role_id
              userRoleId =
                response.data.role_id || response.data.role?.id || null;

              console.log("Fresh user data loaded, userRoleId:", userRoleId);

              // Load profile photo with dynamic cache key based on updated_at or filepath
              if (response.data.id) {
                const cacheVersion =
                  response.data.updated_at ||
                  response.data.filepath ||
                  Date.now().toString();
                console.log(
                  "Loading fresh profile photo with version:",
                  cacheVersion
                );
                await loadProfilePhotoWithCache(response.data.id, cacheVersion);
              }
            } else {
              console.log(
                "Response failed:",
                response.message || "Unknown error"
              );
            }
          } catch (error) {
            console.error("Failed to fetch user data:", error);
            // Fallback to localStorage data
            userName = currentUser.username;
            userInitial = currentUser.username.charAt(0).toUpperCase();
            userLogo = null;
            userRoleId = typeof currentUser.role === "string" ? null : null;
          }
        }

        // Mark session as not fresh after first load
        markSessionAsNotFresh();
      }
    })();

    const updateTime = () => {
      const now = new Date();
      currentTime = now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    // Add click outside listener
    document.addEventListener("click", handleClickOutside);

    return () => {
      clearInterval(interval);
      document.removeEventListener("click", handleClickOutside);

      // Clean up blob URL if it's a blob (base64 data URLs don't need cleanup)
      if (userLogo && userLogo.startsWith("blob:")) {
        userService.revokeProfilePhotoUrl(userLogo);
      }
    };
  });

  function toggleProfileDropdown() {
    showProfileDropdown = !showProfileDropdown;
  }

  function openChangePasswordModal() {
    showChangePasswordModal = true;
    showProfileDropdown = false;
    // Reset form
    changePasswordForm = {
      old_password: "",
      new_password: "",
      confirm_password: "",
    };
  }

  function closeChangePasswordModal() {
    showChangePasswordModal = false;
    changePasswordForm = {
      old_password: "",
      new_password: "",
      confirm_password: "",
    };
  }

  async function handleChangePasswordSubmit(event: Event) {
    event.preventDefault();
    if (isChangingPassword) return;

    // Validation
    if (
      !changePasswordForm.old_password ||
      !changePasswordForm.new_password ||
      !changePasswordForm.confirm_password
    ) {
      modalToastStore.error("All fields are required");
      return;
    }

    if (
      changePasswordForm.new_password !== changePasswordForm.confirm_password
    ) {
      modalToastStore.error("New passwords do not match");
      return;
    }

    if (changePasswordForm.new_password.length < 6) {
      modalToastStore.error("New password must be at least 6 characters");
      return;
    }

    // Show confirmation modal
    showChangePasswordConfirmation = true;
  }

  async function handleChangePassword() {
    showChangePasswordConfirmation = false;
    isChangingPassword = true;

    // Show loading toast
    const loadingToastId = toastStore.info("Changing password...", 0); // 0 duration means no auto-close

    try {
      // Add slight delay to show loading state
      await new Promise((resolve) => setTimeout(resolve, 500));

      const request: ChangePasswordRequest = {
        old_password: changePasswordForm.old_password,
        new_password: changePasswordForm.new_password,
      };

      const response = await authService.changePassword(request);

      // Remove loading toast
      toastStore.remove(loadingToastId);

      if (response.status) {
        modalToastStore.success(
          "Password changed successfully! You will be logged out in 3 seconds."
        );
        closeChangePasswordModal();

        // Auto logout after password change
        setTimeout(async () => {
          try {
            await authService.logout();
            NavigationHelper.navigateTo("/login");
          } catch (error) {
            console.error("Auto logout error:", error);
            // Force navigation even if logout fails
            NavigationHelper.navigateTo("/login");
          }
        }, 3000); // 3 seconds delay to let user read the success message
      } else {
        // Handle specific error messages
        if (
          response.message?.includes("incorrect") ||
          response.message?.includes("wrong")
        ) {
          modalToastStore.error("Current password is incorrect");
        } else {
          modalToastStore.error(
            response.message || "Failed to change password"
          );
        }
      }
    } catch (error) {
      // Remove loading toast
      toastStore.remove(loadingToastId);
      modalToastStore.error("Failed to change password. Please try again.");
    } finally {
      isChangingPassword = false;
    }
  }

  // Handle logout functionality
  async function handleLogout() {
    if (isLoggingOut) return;

    isLoggingOut = true;
    showLogoutOverlay = true;
    showProfileDropdown = false;

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const response = await authService.logout();
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Clear all cache on logout
      clearAllCache();
      // Mark session as fresh for next login
      markSessionAsFresh();

      if (response.status) {
        NavigationHelper.navigateTo("/login");
      } else {
        console.error("Logout failed:", response.message);
        NavigationHelper.navigateTo("/login");
      }
    } catch (error) {
      console.error("Logout error:", error);
      await new Promise((resolve) => setTimeout(resolve, 500));
      NavigationHelper.navigateTo("/login");
    } finally {
      // Clear cache even if logout fails
      clearAllCache();
      // Mark session as fresh for next login
      markSessionAsFresh();
      isLoggingOut = false;
      showLogoutOverlay = false;
    }
  }

  // Profile photo cache functions
  function getCacheKey(userId: number, version: string): string {
    return `profile_photo_${userId}_${version}`;
  }

  function getCachedPhoto(
    cacheKey: string
  ): { url: string; timestamp: number } | null {
    try {
      if (typeof window === "undefined") return null;

      const cached = localStorage.getItem(cacheKey);
      if (!cached) return null;

      const parsed = JSON.parse(cached);
      // No expiry check - cache persists until logout
      return parsed;
    } catch (error) {
      console.error("Error reading cache:", error);
      return null;
    }
  }

  function setCachedPhoto(cacheKey: string, url: string): void {
    try {
      if (typeof window === "undefined") return;

      const cacheData = {
        url,
        timestamp: Date.now(),
      };

      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log(
        "Cached photo with key:",
        cacheKey,
        "URL length:",
        url.length
      );
    } catch (error) {
      console.error("Error setting cache:", error);
    }
  }

  function clearAllCache(): void {
    try {
      if (typeof window === "undefined") return;

      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          (key.startsWith("profile_photo_") || key.startsWith("user_data_"))
        ) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => localStorage.removeItem(key));
      if (keysToRemove.length > 0) {
        console.log(`Cleared ${keysToRemove.length} cached entries`);
      }
    } catch (error) {
      console.error("Error during cache cleanup:", error);
    }
  }

  // Session freshness tracking
  function checkIfFreshSession(): boolean {
    try {
      if (typeof window === "undefined") return true;
      const sessionFlag = sessionStorage.getItem("dashboard_session_fresh");
      return sessionFlag !== "false"; // Default to fresh if not set
    } catch (error) {
      return true; // Default to fresh on error
    }
  }

  function markSessionAsNotFresh(): void {
    try {
      if (typeof window === "undefined") return;
      sessionStorage.setItem("dashboard_session_fresh", "false");
    } catch (error) {
      console.error("Error marking session as not fresh:", error);
    }
  }

  function markSessionAsFresh(): void {
    try {
      if (typeof window === "undefined") return;
      sessionStorage.removeItem("dashboard_session_fresh");
    } catch (error) {
      console.error("Error marking session as fresh:", error);
    }
  }

  // User data caching functions
  function getCachedUserData(userId: number): any | null {
    try {
      if (typeof window === "undefined") return null;

      const cached = localStorage.getItem(`user_data_${userId}`);
      if (!cached) return null;

      const parsed = JSON.parse(cached);
      return parsed;
    } catch (error) {
      console.error("Error reading user data cache:", error);
      return null;
    }
  }

  function setCachedUserData(userId: number, userData: any): void {
    try {
      if (typeof window === "undefined") return;
      localStorage.setItem(`user_data_${userId}`, JSON.stringify(userData));
      console.log("Cached user data for user ID:", userId);
    } catch (error) {
      console.error("Error setting user data cache:", error);
    }
  }

  async function setUserDataFromCache(userData: any): Promise<void> {
    userName = userData.username;
    userInitial = userData.username.charAt(0).toUpperCase();

    // Try multiple ways to get role_id
    userRoleId = userData.role_id || userData.role?.id || null;

    console.log("Set user data from cache, userRoleId:", userRoleId);

    // Load profile photo from cache if available
    if (userData.id && !userLogo) {
      const cacheVersion =
        userData.updated_at || userData.filepath || "current";
      await loadProfilePhotoWithCache(userData.id, cacheVersion);
    }
  }

  function loadCachedPhotoImmediately(): void {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) return;

      // Try to get cached user data to determine the correct cache version
      const cachedUser = getCachedUserData(currentUser.id);
      const cacheVersion = cachedUser
        ? cachedUser.updated_at || cachedUser.filepath || "current"
        : "current";
      const photoKey = getCacheKey(currentUser.id, cacheVersion);
      const cached = getCachedPhoto(photoKey);

      if (cached && cached.url && cached.url.startsWith("data:")) {
        userLogo = cached.url;
        cachedPhotoUrl = cached.url;
        cacheKey = photoKey;
        console.log("Profile photo loaded immediately from cache (no flicker)");
      }
    } catch (error) {
      console.error("Error loading immediate cache:", error);
    }
  }

  // async function loadProfilePhotoWithCache(userId: number, version: string): Promise<void> {
  //   const newCacheKey = getCacheKey(userId, version);
  //   console.log('Loading profile photo with cache key:', newCacheKey);

  //   // If we already have this version cached, use it immediately
  //   if (newCacheKey === cacheKey && cachedPhotoUrl) {
  //     userLogo = cachedPhotoUrl;
  //     console.log('Using already loaded cached profile photo');
  //     return;
  //   }

  //   // Check cache first
  //   const cached = getCachedPhoto(newCacheKey);
  //   if (cached && cached.url) {
  //     console.log('Found cached photo in localStorage');

  //     // Check if it's a blob URL (invalid after page refresh) or base64 (valid)
  //     if (cached.url.startsWith('blob:')) {
  //       console.log('Cached URL is blob (invalid after refresh), will fetch fresh from API');
  //       // Remove invalid blob cache
  //       localStorage.removeItem(newCacheKey);
  //     } else if (cached.url.startsWith('data:')) {
  //       console.log('Cached URL is base64 (valid), using cached photo');
  //       userLogo = cached.url;
  //       cachedPhotoUrl = cached.url;
  //       cacheKey = newCacheKey;
  //       console.log('Profile photo loaded from cache (persists until logout)');
  //       return;
  //     } else {
  //       console.log('Unknown cached URL format:', cached.url.substring(0, 50));
  //       // Remove unknown format cache
  //       localStorage.removeItem(newCacheKey);
  //     }
  //   } else {
  //     console.log('No cached photo found for key:', newCacheKey);
  //   }

  //   // Not in cache, fetch from API
  //   try {
  //     console.log('Fetching profile photo from API for userId:', userId);
  //     const blobUrl = await userService.getUserProfilePhotoUrl(userId);

  //     if (blobUrl) {
  //       console.log('API returned blob URL, converting to base64...');

  //       // Convert blob URL to base64 for persistent storage
  //       try {
  //         const response = await fetch(blobUrl);
  //         const blob = await response.blob();

  //         // Convert blob to base64
  //         const base64 = await new Promise<string>((resolve, reject) => {
  //           const reader = new FileReader();
  //           reader.onload = () => resolve(reader.result as string);
  //           reader.onerror = reject;
  //           reader.readAsDataURL(blob);
  //         });

  //         // Cache the base64 string (will persist after refresh)
  //         setCachedPhoto(newCacheKey, base64);
  //         userLogo = base64;
  //         cachedPhotoUrl = base64;
  //         cacheKey = newCacheKey;

  //         // Clean up the temporary blob URL
  //         userService.revokeProfilePhotoUrl(blobUrl);

  //         console.log('✅ Profile photo fetched and cached as base64');
  //       } catch (conversionError) {
  //         console.error('❌ Failed to convert blob to base64:', conversionError);
  //         // Fallback to blob URL (won't persist after refresh)
  //         userLogo = blobUrl;
  //         cachedPhotoUrl = null;
  //         cacheKey = null;
  //       }
  //     } else {
  //       console.log('No profile photo available from API');
  //       userLogo = null;
  //       cachedPhotoUrl = null;
  //       cacheKey = null;
  //     }
  //   } catch (photoError) {
  //     console.error('❌ Failed to load profile photo from API:', photoError);
  //     userLogo = null;
  //     cachedPhotoUrl = null;
  //     cacheKey = null;
  //   }
  // }

  async function loadProfilePhotoWithCache(
    userId: number,
    version: string
  ): Promise<void> {
    const newCacheKey = getCacheKey(userId, version);
    console.log("Loading profile photo with cache key:", newCacheKey);

    if (newCacheKey === cacheKey && cachedPhotoUrl) {
      userLogo = cachedPhotoUrl;
      console.log("Using already loaded cached profile photo");
      return;
    }

    const cached = getCachedPhoto(newCacheKey);
    if (cached && cached.url) {
      if (cached.url.startsWith("blob:")) {
        localStorage.removeItem(newCacheKey);
      } else if (cached.url.startsWith("data:")) {
        userLogo = cached.url;
        cachedPhotoUrl = cached.url;
        cacheKey = newCacheKey;
        console.log("Profile photo loaded from cache (persists until logout)");
        return;
      } else {
        localStorage.removeItem(newCacheKey);
      }
    } else {
      console.log("No cached photo found for key:", newCacheKey);
    }

    // ⬇️⬇️ MODIFIKASI DI SINI: suntik cache-buster via argumen userId
    try {
      console.log("Fetching profile photo from API for userId:", userId);

      // buat userId dengan query param versi + timestamp (double cache-buster)
      const userIdWithQs = `${userId}?v=${encodeURIComponent(version)}&_=${Date.now()}`;

      const blobUrl = await userService.getUserProfilePhotoUrl(
        userIdWithQs as unknown as number
      );
      // catatan: signature menerima string | number, di sini aman dipaksa cast.

      if (blobUrl) {
        console.log("API returned blob URL, converting to base64...");

        try {
          const response = await fetch(blobUrl, { cache: "no-store" }); // tambah no-store di fetch lokal
          const blob = await response.blob();

          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });

          setCachedPhoto(newCacheKey, base64);
          userLogo = base64;
          cachedPhotoUrl = base64;
          cacheKey = newCacheKey;

          userService.revokeProfilePhotoUrl(blobUrl);
          console.log("✅ Profile photo fetched and cached as base64");
        } catch (conversionError) {
          console.error(
            "❌ Failed to convert blob to base64:",
            conversionError
          );
          userLogo = blobUrl;
          cachedPhotoUrl = null;
          cacheKey = null;
        }
      } else {
        console.log("No profile photo available from API");
        userLogo = null;
        cachedPhotoUrl = null;
        cacheKey = null;
      }
    } catch (photoError) {
      console.error("❌ Failed to load profile photo from API:", photoError);
      userLogo = null;
      cachedPhotoUrl = null;
      cacheKey = null;
    }
  }

  // Close dropdown when clicking outside
  function handleClickOutside(event: Event) {
    const target = event.target as Element;
    if (!target.closest(".profile-dropdown")) {
      showProfileDropdown = false;
    }
  }
</script>

<header
  class="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm relative z-[50]"
>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between items-center py-4">
      <!-- Spacer for left side -->
      <div></div>

      <!-- User Info & Actions -->
      <div class="flex items-center space-x-3 min-w-0">
        <div class="text-right min-w-0 flex-shrink">
          <p
            class="text-sm font-medium text-gray-700 truncate"
            title="Welcome, {userName}"
          >
            Welcome, {userName}
          </p>
          <p class="text-xs text-gray-500">{currentTime}</p>
        </div>

        <!-- Profile Dropdown -->
        <div class="relative profile-dropdown">
          <!-- User Avatar Button -->
          <button
            onclick={toggleProfileDropdown}
            class="w-14 h-14 rounded-full flex items-center justify-center hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 {userLogo
              ? ''
              : 'bg-blue-500 hover:bg-blue-600'}"
            title="Profile menu"
          >
            {#if userLogo}
              {#key cacheKey}
                <img
                  src={userLogo}
                  alt="Profile"
                  class="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                  onerror={(e) => {
                    console.log(
                      "Image failed to load, clearing cache and falling back to initial"
                    );
                    if (cacheKey) {
                      localStorage.removeItem(cacheKey);
                    }
                    userLogo = null;
                    cachedPhotoUrl = null;
                    cacheKey = null;

                    const img = e.currentTarget as HTMLImageElement;
                    const fallback = img.nextElementSibling as HTMLElement;
                    img.style.display = "none";
                    if (fallback) {
                      fallback.style.display = "flex";
                    }
                  }}
                />
              {/key}
              <span
                class="hidden w-12 h-12 bg-blue-500 rounded-full items-center justify-center text-white text-base font-medium"
              >
                {userInitial}
              </span>
            {:else}
              <span class="text-white text-base font-medium">{userInitial}</span
              >
            {/if}
          </button>

          <!-- Dropdown Menu -->
          {#if showProfileDropdown}
            <div
              class="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-[99999]"
            >
              <div class="py-1">
                <!-- Profile Info -->
                <div class="px-4 py-2 border-b border-gray-100">
                  <p
                    class="text-sm font-medium text-gray-900 truncate"
                    title={userName}
                  >
                    {userName}
                  </p>
                  <p class="text-xs text-gray-500">User Profile</p>
                </div>

                <!-- Profile Actions -->
                <!-- Change Password - Only for Admin (role_id = 1) -->
                {#if userRoleId === 1 || (userRoleId === null && userName
                      .toLowerCase()
                      .includes("admin"))}
                  <button
                    onclick={openChangePasswordModal}
                    class="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  >
                    <svg
                      class="w-4 h-4 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1721 9z"
                      />
                    </svg>
                    Change Password
                  </button>

                  <div class="border-t border-gray-100"></div>
                {/if}

                <!-- Logout Button -->
                <button
                  onclick={handleLogout}
                  disabled={isLoggingOut}
                  class="w-full flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {#if isLoggingOut}
                    <svg
                      class="w-4 h-4 mr-3 animate-spin"
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
                    Logging out...
                  {:else}
                    <svg
                      class="w-4 h-4 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Logout
                  {/if}
                </button>
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</header>

<!-- Change Password Modal -->
{#if showChangePasswordModal}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
  >
    <div class="bg-white rounded-lg shadow-xl p-6 w-96 max-w-md mx-4">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold text-gray-900">Change Password</h3>
        <button
          onclick={closeChangePasswordModal}
          class="text-gray-400 hover:text-gray-600"
          aria-label="Close modal"
        >
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <form onsubmit={handleChangePasswordSubmit}>
        <div class="space-y-4">
          <!-- Old Password -->
          <div>
            <label
              for="old_password"
              class="block text-sm font-medium text-gray-700 mb-1"
            >
              Current Password
            </label>
            <input
              type="password"
              id="old_password"
              bind:value={changePasswordForm.old_password}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <!-- New Password -->
          <div>
            <label
              for="new_password"
              class="block text-sm font-medium text-gray-700 mb-1"
            >
              New Password
            </label>
            <input
              type="password"
              id="new_password"
              bind:value={changePasswordForm.new_password}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <!-- Confirm New Password -->
          <div>
            <label
              for="confirm_password"
              class="block text-sm font-medium text-gray-700 mb-1"
            >
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirm_password"
              bind:value={changePasswordForm.confirm_password}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        <div class="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onclick={closeChangePasswordModal}
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isChangingPassword}
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {#if isChangingPassword}
              Changing...
            {:else}
              Change Password
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Change Password Confirmation Modal -->
<ConfirmationModal
  isOpen={showChangePasswordConfirmation}
  title="Change Password Confirmation"
  message="Are you sure you want to change your password? You will be automatically logged out after the password is changed for security reasons."
  confirmText="Change Password"
  cancelText="Cancel"
  confirmButtonClass="bg-blue-600 hover:bg-blue-700 text-white"
  isLoading={isChangingPassword}
  onConfirm={handleChangePassword}
  onCancel={() => {
    showChangePasswordConfirmation = false;
  }}
/>

<!-- Logout loading overlay -->
{#if showLogoutOverlay}
  <Loading overlay={true} text="Logging out..." />
{/if}
