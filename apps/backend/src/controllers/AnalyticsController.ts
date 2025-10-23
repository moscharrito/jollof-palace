import { Response } from 'express';
import { BaseController } from './BaseController';
import { AdminAuthRequest } from '../middleware/adminAuth';
import { DateRangeHelper, MetricsCache } from '../lib/analytics';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AnalyticsController extends BaseController {
  async getDashboardStats(req: AdminAuthRequest, res: Response): Promise<void> {
    try {
      const cacheKey = 'dashboard_stats';
      const cached = MetricsCache.get(cacheKey);
      
      if (cached) {
        return this.sendSuccess(res, cached);
      }

      const today = DateRangeHelper.getToday();
      const yesterday = DateRangeHelper.getYesterday();
      const thisWeek = DateRangeHelper.getThisWeek();
      const lastWeek = DateRangeHelper.getLastWeek();
      const thisMonth = DateRangeHelper.getThisMonth();

      // Today's metrics
      const todayOrders = await prisma.order.count({
        where: {
          createdAt: { gte: today.startDate, lte: today.endDate },
          status: 'COMPLETED'
        }
      });

      const todayRevenue = await prisma.order.aggregate({
        where: {
          createdAt: { gte: today.startDate, lte: today.endDate },
          status: 'COMPLETED'
        },
        _sum: { total: true }
      });

      // Yesterday's metrics for comparison
      const yesterdayOrders = await prisma.order.count({
        where: {
          createdAt: { gte: yesterday.startDate, lte: yesterday.endDate },
          status: 'COMPLETED'
        }
      });

      const yesterdayRevenue = await prisma.order.aggregate({
        where: {
          createdAt: { gte: yesterday.startDate, lte: yesterday.endDate },
          status: 'COMPLETED'
        },
        _sum: { total: true }
      });

      // This week's metrics
      const weekOrders = await prisma.order.count({
        where: {
          createdAt: { gte: thisWeek.startDate, lte: thisWeek.endDate },
          status: 'COMPLETED'
        }
      });

      const weekRevenue = await prisma.order.aggregate({
        where: {
          createdAt: { gte: thisWeek.startDate, lte: thisWeek.endDate },
          status: 'COMPLETED'
        },
        _sum: { total: true }
      });

      // Pending orders
      const pendingOrders = await prisma.order.count({
        where: { status: { in: ['PENDING', 'CONFIRMED', 'PREPARING'] } }
      });

      // Popular items this month
      const popularItems = await prisma.orderItem.groupBy({
        by: ['menuItemId'],
        where: {
          order: {
            createdAt: { gte: thisMonth.startDate, lte: thisMonth.endDate },
            status: 'COMPLETED'
          }
        },
        _sum: { quantity: true },
        _count: { id: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5
      });

      const popularItemsWithDetails = await Promise.all(
        popularItems.map(async (item) => {
          const menuItem = await prisma.menuItem.findUnique({
            where: { id: item.menuItemId }
          });
          return {
            id: item.menuItemId,
            name: menuItem?.name || 'Unknown',
            quantitySold: item._sum.quantity || 0,
            orderCount: item._count.id
          };
        })
      );

      const dashboardData = {
        today: {
          orders: todayOrders,
          revenue: (todayRevenue._sum.total || 0) / 100, // Convert from cents
          orderChange: todayOrders - yesterdayOrders,
          revenueChange: ((todayRevenue._sum.total || 0) - (yesterdayRevenue._sum.total || 0)) / 100
        },
        week: {
          orders: weekOrders,
          revenue: (weekRevenue._sum.total || 0) / 100
        },
        pending: {
          orders: pendingOrders
        },
        popularItems: popularItemsWithDetails,
        lastUpdated: new Date()
      };

      // Cache for 5 minutes
      MetricsCache.set(cacheKey, dashboardData, 300);
      
      this.sendSuccess(res, dashboardData);
    } catch (error) {
      console.error('Dashboard stats error:', error);
      this.sendError(res, 'Failed to get dashboard stats', 500);
    }
  }

  async getSalesAnalytics(req: AdminAuthRequest, res: Response): Promise<void> {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Daily sales data
      const dailySales = await prisma.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as order_count,
          SUM(total) as revenue,
          AVG(total) as avg_order_value
        FROM orders 
        WHERE created_at >= ${startDate} 
          AND created_at <= ${endDate}
          AND status = 'COMPLETED'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      ` as Array<{
        date: Date;
        order_count: bigint;
        revenue: bigint;
        avg_order_value: number;
      }>;

      // Payment method breakdown
      const paymentMethods = await prisma.payment.groupBy({
        by: ['method'],
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: 'COMPLETED'
        },
        _count: { id: true },
        _sum: { amount: true }
      });

      // Order type breakdown
      const orderTypes = await prisma.order.groupBy({
        by: ['orderType'],
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: 'COMPLETED'
        },
        _count: { id: true },
        _sum: { total: true }
      });

      // Total metrics
      const totalRevenue = await prisma.order.aggregate({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: 'COMPLETED'
        },
        _sum: { total: true },
        _count: { id: true },
        _avg: { total: true }
      });

      const salesData = {
        period: { startDate, endDate, days },
        summary: {
          totalOrders: Number(totalRevenue._count.id),
          totalRevenue: (totalRevenue._sum.total || 0) / 100,
          averageOrderValue: (totalRevenue._avg.total || 0) / 100
        },
        dailySales: dailySales.map(day => ({
          date: day.date.toISOString().split('T')[0],
          orderCount: Number(day.order_count),
          revenue: Number(day.revenue) / 100,
          avgOrderValue: day.avg_order_value / 100
        })),
        paymentMethods: paymentMethods.map(pm => ({
          method: pm.method,
          orderCount: pm._count.id,
          revenue: (pm._sum.amount || 0) / 100
        })),
        orderTypes: orderTypes.map(ot => ({
          type: ot.orderType,
          orderCount: ot._count.id,
          revenue: (ot._sum.total || 0) / 100
        }))
      };

      this.sendSuccess(res, salesData);
    } catch (error) {
      console.error('Sales analytics error:', error);
      this.sendError(res, 'Failed to get sales analytics', 500);
    }
  }

  async getMenuAnalytics(req: AdminAuthRequest, res: Response): Promise<void> {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Top selling items
      const topItems = await prisma.orderItem.groupBy({
        by: ['menuItemId'],
        where: {
          order: {
            createdAt: { gte: startDate, lte: endDate },
            status: 'COMPLETED'
          }
        },
        _sum: { quantity: true, totalPrice: true },
        _count: { id: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 20
      });

      const topItemsWithDetails = await Promise.all(
        topItems.map(async (item) => {
          const menuItem = await prisma.menuItem.findUnique({
            where: { id: item.menuItemId }
          });
          return {
            id: item.menuItemId,
            name: menuItem?.name || 'Unknown',
            category: menuItem?.category || 'UNKNOWN',
            quantitySold: item._sum.quantity || 0,
            revenue: (item._sum.totalPrice || 0) / 100,
            orderFrequency: item._count.id,
            averageQuantityPerOrder: (item._sum.quantity || 0) / (item._count.id || 1)
          };
        })
      );

      // Category performance
      const categoryStats = await prisma.$queryRaw`
        SELECT 
          mi.category,
          COUNT(DISTINCT mi.id) as item_count,
          SUM(oi.quantity) as total_quantity,
          SUM(oi.total_price) as total_revenue,
          COUNT(oi.id) as order_frequency
        FROM menu_items mi
        LEFT JOIN order_items oi ON mi.id = oi.menu_item_id
        LEFT JOIN orders o ON oi.order_id = o.id
        WHERE o.created_at >= ${startDate} 
          AND o.created_at <= ${endDate}
          AND o.status = 'COMPLETED'
        GROUP BY mi.category
        ORDER BY total_revenue DESC
      ` as Array<{
        category: string;
        item_count: bigint;
        total_quantity: bigint;
        total_revenue: bigint;
        order_frequency: bigint;
      }>;

      // Items with no sales
      const itemsWithNoSales = await prisma.menuItem.findMany({
        where: {
          orderItems: {
            none: {
              order: {
                createdAt: { gte: startDate, lte: endDate },
                status: 'COMPLETED'
              }
            }
          }
        },
        select: {
          id: true,
          name: true,
          category: true,
          price: true,
          isAvailable: true
        }
      });

      const menuAnalytics = {
        period: { startDate, endDate, days },
        topItems: topItemsWithDetails,
        categoryPerformance: categoryStats.map(cat => ({
          category: cat.category,
          itemCount: Number(cat.item_count),
          totalQuantity: Number(cat.total_quantity),
          totalRevenue: Number(cat.total_revenue) / 100,
          orderFrequency: Number(cat.order_frequency),
          averageRevenuePerItem: Number(cat.total_revenue) / Number(cat.item_count) / 100
        })),
        underperformingItems: itemsWithNoSales.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category,
          price: item.price / 100,
          isAvailable: item.isAvailable
        }))
      };

      this.sendSuccess(res, menuAnalytics);
    } catch (error) {
      console.error('Menu analytics error:', error);
      this.sendError(res, 'Failed to get menu analytics', 500);
    }
  }

  async getCustomerAnalytics(req: AdminAuthRequest, res: Response): Promise<void> {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Customer order patterns
      const customerPatterns = await prisma.$queryRaw`
        SELECT 
          customer_email,
          customer_name,
          COUNT(*) as order_count,
          SUM(total) as total_spent,
          AVG(total) as avg_order_value,
          MAX(created_at) as last_order_date,
          MIN(created_at) as first_order_date
        FROM orders 
        WHERE created_at >= ${startDate} 
          AND created_at <= ${endDate}
          AND status = 'COMPLETED'
          AND customer_email IS NOT NULL
        GROUP BY customer_email, customer_name
        ORDER BY total_spent DESC
      ` as Array<{
        customer_email: string;
        customer_name: string;
        order_count: bigint;
        total_spent: bigint;
        avg_order_value: number;
        last_order_date: Date;
        first_order_date: Date;
      }>;

      // Customer segmentation
      const totalCustomers = customerPatterns.length;
      const newCustomers = customerPatterns.filter(c => 
        c.first_order_date >= startDate
      ).length;
      
      const returningCustomers = customerPatterns.filter(c => 
        Number(c.order_count) > 1
      ).length;

      // Segment customers by order frequency
      const segments = {
        oneTime: customerPatterns.filter(c => Number(c.order_count) === 1).length,
        occasional: customerPatterns.filter(c => Number(c.order_count) >= 2 && Number(c.order_count) <= 5).length,
        regular: customerPatterns.filter(c => Number(c.order_count) >= 6 && Number(c.order_count) <= 15).length,
        frequent: customerPatterns.filter(c => Number(c.order_count) > 15).length
      };

      // Top customers
      const topCustomers = customerPatterns.slice(0, 20).map(customer => ({
        email: customer.customer_email,
        name: customer.customer_name,
        orderCount: Number(customer.order_count),
        totalSpent: Number(customer.total_spent) / 100,
        avgOrderValue: customer.avg_order_value / 100,
        lastOrderDate: customer.last_order_date,
        daysSinceLastOrder: Math.floor((endDate.getTime() - customer.last_order_date.getTime()) / (1000 * 60 * 60 * 24))
      }));

      // Calculate retention metrics
      const totalRevenue = customerPatterns.reduce((sum, c) => sum + Number(c.total_spent), 0);
      const avgCustomerLifetimeValue = totalCustomers > 0 ? totalRevenue / totalCustomers / 100 : 0;
      const retentionRate = totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0;

      const customerAnalytics = {
        period: { startDate, endDate, days },
        summary: {
          totalCustomers,
          newCustomers,
          returningCustomers,
          retentionRate,
          avgCustomerLifetimeValue,
          totalRevenue: totalRevenue / 100
        },
        segments: {
          oneTime: { count: segments.oneTime, percentage: (segments.oneTime / totalCustomers) * 100 },
          occasional: { count: segments.occasional, percentage: (segments.occasional / totalCustomers) * 100 },
          regular: { count: segments.regular, percentage: (segments.regular / totalCustomers) * 100 },
          frequent: { count: segments.frequent, percentage: (segments.frequent / totalCustomers) * 100 }
        },
        topCustomers
      };

      this.sendSuccess(res, customerAnalytics);
    } catch (error) {
      console.error('Customer analytics error:', error);
      this.sendError(res, 'Failed to get customer analytics', 500);
    }
  }
}

export const analyticsController = new AnalyticsController();