<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { userService, categoryService, type User, type CreateUserRequest, type UpdateUserRequest, type Category } from '$lib/services';
  import Loading from '$lib/components/ui/loading.svelte';
  import ConfirmationModal from '$lib/components/ui/ConfirmationModal.svelte';
  import { toastStore } from '$lib/stores/toast';
  import { modalToastStore } from '$lib/stores/modal-toast';

  interface $$Props {
    onSubmit?: (data: FormData) => void;
    onReset?: () => void;
    userData?: User | null;
  }

  let { onSubmit, onReset, userData }: $$Props = $props();

  // Form state
  let selectedCategory: string = $state('');
  let selectedRole: string = $state('2'); // Default to "User" (role_id = 2)
  let formRef: HTMLFormElement;
  let categories: Category[] = $state([]);
  let categoriesLoading = $state(true);
  let selectedLogoFile = $state<File | null>(null);
  let isRoleDropdownOpen = $state(false);
  let isCategoryDropdownOpen = $state(false);
  let isSubmitting = $state(false);
  let isFormDisabled = $state(false);

  // Form validation state
  let username = $state('');
  let password = $state('');

  // Track loaded user to prevent infinite loops
  let loadedUserId = $state<number | null>(null);

  // Track if form completed an update (edit mode only)
  let hasCompletedUpdate = $state(false);

  // Crop modal state
  let showCropModal = $state(false);
  let cropImageElement = $state<HTMLImageElement | null>(null);
  let cropper = $state<any>(null);
  let tempImageFile: File | null = null;
  let logoPreview = $state<string>('');
  let cropImageSrc = $state<string>('');

  // Password reset modal state
  let showPasswordModal = $state(false);
  let newPassword = $state('');
  let confirmPassword = $state('');
  let isResettingPassword = $state(false);
  let showConfirmResetModal = $state(false);
  
  // Hardcoded roles
  const roles = [
    { id: 1, name: 'Admin' },
    { id: 2, name: 'User' }
  ];
  
  // Check if we're in edit mode
  const isEditMode = $derived(userData !== null);

  // Form validation - check if required fields are filled
  const isFormValid = $derived.by(() => {
    if (isEditMode) {
      // For edit mode, only username is required
      return username.trim().length > 0;
    } else {
      // For create mode, both username and password are required
      return username.trim().length > 0 && password.trim().length > 0;
    }
  });

  // Load categories on mount
  onMount(async () => {
    await loadCategories();
  });

  // Watch for userData changes and auto-reset when cleared (tab switch)
  let previousUserData = userData;
  $effect(() => {
    // Only reset if userData changed from filled to null (tab switch scenario)
    // BUT don't auto-reset if form has completed an update (edit mode)
    console.log('🔍 Tab switch effect:', {
      previousUserData: previousUserData?.id,
      currentUserData: userData?.id,
      hasCompletedUpdate,
      isFormDisabled
    });
    
    if (previousUserData !== null && userData === null) {
      console.log('🔄 Tab switch detected - checking if should auto-reset...');
      
      // Don't auto-reset if we just completed an update in edit mode
      if (!hasCompletedUpdate) {
        console.log('✅ Auto-resetting form (hasCompletedUpdate = false)');
        setTimeout(() => {
          handleReset();
        }, 100);
      } else {
        console.log('🚫 Skipping auto-reset (hasCompletedUpdate = true)');
      }
    }
    previousUserData = userData;
  });

  // Load user data into form when provided
  $effect(() => {
    if (userData && formRef) {
      populateForm(userData);
    }
  });

  // Debug: Watch isFormDisabled changes
  $effect(() => {
    console.log('🔒 isFormDisabled changed to:', isFormDisabled, 'hasCompletedUpdate:', hasCompletedUpdate);
  });

  onDestroy(() => {
    // Clean up any remaining blob URLs to prevent memory leaks
    if (logoPreview && logoPreview.startsWith('blob:')) {
      userService.revokeProfilePhotoUrl(logoPreview);
    }
  });

  async function loadCategories() {
    categoriesLoading = true;
    try {
      const response = await categoryService.getAllCategories();
      if (response.status && response.data) {
        categories = response.data;
      } else {
        console.error('Failed to load categories:', response.message);
        categories = [];
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      categories = [];
    } finally {
      categoriesLoading = false;
    }
  }

  async function loadUserProfilePhoto(userId: number) {
    try {
      // Clean up any existing blob URL first
      if (logoPreview && logoPreview.startsWith('blob:')) {
        userService.revokeProfilePhotoUrl(logoPreview);
      }
      
      const photoUrl = await userService.getUserProfilePhotoUrl(userId);
      if (photoUrl) {
        logoPreview = photoUrl;
      }
    } catch (error) {
      console.error('Failed to load profile photo:', error);
    }
  }

  function populateForm(user: User) {
    const form = formRef;
    if (!form) return;

    // Only reset completed update flag if it's a different user
    // If it's the same user (tab switching), keep the completed update state
    console.log('🔍 populateForm comparison: loadedUserId =', loadedUserId, 'user.id =', user.id);
    if (loadedUserId !== user.id) {
      console.log('🔄 populateForm: Different user, resetting hasCompletedUpdate');
      hasCompletedUpdate = false;
    } else {
      console.log('📌 populateForm: Same user, keeping hasCompletedUpdate =', hasCompletedUpdate);
    }
    
    console.log('📝 populateForm called - hasCompletedUpdate:', hasCompletedUpdate, 'isFormDisabled:', isFormDisabled);

    // If this user has completed an update, keep form disabled
    if (hasCompletedUpdate && !isFormDisabled) {
      console.log('🔒 Re-disabling form because hasCompletedUpdate = true');
      isFormDisabled = true;
    }

    // Populate basic fields
    username = user.username || '';
    (form.querySelector('#username') as HTMLInputElement).value = user.username || '';
    (form.querySelector('#contact_person') as HTMLInputElement).value = user.contact_person || '';
    (form.querySelector('#name_mentri') as HTMLInputElement).value = user.name_mentri || '';
    
    // Populate category and role
    selectedCategory = user.category?.id?.toString() || '';
    selectedRole = user.role?.id?.toString() || '2';
    
    // Populate logo if available - fetch with authorization (only if not already loaded)
    if (user.logo_url && user.id && loadedUserId !== user.id) {
      loadedUserId = user.id;
      loadUserProfilePhoto(user.id);
      // Note: selectedLogoFile stays null for existing images from server
    }
  }

  function handleCategoryChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    selectedCategory = select.value;
  }

  function handleRoleSelect(roleId: string) {
    selectedRole = roleId;
    isRoleDropdownOpen = false;
    
    // If Admin is selected, clear and hide category
    if (selectedRole === '1') {
      selectedCategory = '';
    }
  }

  function handleCategorySelect(categoryId: string) {
    selectedCategory = categoryId;
    isCategoryDropdownOpen = false;
  }

  function toggleRoleDropdown() {
    if (!isFormDisabled) {
      isRoleDropdownOpen = !isRoleDropdownOpen;
      isCategoryDropdownOpen = false;
    }
  }

  function toggleCategoryDropdown() {
    if (!isFormDisabled) {
      isCategoryDropdownOpen = !isCategoryDropdownOpen;
      isRoleDropdownOpen = false;
    }
  }

  // Get name_mentri based on selected category
  function getNameMentriFromCategory(): string {
    if (!selectedCategory) return '';
    
    const category = categories.find(cat => cat.id.toString() === selectedCategory);
    return category ? category.name : '';
  }

  async function handleSubmit(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    
    // Start loading and disable form
    isSubmitting = true;
    isFormDisabled = true;

    try {
      if (isEditMode && userData) {
        // Update existing user
        const updateData: UpdateUserRequest = {
          username: formData.get('username') as string,
          role_id: parseInt(selectedRole),
          contact_person: formData.get('contact_person') as string || undefined,
          name_mentri: formData.get('name_mentri') as string || undefined,
          category_id: selectedRole === '1' ? null : (selectedCategory ? parseInt(selectedCategory) : null),
          // Only include logo if user selected a new file, otherwise don't send it to keep existing photo
          ...(selectedLogoFile && { logo: selectedLogoFile })
        };

        const result = await userService.updateUser(userData.id, updateData);
        if (result.status) {
          console.log('User updated successfully:', result.data);
          modalToastStore.success('User updated successfully!');
          // Mark as completed update to prevent auto-reset on tab switch
          hasCompletedUpdate = true;
          console.log('🎯 Set hasCompletedUpdate = true, isFormDisabled =', isFormDisabled);
        } else {
          console.error('Update failed:', result.message);
          modalToastStore.error(result.message || 'Failed to update user');
          isFormDisabled = false;
        }
      } else {
        // Create new user
        const password = formData.get('password') as string;
        if (!password) {
          modalToastStore.error('Password is required for new user');
          isSubmitting = false;
          isFormDisabled = false;
          return;
        }

        const createData: CreateUserRequest = {
          username: formData.get('username') as string,
          password: password,
          role_id: parseInt(selectedRole),
          contact_person: formData.get('contact_person') as string || undefined,
          name_mentri: formData.get('name_mentri') as string || undefined,
          category_id: selectedRole === '1' ? null : (selectedCategory ? parseInt(selectedCategory) : null),
          logo: selectedLogoFile || undefined
        };

        const result = await userService.createUser(createData);
        if (result.status) {
          console.log('User created successfully:', result.data);
          modalToastStore.success('User created successfully!');
        } else {
          console.error('Create failed:', result.message);
          modalToastStore.error(result.message || 'Failed to create user');
          isFormDisabled = false;
        }
      }
    } catch (error) {
      console.error('Submit error:', error);
      modalToastStore.error('An unexpected error occurred');
      isFormDisabled = false;
    } finally {
      isSubmitting = false;
    }

    // Also call parent callback if provided
    onSubmit?.(formData);
  }

  function handleReset() {
    console.log('🧹 handleReset called, hasCompletedUpdate was:', hasCompletedUpdate);
    console.trace('📍 handleReset call stack:');
    
    // Reset form validation fields
    username = '';
    password = '';
    
    // Reset loaded user tracking
    loadedUserId = null;
    
    // Reset completed update flag
    hasCompletedUpdate = false;
    
    selectedCategory = '';
    selectedRole = '2'; // Reset to "User" default
    selectedLogoFile = null;
    
    // Clean up blob URL before clearing
    if (logoPreview && logoPreview.startsWith('blob:')) {
      userService.revokeProfilePhotoUrl(logoPreview);
    }
    logoPreview = ''; // Clear both uploaded and server logo URLs
    
    isRoleDropdownOpen = false;
    isCategoryDropdownOpen = false;
    isFormDisabled = false;
    closeCropModal(); // Close crop modal if open
    formRef?.reset();
    onReset?.();
  }

  function openPasswordResetModal() {
    if (!userData) return;
    newPassword = '';
    confirmPassword = '';
    showPasswordModal = true;
  }

  function closePasswordModal() {
    showPasswordModal = false;
    newPassword = '';
    confirmPassword = '';
  }

  function requestPasswordReset() {
    if (!userData || !newPassword.trim()) {
      modalToastStore.error('New password is required');
      return;
    }

    if (newPassword !== confirmPassword) {
      modalToastStore.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      modalToastStore.error('Password must be at least 6 characters long');
      return;
    }

    // Show confirmation dialog
    showConfirmResetModal = true;
  }

  async function handlePasswordReset() {
    showConfirmResetModal = false;
    isResettingPassword = true;
    
    try {
      const result = await userService.resetPassword(userData!.id, {
        new_password: newPassword
      });

      if (result.status) {
        modalToastStore.success('Password reset successfully!');
        closePasswordModal();
      } else {
        modalToastStore.error(result.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      modalToastStore.error('An error occurred while resetting password');
    } finally {
      isResettingPassword = false;
    }
  }

  function cancelPasswordReset() {
    showConfirmResetModal = false;
  }

  function handleFileAreaClick() {
    if (!browser) return;
    if (isFormDisabled) return; // Don't allow file selection when disabled
    
    const fileInput = document.getElementById('logo') as HTMLInputElement;
    fileInput?.click();
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    if (isFormDisabled) return; // Don't allow drop when form is disabled
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        openCropModal(file);
      } else {
        modalToastStore.error('Only image files are allowed');
      }
    }
  }

  // Handle logo file selection
  function handleLogoSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file && file.type.startsWith('image/')) {
      openCropModal(file);
    } else if (file) {
      modalToastStore.error('Only image files are allowed');
    }
    // Clear input
    input.value = '';
  }

  // Open crop modal
  function openCropModal(file: File) {
    tempImageFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const imageUrl = e.target.result as string;
        
        // Set image source and show modal
        cropImageSrc = imageUrl;
        showCropModal = true;
        
        // Initialize cropper after modal opens and image loads
        setTimeout(() => {
          initializeCropper();
        }, 200);
      }
    };
    reader.readAsDataURL(file);
  }

  // Initialize cropper with dynamic import
  async function initializeCropper() {
    if (!browser || !cropImageElement || cropper) {
      return;
    }
    
    try {
      // Dynamic import for Cropper only
      const CropperModule = await import('cropperjs');
      const Cropper = CropperModule.default;
      
      cropper = new Cropper(cropImageElement, {
        aspectRatio: 1, // 1:1 ratio for circle
        viewMode: 1, // Change to 1 for better interaction
        dragMode: 'move',
        autoCropArea: 0.8,
        restore: false,
        guides: true,
        center: true,
        highlight: true, // Enable highlight for better visibility
        cropBoxMovable: true,
        cropBoxResizable: true,
        toggleDragModeOnDblclick: true, // Allow toggle
        modal: true,
        background: true,
        responsive: true,
        checkCrossOrigin: false,
        zoomable: true, // Enable zoom
        scalable: true, // Enable scale
        rotatable: false, // Disable rotation for simplicity
        zoomOnTouch: true, // Enable zoom on touch devices
        zoomOnWheel: true, // Enable zoom with mouse wheel
        wheelZoomRatio: 0.1, // Zoom ratio for mouse wheel
        minCropBoxWidth: 50, // Minimum crop box size
        minCropBoxHeight: 50,
        ready: function() {
          setTimeout(() => {
            updatePreview();
          }, 200);
        },
        cropstart: function() {
          setTimeout(() => updatePreview(), 50);
        },
        cropmove: function() {
          setTimeout(() => updatePreview(), 50);
        },
        cropend: function() {
          setTimeout(() => updatePreview(), 50);
        },
        zoom: function() {
          setTimeout(() => updatePreview(), 50);
        }
      });
      
    } catch (error) {
      console.error('Failed to load Cropper.js:', error);
      modalToastStore.error('Failed to load image cropper. Please try again.');
    }
  }

  // Update preview with circular mask
  function updatePreview() {
    if (!browser || !cropper) {
      return;
    }
    
    try {
      const canvas = cropper.getCroppedCanvas({
        width: 128,
        height: 128,
        imageSmoothingQuality: 'high'
      });
      
      
      // Get preview canvas element
      const previewCanvas = document.getElementById('preview-canvas') as HTMLCanvasElement;
      
      if (previewCanvas && canvas) {
        const ctx = previewCanvas.getContext('2d');
        if (ctx) {
          // Set canvas size
          previewCanvas.width = 128;
          previewCanvas.height = 128;
          
          // Clear canvas
          ctx.clearRect(0, 0, 128, 128);
          
          // Create circular clipping path
          ctx.save();
          ctx.beginPath();
          ctx.arc(64, 64, 64, 0, 2 * Math.PI);
          ctx.clip();
          
          // Draw the cropped image
          ctx.drawImage(canvas, 0, 0, 128, 128);
          ctx.restore();
          
        } else {
          console.warn('Could not get canvas context');
        }
      } else {
        console.warn('Preview canvas or cropped canvas not found');
      }
    } catch (error) {
      console.error('Error updating preview:', error);
    }
  }

  // Apply crop and close modal
  function applyCrop() {
    if (!browser || !cropper || !tempImageFile) {
      return;
    }
    
    try {
      // Check if cropper has the method
      if (typeof cropper.getCroppedCanvas !== 'function') {
        console.error('❌ Cropper object does not have getCroppedCanvas method:', cropper);
        modalToastStore.error('Cropper not properly initialized');
        return;
      }
      
      const canvas = cropper.getCroppedCanvas({
        width: 200,
        height: 200,
        imageSmoothingQuality: 'high'
      });
      
      
      canvas.toBlob((blob: Blob | null) => {
        if (blob) {
          // Create new file from cropped blob
          const croppedFile = new File([blob], tempImageFile!.name, {
            type: 'image/png',
            lastModified: Date.now()
          });
          
          selectedLogoFile = croppedFile;
          logoPreview = canvas.toDataURL();
          closeCropModal();
        }
      }, 'image/png', 0.9);
    } catch (error) {
      console.error('Failed to crop image:', error);
      modalToastStore.error('Failed to crop image. Please try again.');
    }
  }

  // Close crop modal
  function closeCropModal() {
    showCropModal = false;
    if (cropper && browser) {
      try {
        cropper.destroy();
      } catch (error) {
        console.warn('Error destroying cropper:', error);
      }
      cropper = null;
    }
    cropImageElement = null;
    cropImageSrc = '';
    tempImageFile = null;
  }

  // Remove logo
  function removeLogo() {
    selectedLogoFile = null;
    logoPreview = '';
  }
</script>

<style>
  /* Essential Cropper.js styles */
  :global(.cropper-container) {
    direction: ltr;
    font-size: 0;
    line-height: 0;
    position: relative;
    touch-action: none;
    user-select: none;
  }

  :global(.cropper-container img) {
    backface-visibility: hidden;
    display: block;
    height: 100%;
    image-orientation: 0deg;
    max-height: none !important;
    max-width: none !important;
    min-height: 0 !important;
    min-width: 0 !important;
    width: 100%;
  }

  :global(.cropper-canvas),
  :global(.cropper-drag-box),
  :global(.cropper-crop-box),
  :global(.cropper-wrap-box),
  :global(.cropper-view-box) {
    bottom: 0;
    left: 0;
    position: absolute;
    right: 0;
    top: 0;
  }

  :global(.cropper-wrap-box),
  :global(.cropper-canvas) {
    overflow: hidden;
  }

  :global(.cropper-drag-box) {
    background-color: #fff;
    opacity: 0;
  }

  :global(.cropper-modal) {
    background-color: #000;
    opacity: 0.5;
  }

  :global(.cropper-view-box) {
    display: block;
    overflow: hidden;
  }

  :global(.cropper-crop-box) {
    background-color: transparent;
    border: 2px solid #3b82f6;
    border-radius: 50% !important;
    opacity: 1;
    overflow: hidden;
  }

  :global(.cropper-view-box) {
    border-radius: 50% !important;
    overflow: hidden;
  }

  :global(.cropper-face) {
    border-radius: 50% !important;
  }

  :global(.cropper-dashed) {
    border: 0 dashed #eee;
    display: block;
    opacity: 0.5;
    position: absolute;
  }

  :global(.cropper-dashed.dashed-h) {
    border-bottom-width: 1px;
    border-top-width: 1px;
    height: calc(100% / 3);
    left: 0;
    top: calc(100% / 3);
    width: 100%;
  }

  :global(.cropper-dashed.dashed-v) {
    border-left-width: 1px;
    border-right-width: 1px;
    height: 100%;
    left: calc(100% / 3);
    top: 0;
    width: calc(100% / 3);
  }

  :global(.cropper-center) {
    display: block;
    height: 0;
    left: 50%;
    opacity: 0.75;
    position: absolute;
    top: 50%;
    width: 0;
  }

  :global(.cropper-center):before,
  :global(.cropper-center):after {
    background-color: #eee;
    content: ' ';
    display: block;
    position: absolute;
  }

  :global(.cropper-center):before {
    height: 1px;
    left: -3px;
    top: 0;
    width: 7px;
  }

  :global(.cropper-center):after {
    height: 7px;
    left: 0;
    top: -3px;
    width: 1px;
  }

  :global(.cropper-face),
  :global(.cropper-line),
  :global(.cropper-point) {
    display: block;
    height: 100%;
    opacity: 0.1;
    position: absolute;
    width: 100%;
  }

  :global(.cropper-face) {
    background-color: #fff;
    left: 0;
    top: 0;
  }

  :global(.cropper-line) {
    background-color: #39f;
  }

  :global(.cropper-line.line-e) {
    cursor: ew-resize;
    right: -3px;
    top: 0;
    width: 5px;
  }

  :global(.cropper-line.line-n) {
    cursor: ns-resize;
    height: 5px;
    left: 0;
    top: -3px;
  }

  :global(.cropper-line.line-w) {
    cursor: ew-resize;
    left: -3px;
    top: 0;
    width: 5px;
  }

  :global(.cropper-line.line-s) {
    bottom: -3px;
    cursor: ns-resize;
    height: 5px;
    left: 0;
  }

  :global(.cropper-point) {
    background-color: #3b82f6;
    height: 8px;
    opacity: 0.9;
    width: 8px;
    border-radius: 50%;
  }

  :global(.cropper-point.point-e) {
    cursor: ew-resize;
    margin-top: -4px;
    right: -4px;
    top: 50%;
  }

  :global(.cropper-point.point-n) {
    cursor: ns-resize;
    left: 50%;
    margin-left: -4px;
    top: -4px;
  }

  :global(.cropper-point.point-w) {
    cursor: ew-resize;
    left: -4px;
    margin-top: -4px;
    top: 50%;
  }

  :global(.cropper-point.point-s) {
    bottom: -4px;
    cursor: ns-resize;
    left: 50%;
    margin-left: -4px;
  }

  :global(.cropper-point.point-ne) {
    cursor: nesw-resize;
    right: -4px;
    top: -4px;
  }

  :global(.cropper-point.point-nw) {
    cursor: nw-resize;
    left: -4px;
    top: -4px;
  }

  :global(.cropper-point.point-sw) {
    bottom: -4px;
    cursor: sw-resize;
    left: -4px;
  }

  :global(.cropper-point.point-se) {
    bottom: -4px;
    cursor: se-resize;
    right: -4px;
  }

  :global(.cropper-invisible) {
    opacity: 0;
  }

  :global(.cropper-bg) {
    background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQMAAAAlPW0iAAAAA3NCSVQICAjb4U/gAAAABlBMVEXMzMz////TjRV2AAAACXBIWXMAAArrAAAK6wGCiw1aAAAAHHRFWHRTb2Z0d2FyZQBBZG9iZSBGaXJld29ya3MgQ1M26LyyjAAAAA1JREFUCJlj+M/AgBVhF/0FA/+FsQAAAABJRU5ErkJggg==');
  }

  :global(.cropper-hide) {
    display: block;
    height: 0;
    position: absolute;
    width: 0;
  }

  :global(.cropper-hidden) {
    display: none !important;
  }

  :global(.cropper-move) {
    cursor: move;
  }

  :global(.cropper-crop) {
    cursor: crosshair;
  }

  :global(.cropper-disabled .cropper-drag-box),
  :global(.cropper-disabled .cropper-face),
  :global(.cropper-disabled .cropper-line),
  :global(.cropper-disabled .cropper-point) {
    cursor: not-allowed;
  }

  /* Ensure cropper is interactive */
  :global(.cropper-container) {
    z-index: 10;
  }

  :global(.cropper-face) {
    cursor: move;
  }

  :global(.cropper-line) {
    cursor: move;
  }

  :global(.cropper-point) {
    cursor: pointer;
  }

  :global(.cropper-crop-box) {
    pointer-events: auto;
  }

  :global(.cropper-drag-box) {
    pointer-events: auto;
  }
</style>

<div class="p-6 pt-16 sm:pt-12 relative">
  <!-- Loading Overlay -->
  {#if isSubmitting}
    <Loading overlay={true} text={isEditMode ? 'Updating user...' : 'Creating user...'} />
  {/if}
  
  <div class="max-w-6xl mx-auto">
    <form bind:this={formRef} class="space-y-6" onsubmit={handleSubmit}>
      <!-- Username -->
      <div>
        <label for="username" class="block text-sm font-medium text-gray-700 mb-2">
          Username *
        </label>
        <input
          type="text"
          id="username"
          name="username"
          bind:value={username}
          required
          disabled={isFormDisabled}
          class="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
          placeholder="Enter username"
        />
      </div>

      <!-- Password (only for new users) -->
      {#if !isEditMode}
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
            Password *
          </label>
          <input
            type="password"
            id="password"
            name="password"
            bind:value={password}
            required
            disabled={isFormDisabled}
            class="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
            placeholder="Enter password"
          />
        </div>
      {/if}

      <!-- Contact Person -->
      <div>
        <label for="contact_person" class="block text-sm font-medium text-gray-700 mb-2">
          Contact Person
        </label>
        <input
          type="text"
          id="contact_person"
          name="contact_person"
          disabled={isFormDisabled}
          class="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
          placeholder="Enter contact person"
        />
      </div>

      <!-- Name Mentri (hidden but auto-filled from category) -->
      <div style="display: none;">
        <input
          type="text"
          id="name_mentri"
          name="name_mentri"
          value={getNameMentriFromCategory()}
          readonly
        />
      </div>

      <!-- Role -->
      <div class="relative">
        <label for="role-dropdown" class="block text-sm font-medium text-gray-700 mb-3">
          Role <span class="text-red-500">*</span>
        </label>
        
        <!-- Hidden input for form submission -->
        <input type="hidden" name="role" value={selectedRole} required />
        
        <!-- Custom dropdown trigger -->
        <div class="relative">
          <button
            id="role-dropdown"
            type="button"
            onclick={toggleRoleDropdown}
            disabled={isFormDisabled}
            class="w-full px-3 py-3 text-left text-sm border-2 border-gray-200 rounded-lg bg-gradient-to-br from-white to-gray-50 shadow-sm hover:shadow-md hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed cursor-pointer"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                {#if selectedRole === '1'}
                  <div class="w-2 h-2 bg-red-500 rounded-full"></div>
                  <div>
                    <div class="font-medium text-gray-900 text-sm">Admin</div>
                  </div>
                {:else}
                  <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <div class="font-medium text-gray-900 text-sm">User</div>
                  </div>
                {/if}
              </div>
              <svg class="w-4 h-4 text-gray-400 transition-transform duration-200 {isRoleDropdownOpen ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
          
          <!-- Dropdown menu -->
          {#if isRoleDropdownOpen}
            <div class="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg overflow-hidden">
              {#each roles as role}
                <button
                  type="button"
                  onclick={() => handleRoleSelect(role.id.toString())}
                  class="w-full px-3 py-2.5 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors duration-150 border-b border-gray-100 last:border-b-0 {selectedRole === role.id.toString() ? 'bg-blue-50 border-blue-200' : ''}"
                >
                  <div class="flex items-center space-x-2">
                    <div class="w-2 h-2 {role.id === 1 ? 'bg-red-500' : 'bg-blue-500'} rounded-full"></div>
                    <div class="flex-1">
                      <div class="font-medium text-gray-900 text-sm">{role.name}</div>
                      <div class="text-xs text-gray-500 mt-0.5">
                        {role.id === 1 ? 'Full access' : 'Category access'}
                      </div>
                    </div>
                    {#if selectedRole === role.id.toString()}
                      <svg class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                      </svg>
                    {/if}
                  </div>
                </button>
              {/each}
            </div>
          {/if}
        </div>
      </div>

      <!-- Category (only show for User role) -->
      {#if selectedRole === '2'}
      <div class="relative">
        <label for="category-dropdown" class="block text-sm font-medium text-gray-700 mb-3">
          Category
          <span class="text-xs font-normal text-gray-500 ml-1">(Optional)</span>
        </label>
        
        <!-- Hidden input for form submission -->
        <input type="hidden" name="category" value={selectedCategory} />
        
        {#if categoriesLoading}
          <div class="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 shadow-sm">
            <svg class="w-5 h-5 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span class="text-sm text-gray-600 font-medium">Loading categories...</span>
          </div>
        {:else}
          <div class="relative">
            <!-- Custom dropdown trigger -->
            <button
              id="category-dropdown"
              type="button"
              onclick={toggleCategoryDropdown}
              disabled={isFormDisabled}
              class="w-full px-3 py-3 text-left text-sm border-2 border-gray-200 rounded-lg bg-gradient-to-br from-white to-gray-50 shadow-sm hover:shadow-md hover:border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed cursor-pointer"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  {#if selectedCategory}
                    {@const selectedCat = categories.find(c => c.id.toString() === selectedCategory)}
                    <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <div class="font-medium text-gray-900 text-sm">{selectedCat?.name}</div>
                    </div>
                  {:else}
                    <div class="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <div>
                      <div class="font-medium text-gray-500 text-sm">Choose category...</div>
                    </div>
                  {/if}
                </div>
                <svg class="w-4 h-4 text-gray-400 transition-transform duration-200 {isCategoryDropdownOpen ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            
            <!-- Dropdown menu -->
            {#if isCategoryDropdownOpen}
              <div class="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                <!-- None option -->
                <button
                  type="button"
                  onclick={() => handleCategorySelect('')}
                  class="w-full px-3 py-2.5 text-left hover:bg-green-50 focus:bg-green-50 focus:outline-none transition-colors duration-150 border-b border-gray-100 {selectedCategory === '' ? 'bg-green-50 border-green-200' : ''}"
                >
                  <div class="flex items-center space-x-2">
                    <div class="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <div class="flex-1">
                      <div class="font-medium text-gray-900 text-sm">No Category</div>
                      <div class="text-xs text-gray-500 mt-0.5">General access</div>
                    </div>
                    {#if selectedCategory === ''}
                      <svg class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                      </svg>
                    {/if}
                  </div>
                </button>
                
                <!-- Category options -->
                {#each categories as category}
                  <button
                    type="button"
                    onclick={() => handleCategorySelect(category.id.toString())}
                    class="w-full px-3 py-2.5 text-left hover:bg-green-50 focus:bg-green-50 focus:outline-none transition-colors duration-150 border-b border-gray-100 last:border-b-0 {selectedCategory === category.id.toString() ? 'bg-green-50 border-green-200' : ''}"
                  >
                    <div class="flex items-center space-x-2">
                      <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div class="flex-1">
                        <div class="font-medium text-gray-900 text-sm">{category.name}</div>
                        <div class="text-xs text-gray-500 mt-0.5">
                          {category.description || 'Department access'}
                        </div>
                      </div>
                      {#if selectedCategory === category.id.toString()}
                        <svg class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                        </svg>
                      {/if}
                    </div>
                  </button>
                {/each}
              </div>
            {/if}
          </div>
        {/if}
      </div>
      {/if}

      <!-- Profile Photo Upload -->
      <div>
        <label for="logo" class="block text-sm font-medium text-gray-700 mb-3">
          Profile Photo {isEditMode ? '(Optional - leave empty to keep current photo)' : '(Optional)'}
        </label>
        
        {#if logoPreview}
          <!-- Show cropped preview -->
          <div class="flex flex-col items-center">
            <div class="relative mb-4">
              <img
                src={logoPreview}
                alt="Profile preview"
                class="w-24 h-24 object-cover rounded-full border-4 border-gray-200 shadow-md"
              />
              <button
                type="button"
                onclick={!isFormDisabled ? removeLogo : undefined}
                disabled={isFormDisabled}
                class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                title={isFormDisabled ? "Form is disabled" : "Remove photo"}
                aria-label="Remove profile photo"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p class="text-sm text-green-600 font-medium mb-1">
              {#if selectedLogoFile}
                ✓ New photo ready to upload
              {:else}
                ✓ Current profile photo
              {/if}
            </p>
            <button
              type="button"
              onclick={handleFileAreaClick}
              disabled={isFormDisabled}
              class="text-xs text-blue-600 hover:text-blue-800 underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Change photo
            </button>
          </div>
        {:else}
          <!-- Upload area -->
          <div 
            role="button"
            tabindex="0"
            class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors {isFormDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}"
            onclick={!isFormDisabled ? handleFileAreaClick : undefined}
            ondragover={!isFormDisabled ? handleDragOver : undefined}
            ondrop={!isFormDisabled ? handleDrop : undefined}
            onkeydown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && !isFormDisabled) {
                e.preventDefault();
                handleFileAreaClick();
              }
            }}
          >
            <div class="flex flex-col items-center">
              <svg class="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p class="text-lg font-medium text-gray-600 mb-2">Upload Profile Photo</p>
              <p class="text-sm text-gray-500 mb-2">
                <span class="font-medium text-blue-600 hover:text-blue-500">Click to browse</span>
                or drag and drop your photo here
              </p>
              <p class="text-xs text-gray-400">PNG, JPG files up to 5MB • Will be cropped to perfect circle</p>
            </div>
          </div>
        {/if}
        
        <input 
          type="file" 
          id="logo" 
          name="logo" 
          class="hidden" 
          accept="image/*"
          disabled={isFormDisabled}
          onchange={handleLogoSelect}
        />
      </div>

      <!-- Form Actions -->
      <div class="flex items-center justify-end space-x-4 pt-4">
        <button
          type="button"
          onclick={handleReset}
          disabled={isSubmitting}
          class="px-6 py-3 text-base font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed {isFormDisabled && !isSubmitting ? 'ring-2 ring-green-500 ring-opacity-50' : ''}"
          title={isFormDisabled && !isSubmitting ? "Click to reset and re-enable form" : ""}
        >
          Reset
        </button>
        
        <!-- Reset Password Button (Edit Mode Only) -->
        {#if isEditMode && userData}
          <button
            type="button"
            onclick={openPasswordResetModal}
            disabled={isSubmitting}
            class="px-6 py-3 text-base font-medium text-white bg-orange-600 hover:bg-orange-700 border border-transparent rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            title="Reset user password"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 12H9v4a1 1 0 01-1 1H4a1 1 0 01-1-1v-4c0-2.519 1.981-4.5 4.5-4.5s4.5 1.981 4.5 4.5z" />
            </svg>
            <span>Reset Password</span>
          </button>
        {/if}
        
        <button
          type="submit"
          disabled={isSubmitting || isFormDisabled || !isFormValid}
          class="px-6 py-3 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 border border-transparent rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {#if isSubmitting}
            <Loading size="sm" />
            <span>{isEditMode ? 'Updating...' : 'Creating...'}</span>
          {:else}
            <span>{isEditMode ? 'Update User' : 'Create User'}</span>
          {/if}
        </button>
      </div>
    </form>
  </div>
</div>

<!-- Image Crop Modal -->
{#if showCropModal}
  <div class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
      <!-- Modal Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h3 class="text-lg font-semibold text-gray-900">Crop Profile Photo</h3>
          <p class="text-sm text-gray-500 mt-1">Adjust the crop area to get the perfect profile photo</p>
        </div>
        <button
          onclick={closeCropModal}
          class="text-gray-400 hover:text-gray-600 p-1"
          aria-label="Close crop modal"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <!-- Modal Content -->
      <div class="flex-1 p-6 overflow-hidden">
        <div class="flex gap-6 h-full">
          <!-- Crop Area -->
          <div class="flex-1 bg-gray-50 rounded-lg" style="min-height: 400px; position: relative;">
            {#if cropImageSrc}
              <img 
                bind:this={cropImageElement}
                src={cropImageSrc}
                alt="Crop preview" 
                class="block"
                style="max-width: 100%; max-height: 400px;"
                onload={() => {
                  if (!cropper && cropImageElement) {
                    setTimeout(() => {
                      initializeCropper();
                    }, 100);
                  }
                }}
              />
            {/if}
            
            <!-- Zoom Controls (optional if wheel zoom doesn't work) -->
            {#if cropper}
              <div class="absolute bottom-4 right-4 flex space-x-2 bg-black bg-opacity-50 rounded p-2">
                <button 
                  type="button"
                  onclick={() => cropper && cropper.zoom(0.1)}
                  class="w-8 h-8 bg-white text-black rounded hover:bg-gray-200"
                  title="Zoom In"
                >
                  +
                </button>
                <button 
                  type="button"
                  onclick={() => cropper && cropper.zoom(-0.1)}
                  class="w-8 h-8 bg-white text-black rounded hover:bg-gray-200"
                  title="Zoom Out"
                >
                  -
                </button>
              </div>
            {/if}
          </div>
          
          <!-- Preview Panel -->
          <div class="w-64 flex flex-col items-center">
            <h4 class="text-sm font-medium text-gray-900 mb-4">Preview</h4>
            
            <!-- Circle Preview -->
            <div class="w-32 h-32 rounded-full border-4 border-gray-200 shadow-md bg-gray-100 mb-4 overflow-hidden relative">
              {#if cropper}
                <canvas id="preview-canvas" class="w-full h-full object-cover"></canvas>
              {:else}
                <div class="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                  Loading preview...
                </div>
              {/if}
            </div>
            
            <p class="text-xs text-gray-500 text-center mb-4">
              This is how your profile photo will appear
            </p>
          </div>
        </div>
      </div>
      
      <!-- Modal Footer -->
      <div class="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
        <button
          onclick={closeCropModal}
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md transition-colors"
        >
          Cancel
        </button>
        <button
          onclick={applyCrop}
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 border border-transparent rounded-md transition-colors"
        >
          Apply Crop
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Password Reset Confirmation Modal -->
<ConfirmationModal 
  isOpen={showConfirmResetModal}
  title="Confirm Password Reset"
  message="Are you sure you want to reset the password for user '{userData?.username}'? This action cannot be undone."
  confirmText="Yes, Reset Password"
  cancelText="Cancel"
  confirmButtonClass="bg-orange-600 hover:bg-orange-700 text-white"
  isLoading={isResettingPassword}
  onConfirm={handlePasswordReset}
  onCancel={cancelPasswordReset}
/>

<!-- Password Reset Modal -->
{#if showPasswordModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
    <div class="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 border border-gray-200">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-red-50">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 12H9v4a1 1 0 01-1 1H4a1 1 0 01-1-1v-4c0-2.519 1.981-4.5 4.5-4.5s4.5 1.981 4.5 4.5z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900">Reset Password</h3>
          </div>
          {#if !isResettingPassword}
            <button
              onclick={closePasswordModal}
              class="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              aria-label="Close modal"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          {/if}
        </div>
      </div>

      <!-- Content -->
      <div class="px-6 py-6">
        <p class="text-gray-600 text-sm mb-6">
          Reset password for user: <span class="font-medium text-gray-900">{userData?.username}</span>
        </p>
        
        <div class="space-y-4">
          <!-- New Password -->
          <div>
            <label for="newPassword" class="block text-sm font-medium text-gray-700 mb-2">
              New Password *
            </label>
            <input
              type="password"
              id="newPassword"
              bind:value={newPassword}
              disabled={isResettingPassword}
              class="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
              placeholder="Enter new password"
              minlength="6"
            />
          </div>
          
          <!-- Confirm Password -->
          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password *
            </label>
            <input
              type="password"
              id="confirmPassword"
              bind:value={confirmPassword}
              disabled={isResettingPassword}
              class="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
              placeholder="Confirm new password"
              minlength="6"
            />
          </div>
          
          <p class="text-xs text-gray-500">
            Password must be at least 6 characters long.
          </p>
        </div>
      </div>

      <!-- Actions -->
      <div class="px-6 py-4 bg-gray-50 flex flex-col sm:flex-row gap-3 sm:gap-0 sm:justify-end sm:space-x-3">
        <button
          onclick={closePasswordModal}
          disabled={isResettingPassword}
          class="w-full sm:w-auto px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed order-2 sm:order-1"
        >
          Cancel
        </button>
        <button
          onclick={requestPasswordReset}
          disabled={isResettingPassword || !newPassword.trim() || !confirmPassword.trim()}
          class="w-full sm:w-auto px-4 py-2 text-sm font-medium bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2 flex items-center justify-center space-x-2"
        >
          {#if isResettingPassword}
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Resetting...</span>
          {:else}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 12H9v4a1 1 0 01-1 1H4a1 1 0 01-1-1v-4c0-2.519 1.981-4.5 4.5-4.5s4.5 1.981 4.5 4.5z" />
            </svg>
            <span>Reset Password</span>
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Password Reset Confirmation Modal -->
<ConfirmationModal 
  isOpen={showConfirmResetModal}
  title="Confirm Password Reset"
  message="Are you sure you want to reset the password for user '{userData?.username}'? This action cannot be undone."
  confirmText="Yes, Reset Password"
  cancelText="Cancel"
  confirmButtonClass="bg-orange-600 hover:bg-orange-700 text-white"
  isLoading={isResettingPassword}
  onConfirm={handlePasswordReset}
  onCancel={cancelPasswordReset}
/>