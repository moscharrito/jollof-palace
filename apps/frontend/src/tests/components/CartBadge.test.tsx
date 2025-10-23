import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import CartBadge from '../../components/ui/CartBadge';

describe('CartBadge', () => {
  it('renders nothing when count is 0', () => {
    const { container } = render(<CartBadge count={0} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders count when greater than 0', () => {
    render(<CartBadge count={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders 99+ when count is over 99', () => {
    render(<CartBadge count={150} />);
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('has correct accessibility label', () => {
    render(<CartBadge count={3} />);
    expect(screen.getByLabelText('3 items in cart')).toBeInTheDocument();
  });
});