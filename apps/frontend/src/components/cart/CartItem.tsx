import { TrashIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/outline';
import { CartItem as CartItemType } from '../../contexts/CartContext';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  formatPrice: (priceInCents: number) => string;
}

const CartItem = ({ item, onUpdateQuantity, onRemove, formatPrice }: CartItemProps) => {
  return (
    <div className="card p-6">
      <div className="flex items-start space-x-4">
        {/* Image */}
        <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-white text-2xl">
            {item.name.includes('Jollof') ? '🍚' : 
             item.name.includes('Chicken') ? '🍗' : 
             item.name.includes('Fish') ? '🐟' :
             item.name.includes('Beef') ? '🥩' :
             item.name.includes('Goat') ? '🐐' : '🍌'}
          </span>
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {item.name}
          </h3>
          <p className="text-gray-600 text-sm mb-3">
            {formatPrice(item.price)} each
          </p>
          
          {/* Customizations */}
          {item.customizations && item.customizations.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-1">Customizations:</p>
              <p className="text-sm text-gray-600">
                {item.customizations.join(', ')}
              </p>
            </div>
          )}
          
          {/* Quantity Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                disabled={item.quantity <= 1}
                aria-label="Decrease quantity"
              >
                <MinusIcon className="w-4 h-4 text-gray-600" />
              </button>
              
              <span className="font-medium text-gray-900 min-w-[2rem] text-center">
                {item.quantity}
              </span>
              
              <button
                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Increase quantity"
              >
                <PlusIcon className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="font-semibold text-gray-900">
                {formatPrice(item.price * item.quantity)}
              </span>
              
              <button
                onClick={() => onRemove(item.id)}
                className="p-1 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                aria-label={`Remove ${item.name} from cart`}
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;