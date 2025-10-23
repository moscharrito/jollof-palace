import { Link } from 'react-router-dom';
import { ArrowRightIcon, StarIcon, QrCodeIcon } from '@heroicons/react/24/solid';
import { 
  ClockIcon, 
  TruckIcon, 
  ShieldCheckIcon,
  PhoneIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

const HomePage = () => {
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    // Generate QR code for the menu page
    const generateQRCode = async () => {
      if (qrCanvasRef.current) {
        try {
          const menuUrl = `${window.location.origin}/menu`;
          await QRCode.toCanvas(qrCanvasRef.current, menuUrl, {
            width: 200,
            margin: 2,
            color: {
              dark: '#DC2626', // Red color
              light: '#FFFFFF'
            }
          });
        } catch (error) {
          console.error('Error generating QR code:', error);
        }
      }
    };
    
    generateQRCode();
  }, []);

  const downloadQRCode = async () => {
    try {
      const menuUrl = `${window.location.origin}/menu`;
      const qrCodeDataUrl = await QRCode.toDataURL(menuUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#DC2626',
          light: '#FFFFFF'
        }
      });
      
      const link = document.createElement('a');
      link.href = qrCodeDataUrl;
      link.download = 'menu-qr-code.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading QR code:', error);
    }
  };

  const features = [
    {
      icon: ClockIcon,
      title: 'Fast Delivery',
      description: 'Fresh meals delivered in 30-45 minutes',
    },
    {
      icon: TruckIcon,
      title: 'Free Delivery',
      description: 'Free delivery on orders over $25',
    },
    {
      icon: ShieldCheckIcon,
      title: 'Quality Guaranteed',
      description: 'Fresh ingredients, authentic recipes',
    },
    {
      icon: PhoneIcon,
      title: '24/7 Support',
      description: 'Customer support whenever you need it',
    },
  ];
  
  const testimonials = [
    {
      name: 'Sarah Johnson',
      rating: 5,
      comment: 'The best Jollof rice I\'ve had outside of Nigeria! Authentic flavors and quick delivery.',
    },
    {
      name: 'Michael Chen',
      rating: 5,
      comment: 'Amazing pepper chicken and friendly service. Will definitely order again!',
    },
    {
      name: 'Aisha Patel',
      rating: 5,
      comment: 'Fresh ingredients and generous portions. The dodo is absolutely delicious!',
    },
  ];
  
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-red-600 to-red-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Text content */}
            <div className="text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
                Authentic Nigerian
                <span className="block text-yellow-300">Cuisine Delivered</span>
              </h1>
              <p className="text-xl sm:text-2xl mb-8 text-red-100 animate-fade-in">
                Experience the rich flavors of West Africa with our freshly prepared 
                Jollof rice, pepper proteins, and traditional sides.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-slide-in-up">
                <Link
                  to="/menu"
                  className="btn btn-lg bg-white text-red-600 hover:bg-gray-100 font-semibold inline-flex items-center justify-center"
                >
                  Order Now
                  <ArrowRightIcon className="ml-2 w-5 h-5" />
                </Link>
                <Link
                  to="/menu"
                  className="btn btn-lg border-2 border-white text-white hover:bg-white hover:text-red-600 font-semibold"
                >
                  View Menu
                </Link>
              </div>
            </div>
            
            {/* Right side - QR Code */}
            <div className="flex flex-col items-center justify-center">
              <div className="bg-white p-8 rounded-2xl shadow-2xl">
                <div className="text-center mb-4">
                  <QrCodeIcon className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Scan to Order</h3>
                  <p className="text-sm text-gray-600">Quick access to our menu</p>
                </div>
                <canvas 
                  ref={qrCanvasRef}
                  className="mx-auto border-2 border-gray-100 rounded-lg"
                />
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500">
                    Scan with your phone camera
                  </p>
                  <button
                    onClick={downloadQRCode}
                    className="inline-flex items-center text-sm text-red-600 hover:text-red-700 mt-2 transition-colors"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                    Download QR Code
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Jollof Palace?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We're committed to bringing you the most authentic Nigerian dining experience 
              with convenience and quality you can trust.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, _index) => (
              <div 
                key={feature.title}
                className="text-center p-6 rounded-xl hover:shadow-lg transition-shadow duration-300"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 text-red-600 rounded-full mb-4">
                  <feature.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Popular Items Preview */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Our Signature Dishes
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover our most loved dishes, prepared with authentic recipes 
              and the freshest ingredients.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Jollof Rice */}
            <div className="card card-hover">
              <div className="aspect-food bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                <span className="text-white text-6xl">🍚</span>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Signature Jollof Rice
                </h3>
                <p className="text-gray-600 mb-4">
                  Our famous Jollof rice cooked with aromatic spices and fresh tomatoes.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-red-600">$15.00</span>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon key={i} className="w-4 h-4 text-yellow-400" />
                    ))}
                    <span className="ml-1 text-sm text-gray-500">(4.9)</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Pepper Chicken */}
            <div className="card card-hover">
              <div className="aspect-food bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                <span className="text-white text-6xl">🍗</span>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Pepper Chicken
                </h3>
                <p className="text-gray-600 mb-4">
                  Tender chicken in our signature spicy pepper sauce with bell peppers.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-red-600">$25.00</span>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon key={i} className="w-4 h-4 text-yellow-400" />
                    ))}
                    <span className="ml-1 text-sm text-gray-500">(4.8)</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Dodo */}
            <div className="card card-hover">
              <div className="aspect-food bg-gradient-to-br from-green-400 to-yellow-500 flex items-center justify-center">
                <span className="text-white text-6xl">🍌</span>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Dodo (Fried Plantain)
                </h3>
                <p className="text-gray-600 mb-4">
                  Sweet fried plantains, perfectly caramelized and crispy outside.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-red-600">$8.00</span>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon key={i} className="w-4 h-4 text-yellow-400" />
                    ))}
                    <span className="ml-1 text-sm text-gray-500">(4.9)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <Link
              to="/menu"
              className="btn btn-primary btn-lg inline-flex items-center"
            >
              View Full Menu
              <ArrowRightIcon className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
      
      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              What Our Customers Say
            </h2>
            <p className="text-lg text-gray-600">
              Don't just take our word for it - hear from our satisfied customers!
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="card p-6">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="w-5 h-5 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">
                  "{testimonial.comment}"
                </p>
                <div className="font-semibold text-gray-900">
                  {testimonial.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-red-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Experience Authentic Nigerian Flavors?
          </h2>
          <p className="text-xl mb-8 text-red-100">
            Order now and get your favorite dishes delivered fresh to your door in 30-45 minutes.
          </p>
          <Link
            to="/menu"
            className="btn btn-lg bg-white text-red-600 hover:bg-gray-100 font-semibold inline-flex items-center"
          >
            Start Your Order
            <ArrowRightIcon className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;