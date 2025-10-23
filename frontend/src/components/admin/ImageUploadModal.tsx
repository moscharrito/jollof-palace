import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { XMarkIcon, PhotoIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { MenuItem } from '../../types/menu';
import { menuService } from '../../services/menuService';

interface ImageUploadModalProps {
  item: MenuItem;
  onClose: () => void;
  onSave: () => void;
}

const ImageUploadModal = ({ item, onClose, onSave }: ImageUploadModalProps) => {
  const [imageUrl, setImageUrl] = useState(item.imageUrl);
  const [loading, setLoading] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!imageUrl.trim()) {
      toast.error('Please enter an image URL');
      return;
    }

    if (imageUrl === item.imageUrl) {
      toast.error('New image URL must be different from current image');
      return;
    }

    setLoading(true);

    try {
      await menuService.updateMenuItem(item.id, {
        imageUrl: imageUrl.trim(),
      });

      toast.success('Image updated successfully');
      onSave();
    } catch (error) {
      toast.error('Failed to update image');
      console.error('Error updating image:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageError = () => {
    setPreviewError(true);
  };

  const handleImageLoad = () => {
    setPreviewError(false);
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const suggestedImages = [
    'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop',
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <PhotoIcon className="h-6 w-6 text-red-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Update Image</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Item Info */}
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-3">
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-12 h-12 rounded-lg object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/48x48?text=No+Image';
                }}
              />
              <div>
                <h3 className="font-medium text-gray-900">{item.name}</h3>
                <p className="text-sm text-gray-500">{item.category}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Image */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Current Image</h3>
              <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Current+Image+Not+Found';
                  }}
                />
              </div>
            </div>

            {/* New Image URL Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Image URL
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="https://example.com/image.jpg"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter a direct URL to an image (JPG, PNG, WebP)
              </p>
            </div>

            {/* Image Preview */}
            {imageUrl && isValidUrl(imageUrl) && imageUrl !== item.imageUrl && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Preview</h3>
                <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                  {previewError ? (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <PhotoIcon className="h-12 w-12 mx-auto mb-2" />
                        <p className="text-sm">Failed to load image</p>
                        <p className="text-xs">Please check the URL</p>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                      onLoad={handleImageLoad}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Suggested Images */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Suggested Images</h3>
              <p className="text-xs text-gray-500 mb-3">
                Click on any image below to use it
              </p>
              <div className="grid grid-cols-3 gap-2">
                {suggestedImages.map((url, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setImageUrl(url)}
                    className={`relative h-24 bg-gray-100 rounded-lg overflow-hidden hover:ring-2 hover:ring-red-500 transition-all ${
                      imageUrl === url ? 'ring-2 ring-red-500' : ''
                    }`}
                  >
                    <img
                      src={url}
                      alt={`Suggestion ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100x100?text=Error';
                      }}
                    />
                    {imageUrl === url && (
                      <div className="absolute inset-0 bg-red-500 bg-opacity-20 flex items-center justify-center">
                        <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Upload Instructions */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start">
                <CloudArrowUpIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Image Upload Tips:</p>
                  <ul className="text-xs space-y-1">
                    <li>• Use high-quality images (at least 400x300 pixels)</li>
                    <li>• Ensure the image URL is publicly accessible</li>
                    <li>• Supported formats: JPG, PNG, WebP</li>
                    <li>• For best results, use images with a 4:3 aspect ratio</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !imageUrl.trim() || imageUrl === item.imageUrl || previewError}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update Image'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ImageUploadModal;