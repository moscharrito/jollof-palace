import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ProtectedAdminRoute from '../../../components/admin/ProtectedAdminRoute';
import { AuthProvider } from '../../../contexts/AuthContext';

// Mock the useAuth hook
const mockUseAuth = {
  isAuthenticated: false,
  isLoading: false,
  user: null,
  login: vi.fn(),
  logout: vi.fn(),
  updateUser: vi.fn(),
  refreshToken: vi.fn(),
};

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth,
}));

// Mock react-router-dom Navigate component
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: ({ to, state }: { to: string; state?: any }) => (
      <div data-testid="navigate-to" data-to={to} data-state={JSON.stringify(state)}>
        Redirecting to {to}
      </div>
    ),
    useLocation: () => ({ pathname: '/admin/dashboard' }),
  };
});

const renderProtectedRoute = (requiredRole?: 'ADMIN' | 'MANAGER' | 'STAFF') => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <ProtectedAdminRoute requiredRole={requiredRole}>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedAdminRoute>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('ProtectedAdminRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.isAuthenticated = false;
    mockUseAuth.isLoading = false;
    mockUseAuth.user = null;
  });

  describe('Loading State', () => {
    it('should show loading spinner when authentication is loading', () => {
      mockUseAuth.isLoading = true;

      renderProtectedRoute();

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('Unauthenticated Access', () => {
    it('should redirect to login when not authenticated', () => {
      mockUseAuth.isAuthenticated = false;

      renderProtectedRoute();

      const redirectElement = screen.getByTestId('navigate-to');
      expect(redirectElement).toHaveAttribute('data-to', '/admin/login');
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should pass current location in redirect state', () => {
      mockUseAuth.isAuthenticated = false;

      renderProtectedRoute();

      const redirectElement = screen.getByTestId('navigate-to');
      const state = JSON.parse(redirectElement.getAttribute('data-state') || '{}');
      expect(state.from.pathname).toBe('/admin/dashboard');
    });
  });

  describe('Authenticated Access', () => {
    beforeEach(() => {
      mockUseAuth.isAuthenticated = true;
      mockUseAuth.user = {
        id: '1',
        name: 'Test Admin',
        email: 'admin@test.com',
        role: 'ADMIN',
      };
    });

    it('should render protected content when authenticated', () => {
      renderProtectedRoute();

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.queryByTestId('navigate-to')).not.toBeInTheDocument();
    });

    it('should render content when no role requirement is specified', () => {
      renderProtectedRoute();

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  describe('Role-Based Access Control', () => {
    describe('ADMIN Role', () => {
      beforeEach(() => {
        mockUseAuth.isAuthenticated = true;
        mockUseAuth.user = {
          id: '1',
          name: 'Test Admin',
          email: 'admin@test.com',
          role: 'ADMIN',
        };
      });

      it('should allow access to ADMIN required routes', () => {
        renderProtectedRoute('ADMIN');

        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });

      it('should allow access to MANAGER required routes', () => {
        renderProtectedRoute('MANAGER');

        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });

      it('should allow access to STAFF required routes', () => {
        renderProtectedRoute('STAFF');

        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });

    describe('MANAGER Role', () => {
      beforeEach(() => {
        mockUseAuth.isAuthenticated = true;
        mockUseAuth.user = {
          id: '2',
          name: 'Test Manager',
          email: 'manager@test.com',
          role: 'MANAGER',
        };
      });

      it('should deny access to ADMIN required routes', () => {
        renderProtectedRoute('ADMIN');

        expect(screen.getByText('Access Denied')).toBeInTheDocument();
        expect(screen.getByText("You don't have permission to access this page.")).toBeInTheDocument();
        expect(screen.getByText('Required role: ADMIN, Your role: MANAGER')).toBeInTheDocument();
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      });

      it('should allow access to MANAGER required routes', () => {
        renderProtectedRoute('MANAGER');

        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });

      it('should allow access to STAFF required routes', () => {
        renderProtectedRoute('STAFF');

        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });

    describe('STAFF Role', () => {
      beforeEach(() => {
        mockUseAuth.isAuthenticated = true;
        mockUseAuth.user = {
          id: '3',
          name: 'Test Staff',
          email: 'staff@test.com',
          role: 'STAFF',
        };
      });

      it('should deny access to ADMIN required routes', () => {
        renderProtectedRoute('ADMIN');

        expect(screen.getByText('Access Denied')).toBeInTheDocument();
        expect(screen.getByText('Required role: ADMIN, Your role: STAFF')).toBeInTheDocument();
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      });

      it('should deny access to MANAGER required routes', () => {
        renderProtectedRoute('MANAGER');

        expect(screen.getByText('Access Denied')).toBeInTheDocument();
        expect(screen.getByText('Required role: MANAGER, Your role: STAFF')).toBeInTheDocument();
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      });

      it('should allow access to STAFF required routes', () => {
        renderProtectedRoute('STAFF');

        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });

    describe('Unknown Role', () => {
      beforeEach(() => {
        mockUseAuth.isAuthenticated = true;
        mockUseAuth.user = {
          id: '4',
          name: 'Test User',
          email: 'user@test.com',
          role: 'UNKNOWN' as any,
        };
      });

      it('should deny access to any role-protected route', () => {
        renderProtectedRoute('STAFF');

        expect(screen.getByText('Access Denied')).toBeInTheDocument();
        expect(screen.getByText('Required role: STAFF, Your role: UNKNOWN')).toBeInTheDocument();
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing user object gracefully', () => {
      mockUseAuth.isAuthenticated = true;
      mockUseAuth.user = null;

      renderProtectedRoute('ADMIN');

      // Should still render content if no role requirement and authenticated
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should handle user without role property', () => {
      mockUseAuth.isAuthenticated = true;
      mockUseAuth.user = {
        id: '1',
        name: 'Test User',
        email: 'user@test.com',
      } as any;

      renderProtectedRoute('ADMIN');

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.getByText('Required role: ADMIN, Your role: undefined')).toBeInTheDocument();
    });
  });
});