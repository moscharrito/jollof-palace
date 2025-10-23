import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { MenuItem } from '../types/menu';

import MenuItemCard from '../components/menu/MenuItemCard';
import MenuItemModal from '../components/menu/MenuItemModal';

const MenuPage = () => {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Check if this is a quick order flow from QR landing
  const isQuickOrder = searchParams.get('quickOrder') === 'true';
  
  // Hardcoded menu items for simplicity
  const menuItems: MenuItem[] = [
    {
      id: '1',
      name: 'Jollof Rice with Chicken',
      description: 'Our signature Jollof rice cooked with aromatic spices, served with tender grilled chicken',
      price: 1500, // $15.00 in cents
      category: 'MAIN',
      imageUrl: '/images/jollof-chicken.jpg',
      isAvailable: true,
      preparationTime: 25,
      ingredients: ['Basmati rice', 'Chicken', 'Tomatoes', 'Onions', 'Bell peppers', 'Spices'],
      calories: 650,
      protein: 35,
      carbs: 75,
      fat: 18,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'Pepper Beef',
      description: 'Tender beef strips in our signature spicy pepper sauce with bell peppers and onions',
      price: 1800, // $18.00 in cents
      category: 'MAIN',
      imageUrl: '/images/pepper-beef.jpg',
      isAvailable: true,
      preparationTime: 30,
      ingredients: ['Beef', 'Bell peppers', 'Onions', 'Scotch bonnet peppers', 'Ginger', 'Garlic'],
      calories: 580,
      protein: 42,
      carbs: 12,
      fat: 35,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '3',
      name: 'Dodo (Fried Plantain)',
      description: 'Sweet fried plantains, perfectly caramelized and crispy on the outside',
      price: 800, // $8.00 in cents
      category: 'SIDE',
      imageUrl: '/images/dodo.jpg',
      isAvailable: true,
      preparationTime: 15,
      ingredients: ['Ripe plantains', 'Palm oil'],
      calories: 220,
      carbs: 45,
      fat: 8,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '4',
      name: 'Jollof Rice with Fish',
      description: 'Traditional Jollof rice served with seasoned grilled fish',
      price: 1600, // $16.00 in cents
      category: 'MAIN',
      imageUrl: '/images/jollof-fish.jpg',
      isAvailable: true,
      preparationTime: 25,
      ingredients: ['Basmati rice', 'Fresh fish', 'Tomatoes', 'Onions', 'Spices'],
      calories: 620,
      protein: 38,
      carbs: 72,
      fat: 15,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '5',
      name: 'Pepper Chicken',
      description: 'Juicy chicken pieces in spicy pepper sauce with vegetables',
      price: 1700, // $17.00 in cents
      category: 'MAIN',
      imageUrl: '/images/pepper-chicken.jpg',
      isAvailable: true,
      preparationTime: 28,
      ingredients: ['Chicken', 'Bell peppers', 'Onions', 'Tomatoes', 'Spices'],
      calories: 540,
      protein: 40,
      carbs: 8,
      fat: 32,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '6',
      name: 'Moi Moi',
      description: 'Steamed bean pudding with eggs and fish, a Nigerian delicacy',
      price: 600, // $6.00 in cents
      category: 'SIDE',
      imageUrl: '/images/moi-moi.jpg',
      isAvailable: true,
      preparationTime: 20,
      ingredients: ['Black-eyed peas', 'Eggs', 'Fish', 'Onions', 'Peppers'],
      calories: 180,
      protein: 12,
      carbs: 20,
      fat: 6,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '7',
      name: 'Jollof Combo Special',
      description: 'Jollof rice with chicken, beef, and plantain - the ultimate combo',
      price: 2200, // $22.00 in cents
      category: 'COMBO',
      imageUrl: '/images/jollof-combo.jpg',
      isAvailable: true,
      preparationTime: 35,
      ingredients: ['Basmati rice', 'Chicken', 'Beef', 'Plantains', 'Vegetables', 'Spices'],
      calories: 850,
      protein: 45,
      carbs: 85,
      fat: 28,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '8',
      name: 'Suya Spiced Rice',
      description: 'Fragrant rice with suya spices, served with grilled meat',
      price: 1650, // $16.50 in cents
      category: 'MAIN',
      imageUrl: '/images/suya-rice.jpg',
      isAvailable: true,
      preparationTime: 30,
      ingredients: ['Rice', 'Suya spices', 'Beef', 'Onions', 'Tomatoes'],
      calories: 680,
      protein: 35,
      carbs: 78,
      fat: 22,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];
  
  const categories = [
    { id: 'ALL', name: 'All Items' },
    { id: 'MAIN', name: 'Main Dishes' },
    { id: 'SIDE', name: 'Sides' },
    { id: 'COMBO', name: 'Combos' },
  ];
  
  // Filter items based on search and category
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.ingredients.some(ingredient => 
                             ingredient.toLowerCase().includes(searchTerm.toLowerCase())
                           );
      const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
      
      return matchesSearch && matchesCategory && item.isAvailable;
    });
  }, [menuItems, searchTerm, selectedCategory]);

  const handleViewDetails = (item: MenuItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };
  
  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                {isQuickOrder ? 'Quick Order - Popular Items' : 'Our Menu'}
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                {isQuickOrder 
                  ? 'Our most popular dishes, ready to order with just a few taps.'
                  : 'Discover authentic Nigerian flavors made with fresh ingredients and traditional recipes.'
                }
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {filteredItems.length} of {menuItems.length} items available
              </p>
            </div>
          </div>
        </div>
      
      {/* Filters */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
            
            {/* Category Filter */}
            <div className="relative">
              <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input pl-10 pr-8 appearance-none bg-white cursor-pointer min-w-[150px]"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Menu Items */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm || selectedCategory !== 'ALL' ? 'No items found' : 'No menu items available'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedCategory !== 'ALL' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Our menu is currently being updated. Please check back soon.'
              }
            </p>
            {(searchTerm || selectedCategory !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('ALL');
                }}
                className="btn btn-outline"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                onViewDetails={handleViewDetails}
                showQuickAdd={!isQuickOrder}
              />
            ))}
          </div>
        )}
      </div>
    </div>

    {/* Menu Item Detail Modal */}
    <MenuItemModal
      item={selectedItem}
      isOpen={isModalOpen}
      onClose={handleCloseModal}
    />
  </>
  );
};

export default MenuPage;