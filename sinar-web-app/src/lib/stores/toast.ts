import { writable } from 'svelte/store';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

function createToastStore() {
  const { subscribe, update } = writable<Toast[]>([]);

  return {
    subscribe,
    
    add: (toast: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newToast: Toast = {
        id,
        duration: 4000,
        ...toast
      };
      
      update(toasts => [...toasts, newToast]);
      
      if (newToast.duration && newToast.duration > 0) {
        setTimeout(() => {
          toastStore.remove(id);
        }, newToast.duration);
      }
      
      return id;
    },
    
    remove: (id: string) => {
      update(toasts => toasts.filter(toast => toast.id !== id));
    },
    
    clear: () => {
      update(() => []);
    },
    
    success: (message: string, duration?: number) => {
      return toastStore.add({ message, type: 'success', duration });
    },
    
    error: (message: string, duration?: number) => {
      return toastStore.add({ message, type: 'error', duration });
    },
    
    warning: (message: string, duration?: number) => {
      return toastStore.add({ message, type: 'warning', duration });
    },
    
    info: (message: string, duration?: number) => {
      return toastStore.add({ message, type: 'info', duration });
    }
  };
}

export const toastStore = createToastStore();