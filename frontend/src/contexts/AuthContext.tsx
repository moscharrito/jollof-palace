import { createContext, useContext, useState, ReactNode, useEffect } from 'react';


// Types
interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: 'ADMIN' | 'MANAGER' | 'STAFF';
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  refreshToken: () => Promise<void>;
}

// Initial state
const initialState: AuthState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
};

// Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [state, setState] = useState<AuthState>(initialState);
  
  // Auto-logout timer
  let logoutTimer: NodeJS.Timeout | null = null;

  // Check for existing session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const savedUser = localStorage.getItem('jollof-palace-admin-user');
        const token = localStorage.getItem('jollof-palace-admin-token');
        const tokenExpiry = localStorage.getItem('jollof-palace-admin-token-expiry');
        
        if (savedUser && token && tokenExpiry) {
          const expiryTime = parseInt(tokenExpiry);
          const currentTime = Date.now();
          
          // Check if token is still valid
          if (currentTime < expiryTime) {
            const parsedUser = JSON.parse(savedUser);
            
            // Set up auto-logout timer
            setupAutoLogout(expiryTime - currentTime);
            
            setState({
              user: parsedUser,
              isLoading: false,
              isAuthenticated: true,
            });
          } else {
            // Token expired, clear storage
            clearAuthData();
            setState(prev => ({ ...prev, isLoading: false }));
          }
        } else {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Error loading user from localStorage:', error);
        clearAuthData();
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initializeAuth();

    // Cleanup timer on unmount
    return () => {
      if (logoutTimer) {
        clearTimeout(logoutTimer);
      }
    };
  }, []);

  // Setup automatic logout timer
  const setupAutoLogout = (timeUntilExpiry: number) => {
    if (logoutTimer) {
      clearTimeout(logoutTimer);
    }
    
    // Set timer to logout 1 minute before token expires
    const logoutTime = Math.max(timeUntilExpiry - 60000, 0);
    
    logoutTimer = setTimeout(() => {
      logout();
    }, logoutTime);
  };

  // Clear authentication data
  const clearAuthData = () => {
    localStorage.removeItem('jollof-palace-admin-user');
    localStorage.removeItem('jollof-palace-admin-token');
    localStorage.removeItem('jollof-palace-admin-token-expiry');
  };
  
  // Login function
  const login = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      // For now, use mock authentication until backend is fully implemented
      if (email === 'admin@jollofpalace.com' && password === 'admin123') {
        const mockUser: User = {
          id: '1',
          name: 'Admin User',
          email: email,
          phone: '+1234567890',
          role: 'ADMIN'
        };
        
        const mockToken = 'mock-admin-token-' + Date.now();
        const expiryTime = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
        
        // Save to localStorage
        localStorage.setItem('jollof-palace-admin-user', JSON.stringify(mockUser));
        localStorage.setItem('jollof-palace-admin-token', mockToken);
        localStorage.setItem('jollof-palace-admin-token-expiry', expiryTime.toString());
        
        // Setup auto-logout
        setupAutoLogout(expiryTime - Date.now());
        
        setState({
          user: mockUser,
          isLoading: false,
          isAuthenticated: true,
        });
      } else if (email === 'manager@jollofpalace.com' && password === 'manager123') {
        const mockUser: User = {
          id: '2',
          name: 'Manager User',
          email: email,
          phone: '+1234567891',
          role: 'MANAGER'
        };
        
        const mockToken = 'mock-manager-token-' + Date.now();
        const expiryTime = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
        
        localStorage.setItem('jollof-palace-admin-user', JSON.stringify(mockUser));
        localStorage.setItem('jollof-palace-admin-token', mockToken);
        localStorage.setItem('jollof-palace-admin-token-expiry', expiryTime.toString());
        
        setupAutoLogout(expiryTime - Date.now());
        
        setState({
          user: mockUser,
          isLoading: false,
          isAuthenticated: true,
        });
      } else if (email === 'staff@jollofpalace.com' && password === 'staff123') {
        const mockUser: User = {
          id: '3',
          name: 'Staff User',
          email: email,
          phone: '+1234567892',
          role: 'STAFF'
        };
        
        const mockToken = 'mock-staff-token-' + Date.now();
        const expiryTime = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
        
        localStorage.setItem('jollof-palace-admin-user', JSON.stringify(mockUser));
        localStorage.setItem('jollof-palace-admin-token', mockToken);
        localStorage.setItem('jollof-palace-admin-token-expiry', expiryTime.toString());
        
        setupAutoLogout(expiryTime - Date.now());
        
        setState({
          user: mockUser,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        throw new Error('Invalid credentials');
      }
      
      // TODO: Replace with actual API call when backend is ready
      // const response = await api.post('/admin/login', { email, password });
      // const { user, token, expiresIn } = response.data;
      
    } catch (error: any) {
      setState(prev => ({ ...prev, isLoading: false }));
      
      // Handle different error types
      if (error.message === 'Invalid credentials') {
        throw new Error('Invalid email or password');
      }
      
      throw new Error('Login failed. Please try again.');
    }
  };
  
  // Logout function
  const logout = () => {
    if (logoutTimer) {
      clearTimeout(logoutTimer);
      logoutTimer = null;
    }
    
    clearAuthData();
    
    setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    });
  };
  
  // Update user function
  const updateUser = (updatedUser: Partial<User>) => {
    if (state.user) {
      const newUser = { ...state.user, ...updatedUser };
      
      localStorage.setItem('jollof-palace-admin-user', JSON.stringify(newUser));
      
      setState(prev => ({
        ...prev,
        user: newUser,
      }));
    }
  };

  // Refresh token function
  const refreshToken = async () => {
    try {
      const token = localStorage.getItem('jollof-palace-admin-token');
      
      if (!token) {
        throw new Error('No token available');
      }

      // TODO: Implement actual token refresh with backend
      // const response = await api.post('/admin/refresh-token', { token });
      // const { newToken, expiresIn } = response.data;
      
      // For now, just extend the current mock token
      const expiryTime = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
      localStorage.setItem('jollof-palace-admin-token-expiry', expiryTime.toString());
      
      setupAutoLogout(expiryTime - Date.now());
      
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
    }
  };
  
  const value: AuthContextType = {
    ...state,
    login,
    logout,
    updateUser,
    refreshToken,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;