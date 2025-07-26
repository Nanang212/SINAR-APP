/**
 * Navigation utilities for client-side routing
 */

export class NavigationHelper {
  /**
   * Navigate to a specific route
   */
  static navigateTo(path: string): void {
    if (typeof window !== 'undefined') {
      window.location.href = path;
    }
  }

  /**
   * Navigate to home page
   */
  static goHome(): void {
    this.navigateTo('/home');
  }

  /**
   * Navigate to login page
   */
  static goLogin(): void {
    this.navigateTo('/login');
  }

  /**
   * Navigate back in browser history
   */
  static goBack(): void {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      this.goHome();
    }
  }

  /**
   * Replace current URL without adding to history
   */
  static replaceTo(path: string): void {
    if (typeof window !== 'undefined') {
      window.location.replace(path);
    }
  }

  /**
   * Reload current page
   */
  static reload(): void {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }

  /**
   * Get current pathname
   */
  static getCurrentPath(): string {
    if (typeof window !== 'undefined') {
      return window.location.pathname;
    }
    return '';
  }

  /**
   * Check if current path matches given path
   */
  static isCurrentPath(path: string): boolean {
    return this.getCurrentPath() === path;
  }
}

export default NavigationHelper;