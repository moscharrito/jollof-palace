# Jollof Palace Frontend

A React + TypeScript + Vite application for the Jollof Palace food ordering system.

## Setup

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Environment Variables

Copy `.env.example` to `.env` and update the values:

```
VITE_API_URL=https://your-backend-url.onrender.com/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key
VITE_PAYPAL_CLIENT_ID=your_paypal_client_id
VITE_APP_NAME=Jollof Palace
VITE_APP_DESCRIPTION=Authentic Jollof Rice & Pepper Dishes
VITE_RESTAURANT_PHONE=+234-xxx-xxx-xxxx
VITE_RESTAURANT_ADDRESS=Lagos, Nigeria
```

## Deployment

This project is configured for Vercel deployment:

1. Connect your repository to Vercel
2. Set the environment variables
3. Deploy automatically

## Features

- QR Code menu access
- Real-time order tracking
- Multiple payment methods (Stripe, PayPal, Apple Pay, Google Pay)
- Responsive design
- Admin dashboard
- Analytics and reporting

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Query
- React Router
- Socket.io Client
- Stripe & PayPal Integration