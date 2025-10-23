import { useState, useEffect } from 'react';
import { XMarkIcon, MinusIcon, PlusIcon, ClockIcon } from '@heroicons/react/24/outline';
import { MenuItem } from '../../types/menu';
import { useCart } from '../../hooks/useCart';
import toast from 'react-hot-toast';

interface MenuItemModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const MenuItemModal = ({ item, isOpen, onClose }: MenuItemModalProps) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedCustomizations, setSelectedCustomizations] = useState<string[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const { addItem } = useCart();

  // Reset state when modal opens/closes or item changes
  useEffect(() => {
    if (isOpen && item) {
      setQuantity(1);
      setSelectedCustomizations([]);
      setSpecialInstructions('');
    }
  }, [isOpen, item]);

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const formatPrice = (priceInCents: number) => {
    return `$${(priceInCents / 100).toFixed(2)}`;
  };

  const getTotalPrice = () => {
    return item.price * quantity;
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= 10) {
      setQuantity(newQuantity);
    }
  };

  const handleCustomizationToggle = (customization: string) => {
    setSelectedCustomizations(prev => 
      prev.includes(customization)
        ? prev.filter(c => c !== customization)
        : [...prev, customization]
    );
  };

  const handleAddToCart = () => {
    try {
      addItem({
        id: `${item.id}-${Date.now()}`, // Generate unique cart item ID
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        imageUrl: item.imageUrl,
        quantity,
        customizations: selectedCustomizations.length > 0 ? selectedCustomizations : undefined,
      });

      toast.success(`Added ${quantity} ${item.name}${quantity > 1 ? 's' : ''} to cart`);
      onClose();
    } catch (error) {
      toast.error('Failed to add item to cart');
    }
  };

  // Mock customization options based on item type
  const getCustomizationOptions = (item: MenuItem): string[] => {
    const options: string[] = [];
    
    if (item.name.toLowerCase().includes('jollof')) {
      options.push('Extra Spicy', 'Mild Spice', 'No Onions', 'Extra Vegetables');
    }
    
    if (item.name.toLowerCase().includes('chicken')) {
      options.push('Extra Spicy', 'Mild Spice', 'Well Done', 'Medium Spice');
    }
    
    if (item.name.toLowerCase().includes('plantain') || item.name.toLowerCase().includes('dodo')) {
      options.push('Extra Sweet', 'Less Sweet', 'Crispy', 'Soft');
    }
    
    return options;
  };

  const customizationOptions = getCustomizationOptions(item);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {item.name}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close modal"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {/* Image */}
            <div className="aspect-video bg-gradient-to-br from-red-400 to-orange-500 rounded-lg flex items-center justify-center mb-6">
              <span className="text-white text-8xl">
                {item.category === 'MAIN' ? '🍚' : 
                 item.name.toLowerCase().includes('chicken') ? '🍗' : 
                 item.name.toLowerCase().includes('plantain') ? '🍌' : '🍽️'}
              </span>
            </div>

            {/* Description */}
            <div className="mb-6">
              <p className="text-gray-600 text-base leading-relaxed">
                {item.description}
              </p>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <ClockIcon className="w-4 h-4 text-gray-500 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Prep Time</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">
                  {item.preparationTime} minutes
                </span>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Category</div>
                <span className="text-lg font-semibold text-gray-900 capitalize">
                  {item.category}
                </span>
              </div>
            </div>

            {/* Ingredients */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Ingredients</h3>
              <div className="flex flex-wrap gap-2">
                {item.ingredients.map((ingredient, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                  >
                    {ingredient}
                  </span>
                ))}
              </div>
            </div>

            {/* Nutritional Info */}
            {(item.calories || item.protein || item.carbs) && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Nutritional Information</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {item.calories && (
                    <div className="text-center bg-gray-50 rounded-lg p-3">
                      <div className="text-lg font-semibold text-gray-900">
                        {item.calories}
                      </div>
                      <div className="text-xs text-gray-600">Calories</div>
                    </div>
                  )}
                  {item.protein && (
                    <div className="text-center bg-gray-50 rounded-lg p-3">
                      <div className="text-lg font-semibold text-gray-900">
                        {item.protein}g
                      </div>
                      <div className="text-xs text-gray-600">Protein</div>
                    </div>
                  )}
                  {item.carbs && (
                    <div className="text-center bg-gray-50 rounded-lg p-3">
                      <div className="text-lg font-semibold text-gray-900">
                        {item.carbs}g
                      </div>
                      <div className="text-xs text-gray-600">Carbs</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Customizations */}
            {customizationOptions.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Customizations</h3>
                <div className="space-y-2">
                  {customizationOptions.map((option) => (
                    <label
                      key={option}
                      className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCustomizations.includes(option)}
                        onChange={() => handleCustomizationToggle(option)}
                        className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                      />
                      <span className="ml-3 text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Special Instructions */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Instructions (Optional)
              </label>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="Any special requests or dietary requirements..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                maxLength={200}
              />
              <div className="text-xs text-gray-500 mt-1">
                {specialInstructions.length}/200 characters
              </div>
            </div>

            {/* Quantity and Add to Cart */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-700">Quantity:</span>
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      onClick={() => handleQuantityChange(quantity - 1)}
                      disabled={quantity <= 1}
                      className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <MinusIcon className="w-4 h-4" />
                    </button>
                    <span className="px-4 py-2 font-medium">{quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(quantity + 1)}
                      disabled={quantity >= 10}
                      className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <PlusIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm text-gray-600">Total</div>
                  <div className="text-2xl font-bold text-red-600">
                    {formatPrice(getTotalPrice())}
                  </div>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={!item.isAvailable}
                className="btn btn-primary w-full text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {item.isAvailable ? 'Add to Cart' : 'Currently Unavailable'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuItemModal;