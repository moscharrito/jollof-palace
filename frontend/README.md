# Jollof Palace Frontend

A modern React-based frontend application for the Jollof Palace restaurant ordering system.

## Features

- 🍽️ **Menu Display** - Browse restaurant menu with categories and detailed item information
- 🛒 **Shopping Cart** - Add items to cart with quantity management
- 📱 **QR Code Ordering** - Scan QR codes to access table-specific ordering
- 💳 **Payment Integration** - Support for multiple payment methods including Apple Pay, Google Pay
- 📊 **Admin Dashboard** - Restaurant management interface for orders and menu
- 🔄 **Real-time Updates** - Live order status tracking
- 📱 **PWA Support** - Progressive Web App with offline capabilities
- 🎨 **Responsive Design** - Works seamlessly on desktop and mobile devices

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API communication
- **React Query** for data fetching and caching
- **Heroicons** for UI icons
- **Vitest** for testing

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository and navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env.local
```

4. Update environment variables in `.env.local`:
```env
VITE_API_BASE_URL=http://localhost:3001
VITE_PAYSTACK_PUBLIC_KEY=your_paystack_public_key
VITE_GOOGLE_PAY_MERCHANT_ID=your_google_pay_merchant_id
```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

Build the application:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

### Testing

Run tests:
```bash
npm run test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Project Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── admin/        # Admin-specific components
│   │   ├── ui/           # Generic UI components
│   │   └── layout/       # Layout components
│   ├── pages/            # Page components
│   │   ├── admin/        # Admin pages
│   │   └── customer/     # Customer pages
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API services
│   ├── contexts/         # React contexts
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── constants/        # Application constants
│   └── styles/           # Global styles
├── tests/                # Test files
└── dist/                 # Production build output
```

## Key Components

### Customer Interface
- **HomePage** - Landing page with restaurant information
- **MenuPage** - Browse and filter menu items
- **CartPage** - Review and modify cart items
- **CheckoutPage** - Customer information and order placement
- **PaymentPage** - Payment processing interface
- **OrderTrackingPage** - Real-time order status updates

### Admin Interface
- **AdminDashboardPage** - Overview of restaurant operations
- **OrderManagementPage** - Manage incoming orders
- **MenuManagementPage** - Add, edit, and manage menu items
- **AdminLoginPage** - Secure admin authentication

## API Integration

The frontend communicates with the backend API using Axios. All API calls are centralized in the `services/` directory:

- `api.ts` - Base API configuration
- `menuService.ts` - Menu-related API calls
- `orderService.ts` - Order management API calls
- `paymentService.ts` - Payment processing API calls
- `adminService.ts` - Admin-specific API calls

## State Management

- **React Context** for global state (Cart, Auth)
- **React Query** for server state management
- **Local Storage** for persistence

## Styling

The application uses Tailwind CSS for styling with a custom design system:

- Consistent color palette
- Responsive breakpoints
- Custom components
- Dark mode support (planned)

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

1. Build the application:
```bash
npm run build
```

2. Deploy the `dist/` folder to your hosting provider

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_BASE_URL` | Backend API URL | Yes |
| `VITE_PAYSTACK_PUBLIC_KEY` | Paystack public key for payments | Yes |
| `VITE_GOOGLE_PAY_MERCHANT_ID` | Google Pay merchant ID | No |
| `VITE_APPLE_PAY_MERCHANT_ID` | Apple Pay merchant ID | No |

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes and add tests
4. Commit your changes: `git commit -am 'Add new feature'`
5. Push to the branch: `git push origin feature/new-feature`
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.