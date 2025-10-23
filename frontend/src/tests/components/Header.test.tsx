import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import Header from '../../components/layout/Header';
import { CartProvider } from '../../contexts/CartContext';
import { AuthProvider } from '../../contexts/AuthContext';

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Header Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders logo and navigation', () => {
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );
    
    // Should show logo
    expect(screen.getByText(/Jollof Palace/i)).toBeInTheDocument();
    
    // Should show navigation links
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Menu')).toBeInTheDocument();
  });

  it('displays cart icon with proper accessibility', () => {
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );
    
    // Should show cart button with proper aria-label
    const cartButton = screen.getByLabelText(/shopping cart/i);
    expect(cartButton).toBeInTheDocument();
  });

  it('shows mobile menu toggle button', () => {
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );
    
    // Should show mobile menu button
    const menuButton = screen.getByLabelText(/toggle menu/i);
    expect(menuButton).toBeInTheDocument();
  });

  it('toggles mobile menu when button is clicked', () => {
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );
    
    const menuButton = screen.getByLabelText(/toggle menu/i);
    
    // Mobile menu should not be visible initially
    expect(screen.queryByText('Home')).toBeInTheDocument(); // Desktop nav
    
    // Click to open mobile menu
    fireEvent.click(menuButton);
    
    // Mobile menu should now be visible with animation class
    const mobileMenu = document.querySelector('.animate-slide-in-down');
    expect(mobileMenu).toBeInTheDocument();
  });

  it('has responsive design classes', () => {
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );
    
    // Header should be fixed and responsive
    const header = screen.getByRole('banner');
    expect(header).toHaveClass('fixed', 'top-0', 'left-0', 'right-0', 'z-50');
    
    // Navigation should be hidden on mobile, visible on desktop
    const desktopNav = screen.getByRole('navigation');
    expect(desktopNav).toHaveClass('hidden', 'md:flex');
  });

  it('provides proper keyboard navigation', () => {
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );
    
    // All interactive elements should be focusable
    const logoLink = screen.getByRole('link', { name: /jollof palace/i });
    const homeLink = screen.getByRole('link', { name: /home/i });
    const menuLink = screen.getByRole('link', { name: /menu/i });
    const cartButton = screen.getByLabelText(/shopping cart/i);
    
    expect(logoLink).toBeInTheDocument();
    expect(homeLink).toBeInTheDocument();
    expect(menuLink).toBeInTheDocument();
    expect(cartButton).toBeInTheDocument();
  });
});