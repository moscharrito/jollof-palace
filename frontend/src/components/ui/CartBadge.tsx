interface CartBadgeProps {
  count: number;
  size?: 'sm' | 'md';
  className?: string;
}

const CartBadge = ({ count, size = 'md', className = '' }: CartBadgeProps) => {
  if (count <= 0) return null;
  
  const sizeClasses = {
    sm: 'w-4 h-4 text-xs',
    md: 'w-5 h-5 text-xs',
  };
  
  const positionClasses = {
    sm: '-top-1 -right-1',
    md: '-top-2 -right-2',
  };
  
  // Show 99+ for counts over 99
  const displayCount = count > 99 ? '99+' : count.toString();
  
  return (
    <span
      className={`
        absolute ${positionClasses[size]} ${sizeClasses[size]}
        bg-red-600 text-white font-bold rounded-full
        flex items-center justify-center
        animate-pulse-slow
        ${className}
      `}
      aria-label={`${count} items in cart`}
    >
      {displayCount}
    </span>
  );
};

export default CartBadge;