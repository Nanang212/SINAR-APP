import { authService } from '$lib/services';

export interface LoginState {
  isLoading: boolean;
  errorMessage: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export class LoginHandler {
  private state: LoginState = {
    isLoading: false,
    errorMessage: ''
  };

  private listeners: Array<(state: LoginState) => void> = [];

  // Subscribe to state changes
  subscribe(listener: (state: LoginState) => void) {
    this.listeners.push(listener);
    listener(this.state); // Initial state
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Update state and notify listeners
  private updateState(newState: Partial<LoginState>) {
    this.state = { ...this.state, ...newState };
    this.listeners.forEach(listener => listener(this.state));
  }

  // Validate login credentials
  private validateCredentials(credentials: LoginCredentials): string | null {
    if (!credentials.username.trim()) {
      return "Username is required";
    }
    
    if (!credentials.password.trim()) {
      return "Password is required";
    }

    if (credentials.username.trim().length < 3) {
      return "Username must be at least 3 characters";
    }

    if (credentials.password.trim().length < 6) {
      return "Password must be at least 6 characters";
    }

    return null;
  }

  // Handle login process
  async handleLogin(credentials: LoginCredentials): Promise<boolean> {
    // Clear previous error
    this.updateState({ errorMessage: '' });

    // Validate credentials
    const validationError = this.validateCredentials(credentials);
    if (validationError) {
      this.updateState({ errorMessage: validationError });
      return false;
    }

    // Set loading state
    this.updateState({ isLoading: true });

    try {
      // Call backend login service
      const response = await authService.login({
        username: credentials.username.trim(),
        password: credentials.password.trim()
      });

      if (response.status) {
        // Success - login handler doesn't handle redirect
        // Let the component handle it
        this.updateState({ isLoading: false });
        return true;
      } else {
        // Error from backend
        const errorMsg = response.error || response.message || "Login failed. Please try again.";
        this.updateState({ 
          isLoading: false,
          errorMessage: errorMsg 
        });
        return false;
      }
    } catch (error) {
      // Network or other errors
      console.error("Login error:", error);
      this.updateState({ 
        isLoading: false,
        errorMessage: "Network error. Please check your connection and try again." 
      });
      return false;
    }
  }

  // Clear error message
  clearError() {
    this.updateState({ errorMessage: '' });
  }

  // Get current state
  getState(): LoginState {
    return { ...this.state };
  }

  // Reset handler state
  reset() {
    this.updateState({
      isLoading: false,
      errorMessage: ''
    });
  }
}

// Export singleton instance
export const loginHandler = new LoginHandler();
export default loginHandler;