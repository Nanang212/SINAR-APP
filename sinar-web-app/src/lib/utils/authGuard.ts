import { authService } from '@/lib/services';
import { NavigationHelper } from './navigation';

export interface RouteGuardOptions {
  requireAuth?: boolean;      // Route requires authentication
  redirectIfAuth?: boolean;   // Redirect if already authenticated (like login page)
  redirectTo?: string;        // Custom redirect path
}

export class AuthGuard {
  /**
   * Check authentication and handle redirects
   */
  static checkAccess(options: RouteGuardOptions = {}): boolean {
    const {
      requireAuth = false,
      redirectIfAuth = false,
      redirectTo
    } = options;

    const isAuthenticated = authService.isAuthenticated();
    const currentPath = NavigationHelper.getCurrentPath();

    // If route requires authentication and user is not authenticated
    if (requireAuth && !isAuthenticated) {
      const loginPath = redirectTo || '/login';
      if (currentPath !== loginPath) {
        NavigationHelper.navigateTo(loginPath);
        return false;
      }
    }

    // If user is authenticated but accessing auth-only pages (like login)
    if (redirectIfAuth && isAuthenticated) {
      const homePath = redirectTo || '/home';
      if (currentPath !== homePath) {
        NavigationHelper.navigateTo(homePath);
        return false;
      }
    }

    return true;
  }

  /**
   * Guard for login page - redirect based on user role if already authenticated
   */
  static guardLoginPage(): boolean {
    if (authService.isAuthenticated()) {
      const userRole = authService.getCurrentUserRole();
      const redirectPath = userRole === 'admin' ? '/home' : '/user/documents';
      
      return this.checkAccess({
        redirectIfAuth: true,
        redirectTo: redirectPath
      });
    }
    
    return true;
  }

  /**
   * Guard for protected pages - redirect to login if not authenticated
   */
  static guardProtectedPage(): boolean {
    return this.checkAccess({
      requireAuth: true,
      redirectTo: '/login'
    });
  }

  /**
   * Guard for home page - redirect to login if not authenticated
   */
  static guardHomePage(): boolean {
    return this.checkAccess({
      requireAuth: true,
      redirectTo: '/login'
    });
  }

  /**
   * Check if current user has specific role
   */
  static hasRole(requiredRole: string): boolean {
    const user = authService.getCurrentUser();
    return user?.role === requiredRole;
  }

  /**
   * Guard for admin-only pages
   */
  static guardAdminPage(): boolean {
    const isAuthenticated = this.guardProtectedPage();
    if (!isAuthenticated) return false;

    const hasAdminRole = this.hasRole('admin');
    if (!hasAdminRole) {
      NavigationHelper.navigateTo('/home'); // Redirect to home if not admin
      return false;
    }

    return true;
  }

  /**
   * Initialize auth guard for a component/page
   */
  static initializeGuard(options: RouteGuardOptions): void {
    // Only run in browser
    if (typeof window === 'undefined') return;

    // Run guard check
    this.checkAccess(options);
  }
}

export default AuthGuard;