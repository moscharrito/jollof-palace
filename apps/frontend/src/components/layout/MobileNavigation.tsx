import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  Squares2X2Icon, 
  ShoppingCartIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  Squares2X2Icon as Squares2X2IconSolid,
  ShoppingCartIcon as ShoppingCartIconSolid,
  ClipboardDocumentListIcon as ClipboardDocumentListIconSolid
} from '@heroicons/react/24/solid';

import { useCart } from '../../hooks/useCart';
import CartBadge from '../ui/CartBadge';

interface MobileNavigationProps {
  className?: string;
}

const MobileNavigation = ({ className = '' }: MobileNavigationProps) => {
  const location = useLocation();
  const { getTotalItems } = useCart();
  
  const totalItems = getTotalItems();
  
  const navigation = [
    {
      name: 'Home',
      href: '/',
      icon: HomeIcon,
      iconSolid: HomeIconSolid,
      current: location.pathname === '/',
    },
    {
      name: 'Menu',
      href: '/menu',
      icon: Squares2X2Icon,
      iconSolid: Squares2X2IconSolid,
      current: location.pathname === '/menu',
    },
    {
      name: 'Cart',
      href: '/cart',
      icon: ShoppingCartIcon,
      iconSolid: ShoppingCartIconSolid,
      current: location.pathname === '/cart',
      badge: totalItems,
    },
    {
      name: 'Orders',
      href: '/orders',
      icon: ClipboardDocumentListIcon,
      iconSolid: ClipboardDocumentListIconSolid,
      current: location.pathname.startsWith('/order'),
    },
  ];
  
  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-bottom ${className}`}>
      <div className="grid grid-cols-4 h-16">
        {navigation.map((item) => {
          const Icon = item.current ? item.iconSolid : item.icon;
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex flex-col items-center justify-center space-y-1 transition-colors relative ${
                item.current
                  ? 'text-red-600'
                  : 'text-gray-500 hover:text-red-600'
              }`}
            >
              <div className="relative">
                <Icon className="w-6 h-6" />
                {item.badge && item.badge > 0 && (
                  <CartBadge count={item.badge} size="sm" />
                )}
              </div>
              <span className="text-xs font-medium">{item.name}</span>
              
              {/* Active indicator */}
              {item.current && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-red-600 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNavigation;