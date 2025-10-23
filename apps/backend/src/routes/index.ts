import { Router } from 'express';
import menuRoutes from './menuRoutes';
import orderRoutes from './orderRoutes';
import paymentRoutes from './paymentRoutes';
import adminRoutes from './adminRoutes';
import analyticsRoutes from './analyticsRoutes';
import reportsRoutes from './reportsRoutes';
import notificationRoutes from './notificationRoutes';

const router = Router();

// Mount route modules
router.use('/menu', menuRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/admin', adminRoutes);
router.use('/admin/analytics', analyticsRoutes);
router.use('/admin/reports', reportsRoutes);
router.use('/notifications', notificationRoutes);

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
      analytics: '/api/admin/analytics',
      reports: '/api/admin/reports',
      notifications: '/api/notifications',
    },
    documentation: 'https://github.com/your-repo/food-ordering-system',
  });
});

export default router;