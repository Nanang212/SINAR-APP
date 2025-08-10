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
   * Guard for login page with loading - redirect based on user role if already authenticated
   */
  static async guardLoginPage(onLoading?: (loading: boolean) => void): Promise<boolean> {
    if (authService.isAuthenticated()) {
      const userRole = authService.getCurrentUserRole();
      const redirectPath = userRole === 'admin' ? '/home' : '/user/documents';
      
      return this.checkAccess({
        redirectIfAuth: true,
        redirectTo: redirectPath,
        onLoading
      });
    }
    
    return true;
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

  /**
   * Guard for admin-only pages with loading
   */
  static async guardAdminPage(onLoading?: (loading: boolean) => void): Promise<boolean> {
    const isAuthenticated = await this.guardProtectedPage(onLoading);
    if (!isAuthenticated) return false;

    const user = authService.getCurrentUser();
    const hasAdminRole = user?.role === 'admin';
    if (!hasAdminRole) {
      if (onLoading) onLoading(true);
      
      // Minimum delay for smooth transition
      await new Promise(resolve => setTimeout(resolve, 800));
      
      NavigationHelper.navigateTo('/user/documents'); // Redirect user to their documents
      return false;
    }

    return true;
  }

  /**
   * Guard for dashboard/home page - admin only, user redirected to documents
   */
  static async guardDashboardPage(onLoading?: (loading: boolean) => void): Promise<boolean> {
    const isAuthenticated = await this.guardProtectedPage(onLoading);
    if (!isAuthenticated) return false;

    const user = authService.getCurrentUser();
    const hasAdminRole = user?.role === 'admin';
    if (!hasAdminRole) {
      if (onLoading) onLoading(true);
      
      // Minimum delay for smooth transition
      await new Promise(resolve => setTimeout(resolve, 800));
      
      NavigationHelper.navigateTo('/user/documents'); // Redirect user to their documents
      return false;
    }

    return true;
  }
}

export default LoadingAuthGuard;