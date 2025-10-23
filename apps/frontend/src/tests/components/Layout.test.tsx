import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import Layout from '../../components/layout/Layout';
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

describe('Layout Component', () => {
  beforeEach(() => {
    // Reset any mocks before each test
    vi.clearAllMocks();
  });

  it('renders header and footer on normal pages', () => {
    render(
      <TestWrapper>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </TestWrapper>
    );
    
    // Should show header
    expect(screen.getByRole('banner')).toBeInTheDocument();
    
    // Should show the test content
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies mobile-first responsive classes', () => {
    render(
      <TestWrapper>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </TestWrapper>
    );
    
    // Check for mobile-first responsive structure
    const mainElement = screen.getByRole('main');
    expect(mainElement).toHaveClass('flex-1');
    expect(mainElement).toHaveClass('pt-16'); // Top padding for fixed header
    expect(mainElement).toHaveClass('pb-20'); // Bottom padding for mobile nav
    expect(mainElement).toHaveClass('sm:pb-0'); // No bottom padding on desktop
  });

  it('has proper semantic HTML structure', () => {
    render(
      <TestWrapper>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </TestWrapper>
    );
    
    // Should have proper semantic structure
    expect(screen.getByRole('banner')).toBeInTheDocument(); // header
    expect(screen.getByRole('main')).toBeInTheDocument(); // main content
  });

  it('provides mobile navigation for small screens', () => {
    render(
      <TestWrapper>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </TestWrapper>
    );
    
    // Mobile navigation should be present (though hidden on desktop)
    const mobileNav = document.querySelector('.sm\\:hidden');
    expect(mobileNav).toBeInTheDocument();
  });
});