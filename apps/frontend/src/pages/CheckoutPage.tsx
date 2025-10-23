import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

import { useCart } from '../hooks/useCart';
import { CustomerInfo, CreateOrderRequest } from '@food-ordering/shared';
import MultiStepCheckout from '../components/checkout/MultiStepCheckout';
import api from '../services/api';

const CheckoutPage = () => {
  const { items, getSubtotal, getTax, clearCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  const subtotal = getSubtotal();
  const tax = getTax();

  const handleSubmitOrder = async (orderData: {
    customerInfo: CustomerInfo;
    orderType: 'pickup' | 'delivery';
    specialInstructions: string;
    items: typeof items;
    total: number;
  }) => {
    setIsLoading(true);
    
    try {
      // Prepare order request
      const orderRequest: CreateOrderRequest = {
        customerInfo: orderData.customerInfo,
        items: orderData.items.map(item => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          customizations: item.customizations,
        })),
        orderType: orderData.orderType,
        specialInstructions: orderData.specialInstructions,
      };

      // Create order
      const response = await api.post('/orders', orderRequest);
      const order = response.data.data;

      // Clear cart
      clearCart();

      // Show success message
      toast.success('Order placed successfully!');

      // Redirect to payment page with order ID
      navigate(`/payment/${order.id}`, { 
        state: { 
          order,
          returnUrl: `/order-tracking/${order.id}`
        }
      });
      
    } catch (error: any) {
      console.error('Error creating order:', error);
      
      // Show error message
      const errorMessage = error.response?.data?.message || 'Failed to place order. Please try again.';
      toast.error(errorMessage);
      
      // If it's a validation error, show specific field errors
      if (error.response?.data?.error?.details) {
        error.response.data.error.details.forEach((detail: any) => {
          toast.error(`${detail.field}: ${detail.message}`);
        });
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            No items in cart
          </h2>
          <p className="text-gray-600 mb-8">
            Please add items to your cart before proceeding to checkout.
          </p>
          <Link to="/menu" className="btn btn-primary">
            Browse Menu
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/cart"
            className="inline-flex items-center text-red-600 hover:text-red-700 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Cart
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
        </div>
        
        {/* Multi-Step Checkout */}
        <MultiStepCheckout
          items={items}
          subtotal={subtotal}
          tax={tax}
          onSubmitOrder={handleSubmitOrder}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default CheckoutPage;