import { useState, useRef, useEffect } from 'react';
import { 
  ChevronDownIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { OrderStatus } from '../../types/order';

interface BulkOrderActionsProps {
  selectedCount: number;
  onBulkUpdate: (status: OrderStatus) => void;
  onClear: () => void;
}

const BulkOrderActions = ({ selectedCount, onBulkUpdate, onClear }: BulkOrderActionsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const bulkActions = [
    {
      status: 'CONFIRMED' as OrderStatus,
      label: 'Mark as Confirmed',
      icon: CheckCircleIcon,
      color: 'text-blue-600'
    },
    {
      status: 'PREPARING' as OrderStatus,
      label: 'Mark as Preparing',
      icon: CogIcon,
      color: 'text-orange-600'
    },
    {
      status: 'READY' as OrderStatus,
      label: 'Mark as Ready',
      icon: CheckCircleIcon,
      color: 'text-green-600'
    },
    {
      status: 'COMPLETED' as OrderStatus,
      label: 'Mark as Completed',
      icon: CheckCircleIcon,
      color: 'text-gray-600'
    },
    {
      status: 'CANCELLED' as OrderStatus,
      label: 'Cancel Orders',
      icon: XCircleIcon,
      color: 'text-red-600'
    }
  ];

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

  const handleBulkAction = (status: OrderStatus) => {
    onBulkUpdate(status);
    setIsOpen(false);
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600">
        {selectedCount} order{selectedCount !== 1 ? 's' : ''} selected
      </span>
      
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
        >
          Bulk Actions
          <ChevronDownIcon className="ml-1 h-4 w-4" />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
            <div className="py-1">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
                Update {selectedCount} order{selectedCount !== 1 ? 's' : ''}:
              </div>
              {bulkActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.status}
                    onClick={() => handleBulkAction(action.status)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center space-x-2"
                  >
                    <Icon className={`h-4 w-4 ${action.color}`} />
                    <span className="text-gray-900">{action.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={onClear}
        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        Clear Selection
      </button>
    </div>
  );
};

export default BulkOrderActions;