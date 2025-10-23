import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect } from 'vitest';

import App from '../App';
import { CartProvider } from '../contexts/CartContext';
import { AuthProvider } from '../contexts/AuthContext';

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

describe('App', () => {
  it('renders without crashing', () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );
    
    // Should render the home page by default
    expect(screen.getByText(/Authentic Nigerian/i)).toBeInTheDocument();
  });

  it('displays the main navigation', () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );
    
    // Should show the header with navigation
    expect(screen.getByRole('banner')).toBeInTheDocument();
    
    // Should have navigation links (multiple instances are expected for mobile/desktop)
    const homeLinks = screen.getAllByText('Home');
    const menuLinks = screen.getAllByText('Menu');
    expect(homeLinks.length).toBeGreaterThan(0);
    expect(menuLinks.length).toBeGreaterThan(0);
  });
});