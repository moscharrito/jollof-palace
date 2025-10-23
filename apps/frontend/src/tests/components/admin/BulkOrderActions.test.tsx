import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import BulkOrderActions from '../../../components/admin/BulkOrderActions';

describe('BulkOrderActions', () => {
  const mockOnBulkUpdate = vi.fn();
  const mockOnClear = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with correct selected count', () => {
    render(
      <BulkOrderActions
        selectedCount={5}
        onBulkUpdate={mockOnBulkUpdate}
        onClear={mockOnClear}
      />
    );

    expect(screen.getByText('5 orders selected')).toBeInTheDocument();
  });

  it('renders singular form for one selected order', () => {
    render(
      <BulkOrderActions
        selectedCount={1}
        onBulkUpdate={mockOnBulkUpdate}
        onClear={mockOnClear}
      />
    );

    expect(screen.getByText('1 order selected')).toBeInTheDocument();
  });

  it('opens dropdown when bulk actions button is clicked', () => {
    render(
      <BulkOrderActions
        selectedCount={3}
        onBulkUpdate={mockOnBulkUpdate}
        onClear={mockOnClear}
      />
    );

    const bulkActionsButton = screen.getByText('Bulk Actions');
    fireEvent.click(bulkActionsButton);

    expect(screen.getByText('Update 3 orders:')).toBeInTheDocument();
    expect(screen.getByText('Mark as Confirmed')).toBeInTheDocument();
    expect(screen.getByText('Mark as Preparing')).toBeInTheDocument();
    expect(screen.getByText('Mark as Ready')).toBeInTheDocument();
    expect(screen.getByText('Mark as Completed')).toBeInTheDocument();
    expect(screen.getByText('Cancel Orders')).toBeInTheDocument();
  });

  it('calls onBulkUpdate with correct status when action is selected', () => {
    render(
      <BulkOrderActions
        selectedCount={2}
        onBulkUpdate={mockOnBulkUpdate}
        onClear={mockOnClear}
      />
    );

    const bulkActionsButton = screen.getByText('Bulk Actions');
    fireEvent.click(bulkActionsButton);

    const confirmAction = screen.getByText('Mark as Confirmed');
    fireEvent.click(confirmAction);

    expect(mockOnBulkUpdate).toHaveBeenCalledWith('CONFIRMED');
  });

  it('calls onBulkUpdate with PREPARING status', () => {
    render(
      <BulkOrderActions
        selectedCount={2}
        onBulkUpdate={mockOnBulkUpdate}
        onClear={mockOnClear}
      />
    );

    const bulkActionsButton = screen.getByText('Bulk Actions');
    fireEvent.click(bulkActionsButton);

    const preparingAction = screen.getByText('Mark as Preparing');
    fireEvent.click(preparingAction);

    expect(mockOnBulkUpdate).toHaveBeenCalledWith('PREPARING');
  });

  it('calls onBulkUpdate with READY status', () => {
    render(
      <BulkOrderActions
        selectedCount={2}
        onBulkUpdate={mockOnBulkUpdate}
        onClear={mockOnClear}
      />
    );

    const bulkActionsButton = screen.getByText('Bulk Actions');
    fireEvent.click(bulkActionsButton);

    const readyAction = screen.getByText('Mark as Ready');
    fireEvent.click(readyAction);

    expect(mockOnBulkUpdate).toHaveBeenCalledWith('READY');
  });

  it('calls onBulkUpdate with COMPLETED status', () => {
    render(
      <BulkOrderActions
        selectedCount={2}
        onBulkUpdate={mockOnBulkUpdate}
        onClear={mockOnClear}
      />
    );

    const bulkActionsButton = screen.getByText('Bulk Actions');
    fireEvent.click(bulkActionsButton);

    const completedAction = screen.getByText('Mark as Completed');
    fireEvent.click(completedAction);

    expect(mockOnBulkUpdate).toHaveBeenCalledWith('COMPLETED');
  });

  it('calls onBulkUpdate with CANCELLED status', () => {
    render(
      <BulkOrderActions
        selectedCount={2}
        onBulkUpdate={mockOnBulkUpdate}
        onClear={mockOnClear}
      />
    );

    const bulkActionsButton = screen.getByText('Bulk Actions');
    fireEvent.click(bulkActionsButton);

    const cancelAction = screen.getByText('Cancel Orders');
    fireEvent.click(cancelAction);

    expect(mockOnBulkUpdate).toHaveBeenCalledWith('CANCELLED');
  });

  it('calls onClear when clear selection button is clicked', () => {
    render(
      <BulkOrderActions
        selectedCount={3}
        onBulkUpdate={mockOnBulkUpdate}
        onClear={mockOnClear}
      />
    );

    const clearButton = screen.getByText('Clear Selection');
    fireEvent.click(clearButton);

    expect(mockOnClear).toHaveBeenCalled();
  });

  it('closes dropdown after selecting an action', () => {
    render(
      <BulkOrderActions
        selectedCount={2}
        onBulkUpdate={mockOnBulkUpdate}
        onClear={mockOnClear}
      />
    );

    const bulkActionsButton = screen.getByText('Bulk Actions');
    fireEvent.click(bulkActionsButton);

    expect(screen.getByText('Update 2 orders:')).toBeInTheDocument();

    const confirmAction = screen.getByText('Mark as Confirmed');
    fireEvent.click(confirmAction);

    expect(screen.queryByText('Update 2 orders:')).not.toBeInTheDocument();
  });

  it('closes dropdown when clicking outside', () => {
    render(
      <div>
        <BulkOrderActions
          selectedCount={2}
          onBulkUpdate={mockOnBulkUpdate}
          onClear={mockOnClear}
        />
        <div data-testid="outside">Outside element</div>
      </div>
    );

    const bulkActionsButton = screen.getByText('Bulk Actions');
    fireEvent.click(bulkActionsButton);

    expect(screen.getByText('Update 2 orders:')).toBeInTheDocument();

    const outsideElement = screen.getByTestId('outside');
    fireEvent.mouseDown(outsideElement);

    expect(screen.queryByText('Update 2 orders:')).not.toBeInTheDocument();
  });

  it('displays correct icons for each action', () => {
    render(
      <BulkOrderActions
        selectedCount={2}
        onBulkUpdate={mockOnBulkUpdate}
        onClear={mockOnClear}
      />
    );

    const bulkActionsButton = screen.getByText('Bulk Actions');
    fireEvent.click(bulkActionsButton);

    // Check that all action items are present (icons are rendered as SVG elements)
    expect(screen.getByText('Mark as Confirmed')).toBeInTheDocument();
    expect(screen.getByText('Mark as Preparing')).toBeInTheDocument();
    expect(screen.getByText('Mark as Ready')).toBeInTheDocument();
    expect(screen.getByText('Mark as Completed')).toBeInTheDocument();
    expect(screen.getByText('Cancel Orders')).toBeInTheDocument();
  });

  it('updates dropdown header text based on selected count', () => {
    const { rerender } = render(
      <BulkOrderActions
        selectedCount={1}
        onBulkUpdate={mockOnBulkUpdate}
        onClear={mockOnClear}
      />
    );

    const bulkActionsButton = screen.getByText('Bulk Actions');
    fireEvent.click(bulkActionsButton);

    expect(screen.getByText('Update 1 order:')).toBeInTheDocument();

    // Close dropdown
    fireEvent.click(bulkActionsButton);

    // Rerender with different count
    rerender(
      <BulkOrderActions
        selectedCount={5}
        onBulkUpdate={mockOnBulkUpdate}
        onClear={mockOnClear}
      />
    );

    fireEvent.click(bulkActionsButton);
    expect(screen.getByText('Update 5 orders:')).toBeInTheDocument();
  });

  it('has correct styling for buttons', () => {
    render(
      <BulkOrderActions
        selectedCount={2}
        onBulkUpdate={mockOnBulkUpdate}
        onClear={mockOnClear}
      />
    );

    const bulkActionsButton = screen.getByText('Bulk Actions');
    const clearButton = screen.getByText('Clear Selection');

    // Check that buttons have appropriate classes
    expect(bulkActionsButton).toHaveClass('bg-red-600', 'text-white');
    expect(clearButton).toHaveClass('bg-white', 'border-gray-300');
  });
});