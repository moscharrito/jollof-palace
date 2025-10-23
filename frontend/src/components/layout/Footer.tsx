import { Link } from 'react-router-dom';
import { 
  MapPinIcon, 
  PhoneIcon, 
  EnvelopeIcon,
  ClockIcon 
} from '@heroicons/react/24/outline';

interface FooterProps {
  className?: string;
}

const Footer = ({ className = '' }: FooterProps) => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className={`bg-gray-900 text-white ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">JP</span>
              </div>
              <span className="text-xl font-bold">Jollof Palace</span>
            </div>
            <p className="text-gray-400 text-sm">
              Authentic Nigerian cuisine delivered fresh to your door. 
              Experience the rich flavors of West Africa.
            </p>
          </div>
          
          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/menu" 
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Our Menu
                </Link>
              </li>
              <li>
                <Link 
                  to="/cart" 
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Your Cart
                </Link>
              </li>
              <li>
                <a 
                  href="#about" 
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  About Us
                </a>
              </li>
              <li>
                <a 
                  href="#contact" 
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
          
          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Info</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <MapPinIcon className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-400 text-sm">
                  123 Food Street<br />
                  New York, NY 10001
                </span>
              </li>
              <li className="flex items-center space-x-3">
                <PhoneIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                <a 
                  href="tel:+1234567890" 
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  +1 (234) 567-890
                </a>
              </li>
              <li className="flex items-center space-x-3">
                <EnvelopeIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                <a 
                  href="mailto:hello@jollofpalace.com" 
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  hello@jollofpalace.com
                </a>
              </li>
            </ul>
          </div>
          
          {/* Hours */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Hours</h3>
            <div className="space-y-2">
              <div className="flex items-start space-x-3">
                <ClockIcon className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="text-gray-400 text-sm">
                  <div className="font-medium text-white">Monday - Friday</div>
                  <div>11:00 AM - 10:00 PM</div>
                </div>
              </div>
              <div className="ml-8 text-gray-400 text-sm">
                <div className="font-medium text-white">Saturday - Sunday</div>
                <div>12:00 PM - 11:00 PM</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom section */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <p className="text-gray-400 text-sm">
              © {currentYear} Jollof Palace. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <a 
                href="#privacy" 
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                Privacy Policy
              </a>
              <a 
                href="#terms" 
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;