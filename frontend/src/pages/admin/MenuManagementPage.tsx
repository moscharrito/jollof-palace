import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  ChartBarIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import AdminLayout from '../../components/admin/AdminLayout';
import { MenuItem } from '../../types/menu';
import { menuService } from '../../services/menuService';
import MenuItemModal from '../../components/admin/MenuItemModal';
import MenuAnalyticsModal from '../../components/admin/MenuAnalyticsModal';
import PriceUpdateModal from '../../components/admin/PriceUpdateModal';
import ImageUploadModal from '../../components/admin/ImageUploadModal';

const MenuManagementPage = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showItemModal, setShowItemModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'MAIN', label: 'Main Dishes' },
    { value: 'SIDE', label: 'Side Dishes' },
    { value: 'COMBO', label: 'Combo Meals' },
  ];

  useEffect(() => {
    loadMenuItems();
  }, []);

  const loadMenuItems = async () => {
    try {
      setLoading(true);
      const items = await menuService.getMenuItems();
      setMenuItems(items);
    } catch (error) {
      toast.error('Failed to load menu items');
      console.error('Error loading menu items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateItem = () => {
    setSelectedItem(null);
    setIsEditing(false);
    setShowItemModal(true);
  };

  const handleEditItem = (item: MenuItem) => {
    setSelectedItem(item);
    setIsEditing(true);
    setShowItemModal(true);
  };

  const handleDeleteItem = async (item: MenuItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return;
    }

    try {
      await menuService.deleteMenuItem(item.id);
      toast.success('Menu item deleted successfully');
      loadMenuItems();
    } catch (error) {
      toast.error('Failed to delete menu item');
      console.error('Error deleting menu item:', error);
    }
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      await menuService.toggleMenuItemAvailability(item.id);
      toast.success(
        `${item.name} ${item.isAvailable ? 'disabled' : 'enabled'} successfully`
      );
      loadMenuItems();
    } catch (error) {
      toast.error('Failed to update item availability');
      console.error('Error toggling availability:', error);
    }
  };

  const handleUpdatePrice = (item: MenuItem) => {
    setSelectedItem(item);
    setShowPriceModal(true);
  };

  const handleUpdateImage = (item: MenuItem) => {
    setSelectedItem(item);
    setShowImageModal(true);
  };

  const handleItemSaved = () => {
    setShowItemModal(false);
    loadMenuItems();
  };

  const handlePriceUpdated = () => {
    setShowPriceModal(false);
    loadMenuItems();
  };

  const handleImageUpdated = () => {
    setShowImageModal(false);
    loadMenuItems();
  };

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const formatPrice = (price: number) => {
    return `$${(price / 100).toFixed(2)}`;
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'MAIN':
        return 'bg-blue-100 text-blue-800';
      case 'SIDE':
        return 'bg-green-100 text-green-800';
      case 'COMBO':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your restaurant's menu items, pricing, and availability
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <button
              onClick={() => setShowAnalyticsModal(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <ChartBarIcon className="h-4 w-4 mr-2" />
              Analytics
            </button>
            <button
              onClick={handleCreateItem}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Item
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="relative">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-2 right-2 flex space-x-1">
                  <button
                    onClick={() => handleUpdateImage(item)}
                    className="p-1 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70"
                    title="Update Image"
                  >
                    <PhotoIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleToggleAvailability(item)}
                    className={`p-1 rounded-full ${
                      item.isAvailable
                        ? 'bg-green-500 hover:bg-green-600'
                        : 'bg-red-500 hover:bg-red-600'
                    } text-white`}
                    title={item.isAvailable ? 'Disable Item' : 'Enable Item'}
                  >
                    {item.isAvailable ? (
                      <EyeIcon className="h-4 w-4" />
                    ) : (
                      <EyeSlashIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {!item.isAvailable && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <span className="text-white font-semibold">Unavailable</span>
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryBadgeColor(
                      item.category
                    )}`}
                  >
                    {item.category}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {item.description}
                </p>

                <div className="flex items-center justify-between mb-4">
                  <span className="text-xl font-bold text-gray-900">
                    {formatPrice(item.price)}
                  </span>
                  <span className="text-sm text-gray-500">
                    {item.preparationTime} min
                  </span>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditItem(item)}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleUpdatePrice(item)}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Price
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item)}
                    className="inline-flex items-center justify-center px-3 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              {searchTerm || selectedCategory !== 'all'
                ? 'No menu items match your filters'
                : 'No menu items found'}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showItemModal && (
        <MenuItemModal
          item={selectedItem}
          isEditing={isEditing}
          onClose={() => setShowItemModal(false)}
          onSave={handleItemSaved}
        />
      )}

      {showAnalyticsModal && (
        <MenuAnalyticsModal
          onClose={() => setShowAnalyticsModal(false)}
        />
      )}

      {showPriceModal && selectedItem && (
        <PriceUpdateModal
          item={selectedItem}
          onClose={() => setShowPriceModal(false)}
          onSave={handlePriceUpdated}
        />
      )}

      {showImageModal && selectedItem && (
        <ImageUploadModal
          item={selectedItem}
          onClose={() => setShowImageModal(false)}
          onSave={handleImageUpdated}
        />
      )}
    </AdminLayout>
  );
};

export default MenuManagementPage;