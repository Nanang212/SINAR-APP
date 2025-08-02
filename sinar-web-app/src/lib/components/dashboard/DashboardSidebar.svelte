<script lang="ts">
  import { page } from '$app/stores';
  import { authService } from '$lib/services/auth/auth.service';
  import { browser } from '$app/environment';
  
  let isSidebarOpen = $state(false);
  let isCollapsed = $state(false);
  let isLocked = $state(true); // Default locked (always visible)

  let currentPath = $derived($page.url.pathname);
  
  // Only get user role in browser environment
  let userRole = $derived(() => {
    if (!browser) return null;
    return authService.getCurrentUserRole();
  });
  
  let isAdmin = $derived(() => {
    if (!browser) return false;
    return authService.isAdmin();
  });
  
  let isUser = $derived(() => {
    if (!browser) return false;
    return authService.isUser();
  });

  const menuSections = [
    {
      title: 'Main',
      roles: ['admin', 'user'], // Available for both admin and user
      items: [
        {
          icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h2a2 2 0 012 2v2H8V5z"></path>`,
          label: 'Dashboard',
          href: '/home'
        }
      ]
    },
    {
      title: 'Admin',
      roles: ['admin'], // Only available for admin
      items: [
        {
          icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>`,
          label: 'Master User',
          href: '/admin/users'
        },
        {
          icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>`,
          label: 'Master Kategori',
          href: '/admin/categories'
        },
        {
          icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>`,
          label: 'Master Document',
          href: '/admin/documents'
        }
      ]
    },
    {
      title: 'User',
      roles: ['admin', 'user'], // Available for both admin and regular users
      items: [
        {
          icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>`,
          label: 'List Dokumen',
          href: '/user/documents'
        },
        {
          icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>`,
          label: 'List Kategori',
          href: '/user/categories'
        },
        {
          icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2 2z"></path>`,
          label: 'List Report',
          href: '/user/reports'
        }
      ]
    }
  ];

  // Filter menu sections based on user role
  const visibleMenuSections = $derived(() => {
    const currentRole = userRole();
    if (!browser || !currentRole) {
      // During SSR or when no role, show main menu only
      return menuSections.filter(section => section.title === 'Main');
    }
    
    return menuSections.filter(section => 
      section.roles.includes(currentRole)
    );
  });

  function toggleSidebar() {
    isSidebarOpen = !isSidebarOpen;
  }

  function toggleCollapse() {
    isCollapsed = !isCollapsed;
  }

  function toggleLock() {
    isLocked = !isLocked;
    if (isLocked) {
      isCollapsed = false; // Expand when locked
    }
  }

  function handleMouseEnter() {
    if (!isLocked && isCollapsed) {
      isCollapsed = false;
    }
  }

  function handleMouseLeave() {
    if (!isLocked) {
      isCollapsed = true;
    }
  }
</script>

<!-- Mobile menu button -->
<div class="lg:hidden fixed top-4 left-4 z-50">
  <button
    onclick={toggleSidebar}
    class="p-2 rounded-md bg-white shadow-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
    aria-label="Toggle menu"
  >
    <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
    </svg>
  </button>
</div>

<!-- Sidebar -->
<aside 
  class="
    {isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
    lg:translate-x-0 
    fixed lg:static 
    inset-y-0 left-0 
    {isCollapsed ? 'w-16' : 'w-64'} 
    bg-white/90 backdrop-blur-sm 
    border-r border-gray-200/50 
    shadow-lg lg:shadow-none
    transition-all duration-300 ease-in-out 
    z-40
    flex flex-col
    group
  "
  onmouseenter={handleMouseEnter}
  onmouseleave={handleMouseLeave}
>
  <!-- Sidebar Header -->
  <div class="p-6 border-b border-gray-200/50 relative">
    <div class="flex items-center {isCollapsed ? 'justify-center' : 'space-x-3'}">
      <img src="/assets/logo.png" alt="SINAR Logo" class="w-8 h-8" />
      {#if !isCollapsed}
        <div class="transition-opacity duration-300">
          <h2 class="text-lg font-bold text-gray-800">SINAR</h2>
          <p class="text-xs text-gray-600">Dashboard</p>
        </div>
      {/if}
    </div>
    
    <!-- Sidebar Controls (Desktop only) -->
    <div class="hidden lg:flex absolute top-2 right-2 space-x-1">
      <!-- Lock/Unlock Button -->
      <button
        onclick={toggleLock}
        class="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        title={isLocked ? 'Unlock sidebar' : 'Lock sidebar'}
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {#if isLocked}
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          {:else}
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"/>
          {/if}
        </svg>
      </button>
      
      <!-- Collapse/Expand Button (only when unlocked) -->
      {#if !isLocked}
        <button
          onclick={toggleCollapse}
          class="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {#if isCollapsed}
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"/>
            {:else}
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7M19 19l-7-7 7-7"/>
            {/if}
          </svg>
        </button>
      {/if}
    </div>
  </div>

  <!-- Navigation Menu -->
  <nav class="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
    {#each visibleMenuSections() as section}
      <div>
        <!-- Section Title -->
        {#if !isCollapsed}
          <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3 transition-opacity duration-300">
            {section.title}
          </h4>
        {:else}
          <div class="w-full h-px bg-gray-200 mb-3"></div>
        {/if}
        
        <!-- Section Items -->
        <div class="space-y-1">
          {#each section.items as item}
            <a
              href={item.href}
              class="flex items-center {isCollapsed ? 'justify-center px-2' : 'space-x-3 px-3'} py-2 rounded-lg text-sm font-medium transition-all duration-200 relative group
              {currentPath === item.href 
                ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }"
              title={isCollapsed ? item.label : ''}
            >
              <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {@html item.icon}
              </svg>
              {#if !isCollapsed}
                <span class="transition-opacity duration-300">{item.label}</span>
              {/if}
              
              <!-- Tooltip for collapsed state -->
              {#if isCollapsed}
                <div class="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                  {item.label}
                  <div class="absolute top-1/2 -left-1 transform -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                </div>
              {/if}
            </a>
          {/each}
        </div>
      </div>
    {/each}
  </nav>

  <!-- Sidebar Footer -->
  <div class="p-4 border-t border-gray-200/50">
    <div class="text-xs text-gray-500 {isCollapsed ? 'text-center' : 'text-center'}">
      {#if !isCollapsed}
        SINAR v1.0.6
      {:else}
        v1.0.6
      {/if}
    </div>
  </div>
</aside>

<!-- Mobile overlay -->
{#if isSidebarOpen}
  <div 
    class="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
    onclick={toggleSidebar}
    onkeydown={(e) => e.key === 'Enter' && toggleSidebar()}
    role="button"
    tabindex="0"
    aria-label="Close menu"
  ></div>
{/if}