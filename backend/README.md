# Jollof Palace Backend

A Node.js + Express + Prisma API for the Jollof Palace food ordering system.

## Setup

```bash
npm install
cp .env.example .env
# Update .env with your database URL and other secrets
npm run db:migrate
npm run db:seed
npm run dev
```

## Build

```bash
npm run build
npm start
```

## Environment Variables

Copy `.env.example` to `.env` and update the values:

```
DATABASE_URL=postgresql://username:password@hostname:port/database_name
JWT_SECRET=your_super_secure_jwt_secret
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
CORS_ORIGIN=https://your-frontend-url.vercel.app
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
```

## Deployment

This project is configured for Render deployment:

1. Create PostgreSQL database on Render
2. Create Web Service on Render
3. Set environment variables
4. Deploy!

## Database Commands

```bash
# Development
npm run db:migrate
npm run db:seed

# Production
npm run db:migrate:deploy
```

## Features

- RESTful API
- JWT Authentication
- Real-time WebSocket connections
- Payment processing (Stripe, PayPal)
- SMS notifications (Twilio)
- File uploads and PDF generation
- Analytics and reporting
- Admin management

## Tech Stack

- Node.js
- Express.js
- Prisma ORM
- PostgreSQL
- Socket.io
- JWT
- Stripe & PayPal APIs
- Twilio SMS
- Winston Logging