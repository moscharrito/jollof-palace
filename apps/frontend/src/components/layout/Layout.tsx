import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

import Header from './Header';
import Footer from './Footer';
import MobileNavigation from './MobileNavigation';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  
  // Hide header/footer on certain pages for better UX
  const hideHeaderFooter = ['/checkout', '/payment/success', '/payment/cancel'].includes(location.pathname);
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      {!hideHeaderFooter && <Header />}
      
      {/* Main content */}
      <main className={`flex-1 ${!hideHeaderFooter ? 'pt-16 pb-20 sm:pb-0' : ''}`}>
        {children}
      </main>
      
      {/* Footer - hidden on mobile, shown on desktop */}
      {!hideHeaderFooter && (
        <Footer className="hidden sm:block" />
      )}
      
      {/* Mobile Navigation - only shown on mobile */}
      {!hideHeaderFooter && (
        <MobileNavigation className="sm:hidden" />
      )}
    </div>
  );
};

export default Layout;