import { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { OrderStatus } from '../../types/order';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  onStatusChange?: (newStatus: OrderStatus) => void;
  showDropdown?: boolean;
}

const OrderStatusBadge = ({ status, onStatusChange, showDropdown = false }: OrderStatusBadgeProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const statusConfig = {
    PENDING: {
      label: 'Pending',
      color: 'bg-yellow-100 text-yellow-800',
      nextStatuses: ['CONFIRMED', 'CANCELLED']
    },
    CONFIRMED: {
      label: 'Confirmed',
      color: 'bg-blue-100 text-blue-800',
      nextStatuses: ['PREPARING', 'CANCELLED']
    },
    PREPARING: {
      label: 'Preparing',
      color: 'bg-orange-100 text-orange-800',
      nextStatuses: ['READY', 'CANCELLED']
    },
    READY: {
      label: 'Ready',
      color: 'bg-green-100 text-green-800',
      nextStatuses: ['COMPLETED']
    },
    COMPLETED: {
      label: 'Completed',
      color: 'bg-gray-100 text-gray-800',
      nextStatuses: []
    },
    CANCELLED: {
      label: 'Cancelled',
      color: 'bg-red-100 text-red-800',
      nextStatuses: []
    }
  };

  const currentConfig = statusConfig[status];
  const availableStatuses = currentConfig.nextStatuses;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleStatusChange = (newStatus: OrderStatus) => {
    if (onStatusChange) {
      onStatusChange(newStatus);
    }
    setIsOpen(false);
  };

  if (!showDropdown || !onStatusChange || availableStatuses.length === 0) {
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${currentConfig.color}`}>
        {currentConfig.label}
      </span>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${currentConfig.color} hover:opacity-80 transition-opacity`}
      >
        {currentConfig.label}
        <ChevronDownIcon className="ml-1 h-3 w-3" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg border border-gray-200 z-10">
          <div className="py-1">
            <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
              Change to:
            </div>
            {availableStatuses.map((statusOption) => {
              const optionConfig = statusConfig[statusOption as keyof typeof statusConfig];
              return (
                <button
                  key={statusOption}
                  onClick={() => handleStatusChange(statusOption as OrderStatus)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors"
                >
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${optionConfig.color}`}>
                    {optionConfig.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderStatusBadge;