import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import LoadingSpinner from '../../components/ui/LoadingSpinner';

describe('LoadingSpinner Component', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />);
    
    // Should show loading text
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    // Should have proper accessibility attributes
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByLabelText('Loading')).toBeInTheDocument();
  });

  it('renders with custom text', () => {
    render(<LoadingSpinner text="Please wait..." />);
    
    expect(screen.getByText('Please wait...')).toBeInTheDocument();
  });

  it('renders without text when text prop is empty', () => {
    render(<LoadingSpinner text="" />);
    
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('applies correct size classes', () => {
    const { rerender } = render(<LoadingSpinner size="sm" />);
    
    let spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('w-4', 'h-4');
    
    rerender(<LoadingSpinner size="md" />);
    spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('w-8', 'h-8');
    
    rerender(<LoadingSpinner size="lg" />);
    spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('w-12', 'h-12');
  });

  it('applies custom className', () => {
    render(<LoadingSpinner className="custom-class" />);
    
    const container = screen.getByRole('status').parentElement;
    expect(container).toHaveClass('custom-class');
  });

  it('has proper animation classes', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('animate-spin');
    
    const text = screen.getByText('Loading...');
    expect(text).toHaveClass('animate-pulse');
  });
});