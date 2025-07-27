// Export your components and utilities here
export { default as Button } from "@/lib/components/ui/button.svelte";
export { default as Input } from "@/lib/components/ui/input.svelte";
export { default as Card } from "@/lib/components/ui/card.svelte";
export { default as Label } from "@/lib/components/ui/label.svelte";
export { default as Loading } from "@/lib/components/ui/loading.svelte";
export { default as Toast } from "@/lib/components/ui/toast.svelte";
export { default as ToastContainer } from "@/lib/components/ui/toast-container.svelte";

// Layout components
export { default as MainLayout } from "@/lib/components/layout/MainLayout.svelte";
export { default as AuthLayout } from "@/lib/components/layout/AuthLayout.svelte";
export { default as Header } from "@/lib/components/layout/Header.svelte";
export { default as Footer } from "@/lib/components/layout/Footer.svelte";

// Auth components
export { default as LoginForm } from "@/lib/components/auth/LoginForm.svelte";

// Dashboard components
export { default as DashboardLayout } from "@/lib/components/dashboard/DashboardLayout.svelte";
export { default as DashboardHeader } from "@/lib/components/dashboard/DashboardHeader.svelte";
export { default as DashboardSidebar } from "@/lib/components/dashboard/DashboardSidebar.svelte";
export { default as DashboardStats } from "@/lib/components/dashboard/DashboardStats.svelte";
export { default as RecentActivity } from "@/lib/components/dashboard/RecentActivity.svelte";
export { default as QuickActions } from "@/lib/components/dashboard/QuickActions.svelte";

// Stores
export { toastStore } from "@/lib/stores/toast";

// Example utility function
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat("id-ID").format(num);
};
