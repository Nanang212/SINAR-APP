import { authService } from '@/lib/services';
import { NavigationHelper } from './navigation';

export interface RouteGuardOptions {
  requireAuth?: boolean;      // Route requires authentication
  redirectIfAuth?: boolean;   // Redirect if already authenticated (like login page)
  redirectTo?: string;        // Custom redirect path
  onLoading?: (loading: boolean) => void; // Callback for loading state
}

export class LoadingAuthGuard {
  /**
   * Check authentication and handle redirects with loading states
   */
  static async checkAccess(options: RouteGuardOptions = {}): Promise<boolean> {
    const {
      requireAuth = false,
      redirectIfAuth = false,
      redirectTo,
      onLoading
    } = options;

    const isAuthenticated = authService.isAuthenticated();
    const currentPath = NavigationHelper.getCurrentPath();

    // If route requires authentication and user is not authenticated
    if (requireAuth && !isAuthenticated) {
      const loginPath = redirectTo || '/login';
      if (currentPath !== loginPath) {
        if (onLoading) onLoading(true);
        
        // Minimum delay for smooth transition
        await new Promise(resolve => setTimeout(resolve, 800));
        
        NavigationHelper.navigateTo(loginPath);
        return false;
      }
    }

    // If user is authenticated but accessing auth-only pages (like login)
    if (redirectIfAuth && isAuthenticated) {
      const homePath = redirectTo || '/home';
      if (currentPath !== homePath) {
        if (onLoading) onLoading(true);
        
        // Minimum delay for smooth transition
        await new Promise(resolve => setTimeout(resolve, 800));
        
        NavigationHelper.navigateTo(homePath);
        return false;
      }
    }

    return true;
  }

  /**
   * Guard for login page with loading - redirect to home if already authenticated
   */
  static async guardLoginPage(onLoading?: (loading: boolean) => void): Promise<boolean> {
    return this.checkAccess({
      redirectIfAuth: true,
      redirectTo: '/home',
      onLoading
    });
  }

  /**
   * Guard for protected pages with loading - redirect to login if not authenticated
   */
  static async guardProtectedPage(onLoading?: (loading: boolean) => void): Promise<boolean> {
    return this.checkAccess({
      requireAuth: true,
      redirectTo: '/login',
      onLoading
    });
  }

  /**
   * Guard for home page with loading - redirect to login if not authenticated
   */
  static async guardHomePage(onLoading?: (loading: boolean) => void): Promise<boolean> {
    return this.checkAccess({
      requireAuth: true,
      redirectTo: '/login',
      onLoading
    });
  }
}

export default LoadingAuthGuard;