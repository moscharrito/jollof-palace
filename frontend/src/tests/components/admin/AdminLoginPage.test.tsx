import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import AdminLoginPage from '../../../pages/admin/AdminLoginPage';
import { AuthProvider } from '../../../contexts/AuthContext';

// Mock the useAuth hook
const mockLogin = vi.fn();
const mockUseAuth = {
  login: mockLogin,
  isAuthenticated: false,
  isLoading: false,
  user: null,
  logout: vi.fn(),
  updateUser: vi.fn(),
  refreshToken: vi.fn(),
};

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth,
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate-to">{to}</div>,
  };
});

const renderAdminLoginPage = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <AdminLoginPage />
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('AdminLoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.isAuthenticated = false;
    mockUseAuth.isLoading = false;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render login form elements', () => {
      renderAdminLoginPage();

      expect(screen.getByText('Admin Login')).toBeInTheDocument();
      expect(screen.getByText('Sign in to your admin account to manage orders and menu')).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should render demo credentials section', () => {
      renderAdminLoginPage();

      expect(screen.getByText('Demo Credentials')).toBeInTheDocument();
      expect(screen.getByText(/admin@jollofpalace.com/)).toBeInTheDocument();
      expect(screen.getByText(/manager@jollofpalace.com/)).toBeInTheDocument();
      expect(screen.getByText(/staff@jollofpalace.com/)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show validation errors for empty fields', async () => {
      renderAdminLoginPage();

      // Submit form with empty fields
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });

      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('should call login with correct credentials', async () => {
      mockLogin.mockResolvedValue(undefined);
      renderAdminLoginPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'admin@jollofpalace.com' } });
      fireEvent.change(passwordInput, { target: { value: 'admin123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('admin@jollofpalace.com', 'admin123');
      });
    });
  });
});