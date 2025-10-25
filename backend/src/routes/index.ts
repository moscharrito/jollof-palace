import { Router } from 'express';
import menuRoutes from './menuRoutes';
import orderRoutes from './orderRoutes';
import paymentRoutes from './paymentRoutes';
import adminRoutes from './adminRoutes';
// Analytics and reports routes removed

const router = Router();

// Mount route modules
router.use('/menu', menuRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/admin', adminRoutes);
// Analytics and reports routes removed

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Food Ordering API',
    version: '1.0.0',
    endpoints: {
      menu: '/api/menu',
      orders: '/api/orders',
      payments: '/api/payments',
      admin: '/api/admin',
      // Analytics and reports endpoints removed
    },
    documentation: 'https://github.com/your-repo/food-ordering-system',
  });
});

export default router;