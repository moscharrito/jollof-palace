# Jollof Palace Backend

A robust Node.js backend API for the Jollof Palace restaurant ordering system.

## Features

- 🔐 **Authentication & Authorization** - JWT-based admin authentication
- 🍽️ **Menu Management** - CRUD operations for menu items
- 📋 **Order Processing** - Complete order lifecycle management
- 💳 **Payment Integration** - Paystack payment processing
- 📊 **Analytics & Reporting** - Sales and order analytics
- 📱 **Real-time Updates** - WebSocket support for live order updates
- 🗄️ **Database Management** - PostgreSQL with Prisma ORM
- 📧 **Notifications** - SMS notifications for order updates
- 🔒 **Security** - Rate limiting, CORS, input validation

## Tech Stack

- **Node.js** with TypeScript
- **Express.js** for REST API
- **Prisma** as ORM
- **PostgreSQL** database
- **JWT** for authentication
- **Paystack** for payment processing
- **Socket.io** for real-time communication
- **Jest** for testing
- **Winston** for logging

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. Clone the repository and navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update environment variables in `.env`:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/jollof_palace"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# Paystack
PAYSTACK_SECRET_KEY="your-paystack-secret-key"
PAYSTACK_PUBLIC_KEY="your-paystack-public-key"

# Server
PORT=3001
NODE_ENV="development"

# CORS
FRONTEND_URL="http://localhost:5173"

# SMS (Optional)
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="your-twilio-phone-number"
```

5. Set up the database:
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed the database with initial data
npm run seed
```

### Development

Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3001`

### Building for Production

Build the application:
```bash
npm run build
```

Start the production server:
```bash
npm start
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
backend/
├── src/
│   ├── controllers/       # Request handlers
│   ├── services/         # Business logic
│   ├── middleware/       # Express middleware
│   ├── routes/           # API routes
│   ├── models/           # Database models (Prisma)
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── constants/        # Application constants
│   ├── config/           # Configuration files
│   ├── scripts/          # Database scripts
│   └── tests/            # Test files
├── prisma/
│   ├── schema.prisma     # Database schema
│   ├── migrations/       # Database migrations
│   └── seed.ts          # Database seeding
├── dist/                 # Compiled JavaScript
└── logs/                 # Application logs
```

## API Endpoints

### Public Endpoints

#### Menu
- `GET /api/menu` - Get all menu items
- `GET /api/menu/:id` - Get menu item by ID

#### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order by ID
- `GET /api/orders/track/:orderNumber` - Track order by number

#### Payments
- `POST /api/payments/initialize` - Initialize payment
- `POST /api/payments/verify` - Verify payment
- `POST /api/payments/webhook` - Paystack webhook

### Admin Endpoints (Requires Authentication)

#### Authentication
- `POST /api/admin/auth/login` - Admin login
- `POST /api/admin/auth/refresh` - Refresh JWT token
- `POST /api/admin/auth/logout` - Admin logout

#### Menu Management
- `POST /api/admin/menu` - Create menu item
- `PUT /api/admin/menu/:id` - Update menu item
- `DELETE /api/admin/menu/:id` - Delete menu item
- `PATCH /api/admin/menu/:id/availability` - Toggle availability

#### Order Management
- `GET /api/admin/orders` - Get all orders (with pagination)
- `PUT /api/admin/orders/:id/status` - Update order status
- `GET /api/admin/orders/stats` - Get order statistics

#### Analytics
- `GET /api/admin/analytics/sales` - Sales analytics
- `GET /api/admin/analytics/orders` - Order analytics
- `GET /api/admin/analytics/customers` - Customer analytics

## Database Schema

### Core Models

- **MenuItem** - Restaurant menu items
- **Order** - Customer orders
- **OrderItem** - Individual items within an order
- **Payment** - Payment transactions
- **AdminUser** - Admin user accounts

### Relationships

- Order → OrderItems (One-to-Many)
- OrderItem → MenuItem (Many-to-One)
- Order → Payment (One-to-One)

## Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. Admin logs in with email/password
2. Server returns JWT token
3. Client includes token in Authorization header
4. Server validates token for protected routes

## Payment Processing

Integration with Paystack for payment processing:

1. Initialize payment with order details
2. Redirect customer to Paystack checkout
3. Handle payment verification
4. Update order status based on payment result

## Real-time Features

WebSocket integration for real-time updates:

- Order status changes
- New order notifications
- Kitchen display updates

## Error Handling

Centralized error handling with:

- Custom error classes
- Structured error responses
- Request ID tracking
- Comprehensive logging

## Security Features

- **Rate Limiting** - Prevent API abuse
- **CORS** - Cross-origin request security
- **Input Validation** - Joi schema validation
- **SQL Injection Protection** - Prisma ORM
- **JWT Security** - Secure token handling

## Logging

Winston-based logging with:

- Different log levels (error, warn, info, debug)
- File and console outputs
- Request/response logging
- Error tracking

## Deployment

### Docker (Recommended)

1. Build the Docker image:
```bash
docker build -t jollof-palace-backend .
```

2. Run with Docker Compose:
```bash
docker-compose up -d
```

### Manual Deployment

1. Set up PostgreSQL database
2. Configure environment variables
3. Build the application:
```bash
npm run build
```
4. Run database migrations:
```bash
npx prisma migrate deploy
```
5. Start the server:
```bash
npm start
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `JWT_EXPIRES_IN` | JWT expiration time | Yes |
| `PAYSTACK_SECRET_KEY` | Paystack secret key | Yes |
| `PAYSTACK_PUBLIC_KEY` | Paystack public key | Yes |
| `PORT` | Server port | No (default: 3001) |
| `NODE_ENV` | Environment (development/production) | Yes |
| `FRONTEND_URL` | Frontend URL for CORS | Yes |
| `TWILIO_ACCOUNT_SID` | Twilio account SID | No |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | No |
| `TWILIO_PHONE_NUMBER` | Twilio phone number | No |

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes and add tests
4. Run tests: `npm run test`
5. Commit your changes: `git commit -am 'Add new feature'`
6. Push to the branch: `git push origin feature/new-feature`
7. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.