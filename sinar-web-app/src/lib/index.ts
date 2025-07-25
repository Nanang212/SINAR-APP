// Export your components and utilities here
export { default as Button } from "@/lib/components/ui/button.svelte";
export { default as Input } from "@/lib/components/ui/input.svelte";
export { default as Card } from "@/lib/components/ui/card.svelte";
export { default as Label } from "@/lib/components/ui/label.svelte";

// Layout components
export { default as MainLayout } from "@/lib/components/layout/MainLayout.svelte";
export { default as AuthLayout } from "@/lib/components/layout/AuthLayout.svelte";
export { default as Header } from "@/lib/components/layout/Header.svelte";
export { default as Footer } from "@/lib/components/layout/Footer.svelte";

// Auth components
export { default as LoginForm } from "@/lib/components/auth/LoginForm.svelte";

// Example utility function
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat("id-ID").format(num);
};
