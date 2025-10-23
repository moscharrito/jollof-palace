import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { MenuItem } from '@food-ordering/shared';
import QRLandingPage from '../../pages/QRLandingPage';

// Mock the useAvailableMenuItems hook
const mockMenuItems: MenuItem[] = [
  {
    id: '1',
    name: 'Signature Jollof Rice',
    description: 'Our famous Jollof rice cooked with aromatic spices.',
    price: 1500,
    category: 'main',
    imageUrl: '/images/jollof-rice.jpg',
    preparationTime: 15,
    isAvailable: true,
    ingredients: ['Rice', 'Tomatoes', 'Onions', 'Spices'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    name: 'Pepper Chicken',
    description: 'Tender chicken pieces in our signature spicy pepper sauce.',
    price: 2500,
    category: 'main',
    imageUrl: '/images/pepper-chicken.jpg',
    preparationTime: 20,
    isAvailable: true,
    ingredients: ['Chicken', 'Bell Peppers', 'Onions', 'Pepper Sauce'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    name: 'Dodo (Fried Plantain)',
    description: 'Sweet fried plantains, perfectly caramelized.',
    price: 800,
    category: 'side',
    imageUrl: '/images/dodo.jpg',
    preparationTime: 10,
    isAvailable: true,
    ingredients: ['Plantains', 'Palm Oil'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockUseAvailableMenuItems = vi.fn();

vi.mock('../../hooks/useMenu', () => ({
  useAvailableMenuItems: () => mockUseAvailableMenuItems(),
}));

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom') as any;
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const TestWrapper = ({ children, initialEntries = ['/qr'] }: { children: React.ReactNode; initialEntries?: string[] }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('QRLandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock current time to be during operating hours (2 PM)
    vi.setSystemTime(new Date('2024-01-01 14:00:00'));
    
    // Default successful response
    mockUseAvailableMenuItems.mockReturnValue({
      data: mockMenuItems,
      isLoading: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    sessionStorage.clear();
  });

  it('renders welcome message and restaurant name', () => {
    render(
      <TestWrapper>
        <QRLandingPage />
      </TestWrapper>
    );

    expect(screen.getByText('Welcome to Jollof Palace')).toBeInTheDocument();
    expect(screen.getByText('Authentic Nigerian Cuisine')).toBeInTheDocument();
  });

  it('displays table number from URL parameters', () => {
    render(
      <TestWrapper initialEntries={['/qr?table=5']}>
        <QRLandingPage />
      </TestWrapper>
    );

    expect(screen.getByText('Table 5')).toBeInTheDocument();
  });

  it('stores table number and location in session storage', async () => {
    render(
      <TestWrapper initialEntries={['/qr?table=12&location=patio']}>
        <QRLandingPage />
      </TestWrapper>
    );

    // Wait for the component to process the URL parameters
    await waitFor(() => {
      expect(sessionStorage.getItem('tableNumber')).toBe('12');
      expect(sessionStorage.getItem('location')).toBe('patio');
    });
  });

  it('displays menu statistics correctly', () => {
    render(
      <TestWrapper>
        <QRLandingPage />
      </TestWrapper>
    );

    expect(screen.getByText('3')).toBeInTheDocument(); // Number of menu items
    expect(screen.getByText('Menu Items Available')).toBeInTheDocument();
    expect(screen.getByText('15-25')).toBeInTheDocument(); // Prep time range
    expect(screen.getByText('Minutes Prep Time')).toBeInTheDocument();
  });

  it('displays featured menu items', () => {
    render(
      <TestWrapper>
        <QRLandingPage />
      </TestWrapper>
    );

    expect(screen.getByText('Featured Items')).toBeInTheDocument();
    expect(screen.getByText('Signature Jollof Rice')).toBeInTheDocument();
    expect(screen.getByText('Pepper Chicken')).toBeInTheDocument();
    expect(screen.getByText('Dodo (Fried Plantain)')).toBeInTheDocument();

    // Check pricing format
    expect(screen.getByText('₦15')).toBeInTheDocument();
    expect(screen.getByText('₦25')).toBeInTheDocument();
    expect(screen.getByText('₦8')).toBeInTheDocument();
  });

  it('navigates to menu page when clicking View Full Menu', () => {
    render(
      <TestWrapper>
        <QRLandingPage />
      </TestWrapper>
    );

    const viewMenuButton = screen.getByText('View Full Menu');
    fireEvent.click(viewMenuButton);

    expect(mockNavigate).toHaveBeenCalledWith('/menu');
  });

  it('navigates to quick order when clicking Quick Order button', () => {
    render(
      <TestWrapper>
        <QRLandingPage />
      </TestWrapper>
    );

    const quickOrderButton = screen.getByText('Quick Order Popular Items');
    fireEvent.click(quickOrderButton);

    expect(mockNavigate).toHaveBeenCalledWith('/menu?quickOrder=true');
  });

  it('shows loading state while fetching menu', () => {
    mockUseAvailableMenuItems.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    render(
      <TestWrapper>
        <QRLandingPage />
      </TestWrapper>
    );

    expect(screen.getByText('Loading menu...')).toBeInTheDocument();
  });

  it('shows error state when menu fetch fails', () => {
    mockUseAvailableMenuItems.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Network error'),
    });

    render(
      <TestWrapper>
        <QRLandingPage />
      </TestWrapper>
    );

    expect(screen.getByText('Unable to Load Menu')).toBeInTheDocument();
    expect(screen.getByText(/having trouble connecting/)).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('reloads page when clicking Try Again button', () => {
    mockUseAvailableMenuItems.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Network error'),
    });

    // Mock window.location.reload
    const mockReload = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true,
    });

    render(
      <TestWrapper>
        <QRLandingPage />
      </TestWrapper>
    );

    const tryAgainButton = screen.getByText('Try Again');
    fireEvent.click(tryAgainButton);

    expect(mockReload).toHaveBeenCalled();
  });

  it('shows closed message outside operating hours', () => {
    // Mock time to be outside operating hours (2 AM)
    vi.setSystemTime(new Date('2024-01-01 02:00:00'));

    render(
      <TestWrapper>
        <QRLandingPage />
      </TestWrapper>
    );

    expect(screen.getByText("We're Currently Closed")).toBeInTheDocument();
    expect(screen.getByText(/10:00 AM today/)).toBeInTheDocument();
    expect(screen.getByText('Operating Hours')).toBeInTheDocument();
    expect(screen.getByText('Monday - Sunday: 10:00 AM - 10:00 PM')).toBeInTheDocument();
  });

  it('allows viewing menu when closed but disables ordering', () => {
    // Mock time to be outside operating hours
    vi.setSystemTime(new Date('2024-01-01 02:00:00'));

    render(
      <TestWrapper>
        <QRLandingPage />
      </TestWrapper>
    );

    const viewMenuButton = screen.getByText('View Menu (Ordering Unavailable)');
    fireEvent.click(viewMenuButton);

    expect(mockNavigate).toHaveBeenCalledWith('/menu');
  });

  it('shows correct next open time based on current time', () => {
    // Mock time to be early morning (8 AM)
    vi.setSystemTime(new Date('2024-01-01 08:00:00'));

    render(
      <TestWrapper>
        <QRLandingPage />
      </TestWrapper>
    );

    expect(screen.getByText(/10:00 AM today/)).toBeInTheDocument();
  });

  it('shows next day opening time when closed late', () => {
    // Mock time to be late night (11 PM)
    vi.setSystemTime(new Date('2024-01-01 23:00:00'));

    render(
      <TestWrapper>
        <QRLandingPage />
      </TestWrapper>
    );

    expect(screen.getByText(/10:00 AM tomorrow/)).toBeInTheDocument();
  });

  it('displays contact information', () => {
    render(
      <TestWrapper>
        <QRLandingPage />
      </TestWrapper>
    );

    expect(screen.getByText('Need help? Call us at')).toBeInTheDocument();
    expect(screen.getByText('+234 801 234 5678')).toBeInTheDocument();
    expect(screen.getByText('Scan this QR code anytime to access our menu')).toBeInTheDocument();
  });

  it('handles empty menu items gracefully', () => {
    mockUseAvailableMenuItems.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    render(
      <TestWrapper>
        <QRLandingPage />
      </TestWrapper>
    );

    expect(screen.getByText('0')).toBeInTheDocument(); // Menu items count
    expect(screen.queryByText('Featured Items')).not.toBeInTheDocument();
  });

  it('limits featured items to first 3 items', () => {
    const manyItems = [
      ...mockMenuItems,
      {
        id: '4',
        name: 'Extra Item',
        description: 'This should not appear in featured items',
        price: 1000,
        category: 'main' as const,
        imageUrl: '/images/extra.jpg',
        preparationTime: 10,
        isAvailable: true,
        ingredients: ['Extra'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    mockUseAvailableMenuItems.mockReturnValue({
      data: manyItems,
      isLoading: false,
      error: null,
    });

    render(
      <TestWrapper>
        <QRLandingPage />
      </TestWrapper>
    );

    expect(screen.getByText('Signature Jollof Rice')).toBeInTheDocument();
    expect(screen.getByText('Pepper Chicken')).toBeInTheDocument();
    expect(screen.getByText('Dodo (Fried Plantain)')).toBeInTheDocument();
    expect(screen.queryByText('Extra Item')).not.toBeInTheDocument();
  });
});