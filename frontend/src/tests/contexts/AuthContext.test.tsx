import { useState } from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Test component to access auth context
const TestComponent = () => {
  const auth = useAuth();
  
  return (
    <div>
      <div data-testid="is-authenticated">{auth.isAuthenticated.toString()}</div>
      <div data-testid="is-loading">{auth.isLoading.toString()}</div>
      <div data-testid="user-email">{auth.user?.email || 'null'}</div>
      <div data-testid="user-role">{auth.user?.role || 'null'}</div>
      <button onClick={() => auth.login('admin@jollofpalace.com', 'admin123')}>
        Login
      </button>
      <button onClick={() => auth.logout()}>
        Logout
      </button>
      <button onClick={() => auth.updateUser({ name: 'Updated Name' })}>
        Update User
      </button>
      <button onClick={() => auth.refreshToken()}>
        Refresh Token
      </button>
    </div>
  );
};

const renderAuthProvider = () => {
  return render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with default state when no stored data', async () => {
      renderAuthProvider();

      await waitFor(() => {
        expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
        expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
        expect(screen.getByTestId('user-email')).toHaveTextContent('null');
        expect(screen.getByTestId('user-role')).toHaveTextContent('null');
      });
    });

    it('should restore user session from localStorage', async () => {
      const mockUser = {
        id: '1',
        name: 'Test Admin',
        email: 'admin@test.com',
        role: 'ADMIN',
      };
      const mockToken = 'mock-token';
      const futureExpiry = (Date.now() + 24 * 60 * 60 * 1000).toString(); // 24 hours from now

      mockLocalStorage.getItem.mockImplementation((key) => {
        switch (key) {
          case 'jollof-palace-admin-user':
            return JSON.stringify(mockUser);
          case 'jollof-palace-admin-token':
            return mockToken;
          case 'jollof-palace-admin-token-expiry':
            return futureExpiry;
          default:
            return null;
        }
      });

      renderAuthProvider();

      await waitFor(() => {
        expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
        expect(screen.getByTestId('user-email')).toHaveTextContent('admin@test.com');
        expect(screen.getByTestId('user-role')).toHaveTextContent('ADMIN');
      });
    });

    it('should clear expired session from localStorage', async () => {
      const mockUser = {
        id: '1',
        name: 'Test Admin',
        email: 'admin@test.com',
        role: 'ADMIN',
      };
      const mockToken = 'mock-token';
      const pastExpiry = (Date.now() - 60 * 60 * 1000).toString(); // 1 hour ago

      mockLocalStorage.getItem.mockImplementation((key) => {
        switch (key) {
          case 'jollof-palace-admin-user':
            return JSON.stringify(mockUser);
          case 'jollof-palace-admin-token':
            return mockToken;
          case 'jollof-palace-admin-token-expiry':
            return pastExpiry;
          default:
            return null;
        }
      });

      renderAuthProvider();

      await waitFor(() => {
        expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('jollof-palace-admin-user');
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('jollof-palace-admin-token');
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('jollof-palace-admin-token-expiry');
      });
    });
  });

  describe('Login Functionality', () => {
    it('should login successfully with admin credentials', async () => {
      renderAuthProvider();

      await act(async () => {
        screen.getByText('Login').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
        expect(screen.getByTestId('user-email')).toHaveTextContent('admin@jollofpalace.com');
        expect(screen.getByTestId('user-role')).toHaveTextContent('ADMIN');
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'jollof-palace-admin-user',
        expect.stringContaining('admin@jollofpalace.com')
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'jollof-palace-admin-token',
        expect.stringContaining('mock-admin-token')
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'jollof-palace-admin-token-expiry',
        expect.any(String)
      );
    });

    it('should login successfully with manager credentials', async () => {
      renderAuthProvider();

      // Create a test component that can login with manager credentials
      const ManagerLoginComponent = () => {
        const auth = useAuth();
        return (
          <button onClick={() => auth.login('manager@jollofpalace.com', 'manager123')}>
            Manager Login
          </button>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
          <ManagerLoginComponent />
        </AuthProvider>
      );

      await act(async () => {
        screen.getByText('Manager Login').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
        expect(screen.getByTestId('user-email')).toHaveTextContent('manager@jollofpalace.com');
        expect(screen.getByTestId('user-role')).toHaveTextContent('MANAGER');
      });
    });

    it('should login successfully with staff credentials', async () => {
      renderAuthProvider();

      const StaffLoginComponent = () => {
        const auth = useAuth();
        return (
          <button onClick={() => auth.login('staff@jollofpalace.com', 'staff123')}>
            Staff Login
          </button>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
          <StaffLoginComponent />
        </AuthProvider>
      );

      await act(async () => {
        screen.getByText('Staff Login').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
        expect(screen.getByTestId('user-email')).toHaveTextContent('staff@jollofpalace.com');
        expect(screen.getByTestId('user-role')).toHaveTextContent('STAFF');
      });
    });

    it('should throw error for invalid credentials', async () => {
      renderAuthProvider();

      const InvalidLoginComponent = () => {
        const auth = useAuth();
        const [error, setError] = useState<string | null>(null);

        const handleLogin = async () => {
          try {
            await auth.login('invalid@test.com', 'wrongpassword');
          } catch (err: any) {
            setError(err.message);
          }
        };

        return (
          <div>
            <button onClick={handleLogin}>Invalid Login</button>
            {error && <div data-testid="login-error">{error}</div>}
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
          <InvalidLoginComponent />
        </AuthProvider>
      );

      await act(async () => {
        screen.getByText('Invalid Login').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('login-error')).toHaveTextContent('Invalid email or password');
      });

      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
    });
  });

  describe('Logout Functionality', () => {
    it('should logout and clear stored data', async () => {
      // First login
      renderAuthProvider();

      await act(async () => {
        screen.getByText('Login').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
      });

      // Then logout
      await act(async () => {
        screen.getByText('Logout').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
        expect(screen.getByTestId('user-email')).toHaveTextContent('null');
        expect(screen.getByTestId('user-role')).toHaveTextContent('null');
      });

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('jollof-palace-admin-user');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('jollof-palace-admin-token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('jollof-palace-admin-token-expiry');
    });
  });

  describe('Update User Functionality', () => {
    it('should update user information', async () => {
      // First login
      renderAuthProvider();

      await act(async () => {
        screen.getByText('Login').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
      });

      // Then update user
      await act(async () => {
        screen.getByText('Update User').click();
      });

      // The user name should be updated in localStorage
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'jollof-palace-admin-user',
        expect.stringContaining('Updated Name')
      );
    });

    it('should not update user when not logged in', async () => {
      renderAuthProvider();

      await act(async () => {
        screen.getByText('Update User').click();
      });

      // Should not call setItem for user update when not logged in
      expect(mockLocalStorage.setItem).not.toHaveBeenCalledWith(
        'jollof-palace-admin-user',
        expect.any(String)
      );
    });
  });

  describe('Token Refresh Functionality', () => {
    it('should refresh token when logged in', async () => {
      // First login
      renderAuthProvider();

      await act(async () => {
        screen.getByText('Login').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
      });

      // Clear previous setItem calls
      mockLocalStorage.setItem.mockClear();

      // Then refresh token
      await act(async () => {
        screen.getByText('Refresh Token').click();
      });

      // Should update token expiry
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'jollof-palace-admin-token-expiry',
        expect.any(String)
      );
    });
  });

  describe('Auto-logout Timer', () => {
    it('should setup auto-logout timer on login', async () => {
      renderAuthProvider();

      await act(async () => {
        screen.getByText('Login').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
      });

      // Fast-forward time to trigger auto-logout (7 days - 1 minute)
      const sevenDaysMinusOneMinute = 7 * 24 * 60 * 60 * 1000 - 60000;
      
      await act(async () => {
        vi.advanceTimersByTime(sevenDaysMinusOneMinute);
      });

      await waitFor(() => {
        expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', async () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      renderAuthProvider();

      await waitFor(() => {
        expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
        expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
      });
    });

    it('should handle invalid JSON in localStorage', async () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'jollof-palace-admin-user') {
          return 'invalid-json';
        }
        return null;
      });

      renderAuthProvider();

      await waitFor(() => {
        expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('jollof-palace-admin-user');
      });
    });
  });
});