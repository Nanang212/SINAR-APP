import { writable } from 'svelte/store';

export interface ModalToast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

function createModalToastStore() {
  const { subscribe, update } = writable<ModalToast[]>([]);

  return {
    subscribe,
    
    add: (toast: Omit<ModalToast, 'id'>) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newToast: ModalToast = {
        id,
        duration: 0, // No auto-close by default for modal toasts
        ...toast
      };
      
      update(toasts => [...toasts, newToast]);
      
      if (newToast.duration && newToast.duration > 0) {
        setTimeout(() => {
          modalToastStore.remove(id);
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
      return modalToastStore.add({ message, type: 'success', duration });
    },
    
    error: (message: string, duration?: number) => {
      return modalToastStore.add({ message, type: 'error', duration });
    },
    
    warning: (message: string, duration?: number) => {
      return modalToastStore.add({ message, type: 'warning', duration });
    },
    
    info: (message: string, duration?: number) => {
      return modalToastStore.add({ message, type: 'info', duration });
    }
  };
}

export const modalToastStore = createModalToastStore();