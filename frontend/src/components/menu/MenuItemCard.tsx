import { ClockIcon, EyeIcon } from '@heroicons/react/24/outline';
import { MenuItem } from '../../types/menu';
import { useCart } from '../../hooks/useCart';
import toast from 'react-hot-toast';

interface MenuItemCardProps {
  item: MenuItem;
  onViewDetails: (item: MenuItem) => void;
  showQuickAdd?: boolean;
}

const MenuItemCard = ({ item, onViewDetails, showQuickAdd = true }: MenuItemCardProps) => {
  const { addItem } = useCart();

  const formatPrice = (priceInCents: number) => {
    return `$${(priceInCents / 100).toFixed(2)}`;
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!item.isAvailable) {
      toast.error('This item is currently unavailable');
      return;
    }

    try {
      addItem({
        id: `${item.id}-${Date.now()}`, // Generate unique cart item ID
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        imageUrl: item.imageUrl,
        quantity: 1,
      });
      toast.success(`Added ${item.name} to cart`);
    } catch (error) {
      toast.error('Failed to add item to cart');
    }
  };

  const handleViewDetails = () => {
    onViewDetails(item);
  };

  const getItemEmoji = (item: MenuItem) => {
    if (item.category === 'MAIN') return '🍚';
    if (item.name.toLowerCase().includes('chicken')) return '🍗';
    if (item.name.toLowerCase().includes('beef')) return '🥩';
    if (item.name.toLowerCase().includes('goat')) return '🍖';
    if (item.name.toLowerCase().includes('fish')) return '🐟';
    if (item.name.toLowerCase().includes('plantain') || item.name.toLowerCase().includes('dodo')) return '🍌';
    return '🍽️';
  };

  return (
    <div 
      className={`card card-hover cursor-pointer transition-all duration-200 ${
        !item.isAvailable ? 'opacity-75' : ''
      }`}
      onClick={handleViewDetails}
    >
      {/* Image */}
      <div className="relative aspect-food bg-gradient-to-br from-red-400 to-orange-500 flex items-center justify-center">
        <span className="text-white text-6xl">
          {getItemEmoji(item)}
        </span>
        
        {/* Availability Badge */}
        {!item.isAvailable && (
          <div className="absolute top-2 right-2">
            <span className="badge badge-error text-xs">
              Unavailable
            </span>
          </div>
        )}

        {/* View Details Button */}
        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetails();
            }}
            className="p-2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full shadow-sm transition-all"
            aria-label="View details"
          >
            <EyeIcon className="w-4 h-4 text-gray-700" />
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-xl font-semibold text-gray-900 flex-1 line-clamp-2">
            {item.name}
          </h3>
          <span className="text-2xl font-bold text-red-600 ml-4 flex-shrink-0">
            {formatPrice(item.price)}
          </span>
        </div>
        
        <p className="text-gray-600 mb-4 text-sm line-clamp-3">
          {item.description}
        </p>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-sm text-gray-500">
            <ClockIcon className="w-4 h-4 mr-1" />
            <span>{item.preparationTime} min</span>
          </div>
          <span className={`badge ${item.isAvailable ? 'badge-success' : 'badge-error'}`}>
            {item.isAvailable ? 'Available' : 'Unavailable'}
          </span>
        </div>
        
        {/* Ingredients Preview */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-1">Ingredients:</p>
          <p className="text-sm text-gray-600 line-clamp-1">
            {item.ingredients.slice(0, 3).join(', ')}
            {item.ingredients.length > 3 && '...'}
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          {showQuickAdd && (
            <button
              onClick={handleQuickAdd}
              disabled={!item.isAvailable}
              className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Quick Add
            </button>
          )}
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetails();
            }}
            className={`btn btn-outline ${showQuickAdd ? 'flex-shrink-0' : 'flex-1'}`}
          >
            {showQuickAdd ? 'Details' : 'View Details'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuItemCard;