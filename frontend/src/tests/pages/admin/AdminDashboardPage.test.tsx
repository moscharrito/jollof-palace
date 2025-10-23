import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AdminDashboardPage from '../../../pages/admin/AdminDashboardPage';

// Mock the LoadingSpinner component
vi.mock('../../../components/ui/LoadingSpinner', () => ({
  default: ({ size }: { size?: string }) => (
    <div data-testid="loading-spinner" data-size={size}>Loading...</div>
  ),
}));

const renderAdminDashboardPage = () => {
  return render(
    <BrowserRouter>
      <AdminDashboardPage />
    </BrowserRouter>
  );
};

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading spinner initially', () => {
      renderAdminDashboardPage();

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByTestId('loading-spinner')).toHaveAttribute('data-size', 'lg');
    });
  });

  describe('Dashboard Content', () => {
    it('should render dashboard header after loading', async () => {
      renderAdminDashboardPage();

      await waitFor(() => {
        expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
        expect(screen.getByText('Welcome to your restaurant management dashboard')).toBeInTheDocument();
      });
    });

    it('should render all statistics cards', async () => {
      renderAdminDashboardPage();

      await waitFor(() => {
        // Check for stat card titles
        expect(screen.getByText('Total Orders')).toBeInTheDocument();
        expect(screen.getByText('Pending Orders')).toBeInTheDocument();
        expect(screen.getByText('Completed Orders')).toBeInTheDocument();
        expect(screen.getByText('Total Revenue')).toBeInTheDocument();
        expect(screen.getByText("Today's Revenue")).toBeInTheDocument();
        expect(screen.getByText('Active Customers')).toBeInTheDocument();
      });
    });

    it('should display mock statistics data', async () => {
      renderAdminDashboardPage();

      await waitFor(() => {
        // Check for mock data values
        expect(screen.getByText('156')).toBeInTheDocument(); // Total Orders
        expect(screen.getByText('8')).toBeInTheDocument(); // Pending Orders
        expect(screen.getByText('148')).toBeInTheDocument(); // Completed Orders
        expect(screen.getByText('89')).toBeInTheDocument(); // Active Customers
        
        // Check for formatted currency values
        expect(screen.getByText('$154.20')).toBeInTheDocument(); // Total Revenue
        expect(screen.getByText('$8.90')).toBeInTheDocument(); // Today's Revenue
      });
    });

    it('should render recent orders table', async () => {
      renderAdminDashboardPage();

      await waitFor(() => {
        expect(screen.getByText('Recent Orders')).toBeInTheDocument();
        
        // Check table headers
        expect(screen.getByText('Order')).toBeInTheDocument();
        expect(screen.getByText('Customer')).toBeInTheDocument();
        expect(screen.getByText('Total')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('Time')).toBeInTheDocument();
      });
    });

    it('should display mock order data in table', async () => {
      renderAdminDashboardPage();

      await waitFor(() => {
        // Check for mock order data
        expect(screen.getByText('JP-001')).toBeInTheDocument();
        expect(screen.getByText('JP-002')).toBeInTheDocument();
        expect(screen.getByText('JP-003')).toBeInTheDocument();
        
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('Mike Johnson')).toBeInTheDocument();
        
        expect(screen.getByText('$25.00')).toBeInTheDocument();
        expect(screen.getByText('$18.00')).toBeInTheDocument();
        expect(screen.getByText('$32.00')).toBeInTheDocument();
      });
    });

    it('should display order status badges with correct styling', async () => {
      renderAdminDashboardPage();

      await waitFor(() => {
        const preparingStatus = screen.getByText('PREPARING');
        const readyStatus = screen.getByText('READY');
        const completedStatus = screen.getByText('COMPLETED');
        
        expect(preparingStatus).toHaveClass('bg-blue-100', 'text-blue-800');
        expect(readyStatus).toHaveClass('bg-green-100', 'text-green-800');
        expect(completedStatus).toHaveClass('bg-gray-100', 'text-gray-800');
      });
    });
  });

  describe('Statistics Icons', () => {
    it('should render appropriate icons for each statistic', async () => {
      renderAdminDashboardPage();

      await waitFor(() => {
        // Icons are rendered as SVG elements with specific classes
        const icons = screen.getAllByRole('img', { hidden: true });
        expect(icons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Currency Formatting', () => {
    it('should format currency values correctly', async () => {
      renderAdminDashboardPage();

      await waitFor(() => {
        // Check that currency is formatted as USD
        expect(screen.getByText('$154.20')).toBeInTheDocument();
        expect(screen.getByText('$8.90')).toBeInTheDocument();
        expect(screen.getByText('$25.00')).toBeInTheDocument();
        expect(screen.getByText('$18.00')).toBeInTheDocument();
        expect(screen.getByText('$32.00')).toBeInTheDocument();
      });
    });
  });

  describe('Time Formatting', () => {
    it('should format time values correctly', async () => {
      renderAdminDashboardPage();

      await waitFor(() => {
        // Check for time format (HH:MM AM/PM)
        const timeElements = screen.getAllByText(/\d{1,2}:\d{2}\s?(AM|PM)/i);
        expect(timeElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Responsive Design', () => {
    it('should render grid layout for statistics', async () => {
      renderAdminDashboardPage();

      await waitFor(() => {
        const statsContainer = screen.getByText('Total Orders').closest('.grid');
        expect(statsContainer).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
      });
    });

    it('should render responsive table', async () => {
      renderAdminDashboardPage();

      await waitFor(() => {
        const tableContainer = screen.getByText('Recent Orders').closest('.bg-white');
        expect(tableContainer).toBeInTheDocument();
        
        const table = screen.getByRole('table');
        expect(table).toHaveClass('min-w-full');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', async () => {
      renderAdminDashboardPage();

      await waitFor(() => {
        const mainHeading = screen.getByRole('heading', { level: 1 });
        expect(mainHeading).toHaveTextContent('Dashboard Overview');
        
        const sectionHeading = screen.getByRole('heading', { level: 2 });
        expect(sectionHeading).toHaveTextContent('Recent Orders');
      });
    });

    it('should have accessible table structure', async () => {
      renderAdminDashboardPage();

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table).toBeInTheDocument();
        
        const columnHeaders = screen.getAllByRole('columnheader');
        expect(columnHeaders).toHaveLength(5); // Order, Customer, Total, Status, Time
        
        const rows = screen.getAllByRole('row');
        expect(rows.length).toBeGreaterThan(1); // Header + data rows
      });
    });
  });

  describe('Data Loading Simulation', () => {
    it('should simulate API delay before showing data', async () => {
      renderAdminDashboardPage();

      // Initially should show loading
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.queryByText('Dashboard Overview')).not.toBeInTheDocument();

      // After loading should show content
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
        expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
      });
    });
  });
});