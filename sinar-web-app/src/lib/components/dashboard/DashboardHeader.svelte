<script lang="ts">
  import { onMount } from "svelte";
  import { authService, type ChangePasswordRequest } from "$lib/services";
  import { NavigationHelper } from "$lib/utils";
  import { Loading, toastStore, ConfirmationModal } from "$lib";
  import { modalToastStore } from "$lib/stores/modal-toast";

  let currentTime = $state("");
  let userName = $state("Admin");
  let userInitial = $state("A");
  let userRoleId = $state<number | null>(null);
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
    // Async initialization
    (async () => {
      // Get user data from backend
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        try {
          const response = await authService.getUserById(currentUser.id);
          if (response.status && response.data) {
            userName = response.data.username;
            userInitial = response.data.username.charAt(0).toUpperCase();
            
            // Debug: Log user data to check structure
            console.log('User data from API:', response.data);
            
            // Try multiple ways to get role_id
            userRoleId = response.data.role_id || 
                        response.data.role?.id || 
                        response.data.roleId ||
                        null;
            
            console.log('Extracted userRoleId:', userRoleId);
          }
        } catch (error) {
          console.error("Failed to fetch user data:", error);
          // Fallback to localStorage data
          userName = currentUser.username;
          userInitial = currentUser.username.charAt(0).toUpperCase();
          
          console.log('Current user from localStorage:', currentUser);
          
          userRoleId = currentUser.role_id || 
                      currentUser.role?.id || 
                      currentUser.roleId ||
                      currentUser.role ||
                      null;
          
          console.log('Fallback userRoleId:', userRoleId);
        }
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
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const request: ChangePasswordRequest = {
        old_password: changePasswordForm.old_password,
        new_password: changePasswordForm.new_password,
      };

      const response = await authService.changePassword(request);

      // Remove loading toast
      toastStore.remove(loadingToastId);

      if (response.status) {
        modalToastStore.success("Password changed successfully! You will be logged out in 3 seconds.");
        closeChangePasswordModal();
        
        // Auto logout after password change
        setTimeout(async () => {
          try {
            const logoutResponse = await authService.logout();
            NavigationHelper.navigateTo("/login");
          } catch (error) {
            console.error("Auto logout error:", error);
            // Force navigation even if logout fails
            NavigationHelper.navigateTo("/login");
          }
        }, 3000); // 3 seconds delay to let user read the success message
      } else {
        // Handle specific error messages
        if (response.message?.includes("incorrect") || response.message?.includes("wrong")) {
          modalToastStore.error("Current password is incorrect");
        } else {
          modalToastStore.error(response.message || "Failed to change password");
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
      isLoggingOut = false;
      showLogoutOverlay = false;
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
          <p class="text-sm font-medium text-gray-700 truncate" title="Welcome, {userName}">Welcome, {userName}</p>
          <p class="text-xs text-gray-500">{currentTime}</p>
        </div>

        <!-- Profile Dropdown -->
        <div class="relative profile-dropdown">
          <!-- User Avatar Button -->
          <button
            onclick={toggleProfileDropdown}
            class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
            title="Profile menu"
          >
            <span class="text-white text-sm font-medium">{userInitial}</span>
          </button>

          <!-- Dropdown Menu -->
          {#if showProfileDropdown}
            <div
              class="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-[99999]"
            >
              <div class="py-1">
                <!-- Profile Info -->
                <div class="px-4 py-2 border-b border-gray-100">
                  <p class="text-sm font-medium text-gray-900 truncate" title={userName}>{userName}</p>
                  <p class="text-xs text-gray-500">User Profile</p>
                </div>

                <!-- Profile Actions -->
                <!-- Change Password - Only for Admin (role_id = 1) -->
                {#if userRoleId === 1 || userRoleId === "1" || (userRoleId === null && userName.toLowerCase().includes('admin'))}
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
