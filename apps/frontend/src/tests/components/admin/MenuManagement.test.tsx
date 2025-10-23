import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import MenuManagementPage from '../../../pages/admin/MenuManagementPage';
import { menuService } from '../../../services/menuService';
import { AuthProvider } from '../../../contexts/AuthContext';

// Mock the menu service
vi.mock('../../../services/menuService', () => ({
  menuService: {
    getMenuItems: vi.fn(),
    createMenuItem: vi.fn(),
    updateMenuItem: vi.fn(),
    deleteMenuItem: vi.fn(),
    toggleMenuItemAvailability: vi.fn(),
    getMenuAnalytics: vi.fn(),
    updateMenuItemPrice: vi.fn(),
    getPriceHistory: vi.fn(),
  },
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockMenuItems = [
  {
    id: '1',
    name: 'Jollof Rice with Chicken',
    description: 'Traditional Nigerian jollof rice with spicy chicken',
    price: 1500,
    category: 'MAIN',
    imageUrl: 'https://example.com/jollof-chicken.jpg',
    isAvailable: true,
    preparationTime: 25,
    ingredients: ['rice', 'chicken', 'tomatoes', 'onions'],
    calories: 450,
    protein: 25.0,
    carbs: 65.0,
    fat: 12.0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Dodo (Fried Plantain)',
    description: 'Sweet fried plantain slices',
    price: 800,
    category: 'SIDE',
    imageUrl: 'https://example.com/dodo.jpg',
    isAvailable: false,
    preparationTime: 10,
    ingredients: ['plantain', 'oil'],
    calories: 180,
    carbs: 35.0,
    fat: 8.0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const mockAnalytics = [
  {
    itemId: '1',
    name: 'Jollof Rice with Chicken',
    category: 'MAIN',
    totalOrders: 25,
    totalQuantitySold: 45,
    totalRevenue: 67500,
    averageOrderValue: 2700,
    popularityRank: 1,
    lastOrderDate: '2024-01-15T12:00:00Z',
    salesTrend: 'up' as const,
  },
];

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const mockUser = {
    id: 'admin-1',
    name: 'Test Admin',
    email: 'admin@test.com',
    role: 'ADMIN',
  };

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider value={{ user: mockUser, login: vi.fn(), logout: vi.fn(), loading: false }}>
          {component}
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('MenuManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (menuService.getMenuItems as any).mockResolvedValue(mockMenuItems);
    (menuService.getMenuAnalytics as any).mockResolvedValue(mockAnalytics);
  });

  it('renders menu management page with menu items', async () => {
    renderWithProviders(<MenuManagementPage />);

    expect(screen.getByText('Menu Management')).toBeInTheDocument();
    expect(screen.getByText('Manage your restaurant\'s menu items, pricing, and availability')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Jollof Rice with Chicken')).toBeInTheDocument();
      expect(screen.getByText('Dodo (Fried Plantain)')).toBeInTheDocument();
    });
  });

  it('displays menu items with correct information', async () => {
    renderWithProviders(<MenuManagementPage />);

    await waitFor(() => {
      // Check first item
      expect(screen.getByText('Jollof Rice with Chicken')).toBeInTheDocument();
      expect(screen.getByText('$15.00')).toBeInTheDocument();
      expect(screen.getByText('25 min')).toBeInTheDocument();
      expect(screen.getByText('MAIN')).toBeInTheDocument();

      // Check second item
      expect(screen.getByText('Dodo (Fried Plantain)')).toBeInTheDocument();
      expect(screen.getByText('$8.00')).toBeInTheDocument();
      expect(screen.getByText('10 min')).toBeInTheDocument();
      expect(screen.getByText('SIDE')).toBeInTheDocument();
    });
  });

  it('shows unavailable items with overlay', async () => {
    renderWithProviders(<MenuManagementPage />);

    await waitFor(() => {
      expect(screen.getByText('Unavailable')).toBeInTheDocument();
    });
  });

  it('filters menu items by category', async () => {
    renderWithProviders(<MenuManagementPage />);

    await waitFor(() => {
      expect(screen.getByText('Jollof Rice with Chicken')).toBeInTheDocument();
      expect(screen.getByText('Dodo (Fried Plantain)')).toBeInTheDocument();
    });

    // Filter by MAIN category
    const categorySelect = screen.getByDisplayValue('All Categories');
    fireEvent.change(categorySelect, { target: { value: 'MAIN' } });

    await waitFor(() => {
      expect(screen.getByText('Jollof Rice with Chicken')).toBeInTheDocument();
      expect(screen.queryByText('Dodo (Fried Plantain)')).not.toBeInTheDocument();
    });
  });

  it('filters menu items by search term', async () => {
    renderWithProviders(<MenuManagementPage />);

    await waitFor(() => {
      expect(screen.getByText('Jollof Rice with Chicken')).toBeInTheDocument();
      expect(screen.getByText('Dodo (Fried Plantain)')).toBeInTheDocument();
    });

    // Search for "jollof"
    const searchInput = screen.getByPlaceholderText('Search menu items...');
    fireEvent.change(searchInput, { target: { value: 'jollof' } });

    await waitFor(() => {
      expect(screen.getByText('Jollof Rice with Chicken')).toBeInTheDocument();
      expect(screen.queryByText('Dodo (Fried Plantain)')).not.toBeInTheDocument();
    });
  });

  it('opens add item modal when Add Item button is clicked', async () => {
    renderWithProviders(<MenuManagementPage />);

    const addButton = screen.getByText('Add Item');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Add New Menu Item')).toBeInTheDocument();
    });
  });

  it('opens analytics modal when Analytics button is clicked', async () => {
    renderWithProviders(<MenuManagementPage />);

    const analyticsButton = screen.getByText('Analytics');
    fireEvent.click(analyticsButton);

    await waitFor(() => {
      expect(screen.getByText('Menu Analytics')).toBeInTheDocument();
    });
  });

  it('toggles item availability when toggle button is clicked', async () => {
    (menuService.toggleMenuItemAvailability as any).mockResolvedValue({
      ...mockMenuItems[0],
      isAvailable: false,
    });

    renderWithProviders(<MenuManagementPage />);

    await waitFor(() => {
      expect(screen.getByText('Jollof Rice with Chicken')).toBeInTheDocument();
    });

    // Find and click the toggle button for the available item
    const toggleButtons = screen.getAllByTitle(/Disable Item|Enable Item/);
    fireEvent.click(toggleButtons[0]);

    await waitFor(() => {
      expect(menuService.toggleMenuItemAvailability).toHaveBeenCalledWith('1');
    });
  });

  it('opens edit modal when Edit button is clicked', async () => {
    renderWithProviders(<MenuManagementPage />);

    await waitFor(() => {
      expect(screen.getByText('Jollof Rice with Chicken')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Edit Menu Item')).toBeInTheDocument();
    });
  });

  it('opens price update modal when Price button is clicked', async () => {
    renderWithProviders(<MenuManagementPage />);

    await waitFor(() => {
      expect(screen.getByText('Jollof Rice with Chicken')).toBeInTheDocument();
    });

    const priceButtons = screen.getAllByText('Price');
    fireEvent.click(priceButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Update Price')).toBeInTheDocument();
    });
  });

  it('confirms deletion when delete button is clicked', async () => {
    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    (menuService.deleteMenuItem as any).mockResolvedValue(undefined);

    renderWithProviders(<MenuManagementPage />);

    await waitFor(() => {
      expect(screen.getByText('Jollof Rice with Chicken')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button');
    const deleteButton = deleteButtons.find(button => 
      button.querySelector('svg')?.getAttribute('data-testid') === 'trash-icon' ||
      button.textContent?.includes('Delete')
    );

    if (deleteButton) {
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete "Jollof Rice with Chicken"?');
        expect(menuService.deleteMenuItem).toHaveBeenCalledWith('1');
      });
    }

    confirmSpy.mockRestore();
  });

  it('handles loading state', () => {
    (menuService.getMenuItems as any).mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithProviders(<MenuManagementPage />);

    expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
  });

  it('handles empty menu items state', async () => {
    (menuService.getMenuItems as any).mockResolvedValue([]);

    renderWithProviders(<MenuManagementPage />);

    await waitFor(() => {
      expect(screen.getByText('No menu items found')).toBeInTheDocument();
    });
  });

  it('handles filtered empty state', async () => {
    renderWithProviders(<MenuManagementPage />);

    await waitFor(() => {
      expect(screen.getByText('Jollof Rice with Chicken')).toBeInTheDocument();
    });

    // Search for something that doesn't exist
    const searchInput = screen.getByPlaceholderText('Search menu items...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    await waitFor(() => {
      expect(screen.getByText('No menu items match your filters')).toBeInTheDocument();
    });
  });
});

describe('MenuItemModal', () => {
  it('validates required fields', async () => {
    renderWithProviders(<MenuManagementPage />);

    // Open add modal
    const addButton = screen.getByText('Add Item');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Add New Menu Item')).toBeInTheDocument();
    });

    // Try to submit without filling required fields
    const submitButton = screen.getByText('Create Item');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Description is required')).toBeInTheDocument();
      expect(screen.getByText('Valid price is required')).toBeInTheDocument();
    });
  });

  it('creates new menu item with valid data', async () => {
    const newItem = {
      id: '3',
      name: 'New Test Item',
      description: 'Test description',
      price: 1200,
      category: 'MAIN',
      imageUrl: 'https://example.com/new-item.jpg',
      isAvailable: true,
      preparationTime: 20,
      ingredients: ['test ingredient'],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    (menuService.createMenuItem as any).mockResolvedValue(newItem);

    renderWithProviders(<MenuManagementPage />);

    // Open add modal
    const addButton = screen.getByText('Add Item');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Add New Menu Item')).toBeInTheDocument();
    });

    // Fill form
    fireEvent.change(screen.getByPlaceholderText('Enter item name'), {
      target: { value: 'New Test Item' }
    });
    fireEvent.change(screen.getByPlaceholderText('Enter item description'), {
      target: { value: 'Test description' }
    });
    fireEvent.change(screen.getByPlaceholderText('0.00'), {
      target: { value: '12.00' }
    });
    fireEvent.change(screen.getByPlaceholderText('https://example.com/image.jpg'), {
      target: { value: 'https://example.com/new-item.jpg' }
    });
    fireEvent.change(screen.getByPlaceholderText('15'), {
      target: { value: '20' }
    });

    // Add ingredient
    fireEvent.change(screen.getByPlaceholderText('Add ingredient'), {
      target: { value: 'test ingredient' }
    });
    fireEvent.click(screen.getByText('Add'));

    // Submit form
    fireEvent.click(screen.getByText('Create Item'));

    await waitFor(() => {
      expect(menuService.createMenuItem).toHaveBeenCalledWith({
        name: 'New Test Item',
        description: 'Test description',
        price: 1200,
        category: 'MAIN',
        imageUrl: 'https://example.com/new-item.jpg',
        preparationTime: 20,
        ingredients: ['test ingredient'],
      });
    });
  });
});