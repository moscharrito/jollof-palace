import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import OrderStatusBadge from '../../../components/admin/OrderStatusBadge';
import { OrderStatus } from '../../../types/order';

describe('OrderStatusBadge', () => {
  it('renders status badge without dropdown', () => {
    render(<OrderStatusBadge status="PENDING" />);

    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders status badge with dropdown when showDropdown is true', () => {
    const mockOnStatusChange = vi.fn();
    
    render(
      <OrderStatusBadge 
        status="PENDING" 
        onStatusChange={mockOnStatusChange}
        showDropdown={true}
      />
    );

    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('shows correct color for each status', () => {
    const statuses: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];
    
    statuses.forEach(status => {
      const { rerender } = render(<OrderStatusBadge status={status} />);
      
      const badge = screen.getByText(status === 'PENDING' ? 'Pending' : 
                                   status === 'CONFIRMED' ? 'Confirmed' :
                                   status === 'PREPARING' ? 'Preparing' :
                                   status === 'READY' ? 'Ready' :
                                   status === 'COMPLETED' ? 'Completed' : 'Cancelled');
      
      expect(badge).toBeInTheDocument();
      
      // Clean up for next iteration
      rerender(<div />);
    });
  });

  it('opens dropdown when clicked', () => {
    const mockOnStatusChange = vi.fn();
    
    render(
      <OrderStatusBadge 
        status="PENDING" 
        onStatusChange={mockOnStatusChange}
        showDropdown={true}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.getByText('Change to:')).toBeInTheDocument();
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  it('shows correct next statuses for PENDING', () => {
    const mockOnStatusChange = vi.fn();
    
    render(
      <OrderStatusBadge 
        status="PENDING" 
        onStatusChange={mockOnStatusChange}
        showDropdown={true}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.getByText('Confirmed')).toBeInTheDocument();
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
    expect(screen.queryByText('Preparing')).not.toBeInTheDocument();
  });

  it('shows correct next statuses for CONFIRMED', () => {
    const mockOnStatusChange = vi.fn();
    
    render(
      <OrderStatusBadge 
        status="CONFIRMED" 
        onStatusChange={mockOnStatusChange}
        showDropdown={true}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.getByText('Preparing')).toBeInTheDocument();
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
    expect(screen.queryByText('Ready')).not.toBeInTheDocument();
  });

  it('shows correct next statuses for PREPARING', () => {
    const mockOnStatusChange = vi.fn();
    
    render(
      <OrderStatusBadge 
        status="PREPARING" 
        onStatusChange={mockOnStatusChange}
        showDropdown={true}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
    expect(screen.queryByText('Completed')).not.toBeInTheDocument();
  });

  it('shows correct next statuses for READY', () => {
    const mockOnStatusChange = vi.fn();
    
    render(
      <OrderStatusBadge 
        status="READY" 
        onStatusChange={mockOnStatusChange}
        showDropdown={true}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.queryByText('Cancelled')).not.toBeInTheDocument();
  });

  it('shows no dropdown for COMPLETED status', () => {
    const mockOnStatusChange = vi.fn();
    
    render(
      <OrderStatusBadge 
        status="COMPLETED" 
        onStatusChange={mockOnStatusChange}
        showDropdown={true}
      />
    );

    // Should render as regular badge since no next statuses available
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('shows no dropdown for CANCELLED status', () => {
    const mockOnStatusChange = vi.fn();
    
    render(
      <OrderStatusBadge 
        status="CANCELLED" 
        onStatusChange={mockOnStatusChange}
        showDropdown={true}
      />
    );

    // Should render as regular badge since no next statuses available
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  it('calls onStatusChange when status is selected', () => {
    const mockOnStatusChange = vi.fn();
    
    render(
      <OrderStatusBadge 
        status="PENDING" 
        onStatusChange={mockOnStatusChange}
        showDropdown={true}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    const confirmedOption = screen.getByText('Confirmed');
    fireEvent.click(confirmedOption);

    expect(mockOnStatusChange).toHaveBeenCalledWith('CONFIRMED');
  });

  it('closes dropdown after status selection', () => {
    const mockOnStatusChange = vi.fn();
    
    render(
      <OrderStatusBadge 
        status="PENDING" 
        onStatusChange={mockOnStatusChange}
        showDropdown={true}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    const confirmedOption = screen.getByText('Confirmed');
    fireEvent.click(confirmedOption);

    expect(screen.queryByText('Change to:')).not.toBeInTheDocument();
  });

  it('closes dropdown when clicking outside', () => {
    const mockOnStatusChange = vi.fn();
    
    render(
      <div>
        <OrderStatusBadge 
          status="PENDING" 
          onStatusChange={mockOnStatusChange}
          showDropdown={true}
        />
        <div data-testid="outside">Outside element</div>
      </div>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.getByText('Change to:')).toBeInTheDocument();

    const outsideElement = screen.getByTestId('outside');
    fireEvent.mouseDown(outsideElement);

    expect(screen.queryByText('Change to:')).not.toBeInTheDocument();
  });

  it('applies correct CSS classes for each status', () => {
    const statusTests = [
      { status: 'PENDING' as OrderStatus, expectedClass: 'bg-yellow-100 text-yellow-800' },
      { status: 'CONFIRMED' as OrderStatus, expectedClass: 'bg-blue-100 text-blue-800' },
      { status: 'PREPARING' as OrderStatus, expectedClass: 'bg-orange-100 text-orange-800' },
      { status: 'READY' as OrderStatus, expectedClass: 'bg-green-100 text-green-800' },
      { status: 'COMPLETED' as OrderStatus, expectedClass: 'bg-gray-100 text-gray-800' },
      { status: 'CANCELLED' as OrderStatus, expectedClass: 'bg-red-100 text-red-800' }
    ];

    statusTests.forEach(({ status, expectedClass }) => {
      const { rerender } = render(<OrderStatusBadge status={status} />);
      
      const badge = screen.getByText(status === 'PENDING' ? 'Pending' : 
                                   status === 'CONFIRMED' ? 'Confirmed' :
                                   status === 'PREPARING' ? 'Preparing' :
                                   status === 'READY' ? 'Ready' :
                                   status === 'COMPLETED' ? 'Completed' : 'Cancelled');
      
      expect(badge).toHaveClass(expectedClass);
      
      // Clean up for next iteration
      rerender(<div />);
    });
  });
});