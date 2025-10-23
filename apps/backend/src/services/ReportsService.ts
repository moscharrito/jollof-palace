import { BaseService } from './BaseService';
import { OrderStatus, PaymentStatus, PaymentMethod, AdminRole } from '@prisma/client';

export interface SalesReport {
  reportId: string;
  title: string;
  period: {
    startDate: Date;
    endDate: Date;
    type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  };
  summary: {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    completedOrders: number;
    cancelledOrders: number;
    refundedAmount: number;
  };
  breakdown: {
    byDay: Array<{
      date: string;
      orders: number;
      revenue: number;
    }>;
    byPaymentMethod: Record<PaymentMethod, {
      orders: number;
      revenue: number;
      percentage: number;
    }>;
    byOrderType: {
      PICKUP: { orders: number; revenue: number; percentage: number };
      DELIVERY: { orders: number; revenue: number; percentage: number };
    };
  };
  topItems: Array<{
    itemId: string;
    name: string;
    category: string;
    quantity: number;
    revenue: number;
  }>;
  generatedAt: Date;
  generatedBy: string;
}

export interface CustomerReport {
  reportId: string;
  title: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  summary: {
    totalCustomers: number;
    newCustomers: number;
    returningCustomers: number;
    averageOrdersPerCustomer: number;
    customerLifetimeValue: number;
    retentionRate: number;
  };
  segments: {
    byOrderFrequency: Array<{
      segment: string;
      customerCount: number;
      percentage: number;
      averageSpend: number;
    }>;
    bySpendingLevel: Array<{
      segment: string;
      customerCount: number;
      percentage: number;
      totalSpend: number;
    }>;
  };
  topCustomers: Array<{
    customerEmail: string;
    customerName: string;
    orderCount: number;
    totalSpent: number;
    lastOrderDate: Date;
    averageOrderValue: number;
  }>;
  generatedAt: Date;
  generatedBy: string;
}

export interface MenuPerformanceReport {
  reportId: string;
  title: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  summary: {
    totalMenuItems: number;
    activeItems: number;
    totalItemsSold: number;
    totalRevenue: number;
  };
  performance: {
    topPerformers: Array<{
      itemId: string;
      name: string;
      category: string;
      quantitySold: number;
      revenue: number;
      profitMargin?: number;
    }>;
    underPerformers: Array<{
      itemId: string;
      name: string;
      category: string;
      quantitySold: number;
      revenue: number;
      daysWithoutSale: number;
    }>;
    categoryAnalysis: Array<{
      category: string;
      itemCount: number;
      totalSold: number;
      revenue: number;
      averagePrice: number;
    }>;
  };
  recommendations: Array<{
    type: 'promote' | 'review' | 'discontinue' | 'price_adjust';
    itemId: string;
    itemName: string;
    reason: string;
    suggestedAction: string;
  }>;
  generatedAt: Date;
  generatedBy: string;
}

export interface OperationalReport {
  reportId: string;
  title: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  efficiency: {
    averagePreparationTime: number;
    orderFulfillmentRate: number;
    onTimeDeliveryRate: number;
    customerSatisfactionScore?: number;
  };
  patterns: {
    peakHours: Array<{
      hour: number;
      orderCount: number;
      averageWaitTime: number;
    }>;
    busyDays: Array<{
      dayOfWeek: number;
      dayName: string;
      orderCount: number;
      averageOrderValue: number;
    }>;
    seasonalTrends: Array<{
      month: string;
      orderCount: number;
      revenue: number;
      growthRate: number;
    }>;
  };
  issues: Array<{
    type: 'delay' | 'cancellation' | 'refund' | 'complaint';
    count: number;
    percentage: number;
    impact: 'low' | 'medium' | 'high';
  }>;
  recommendations: Array<{
    area: string;
    issue: string;
    recommendation: string;
    priority: 'low' | 'medium' | 'high';
  }>;
  generatedAt: Date;
  generatedBy: string;
}

export interface FinancialReport {
  reportId: string;
  title: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  revenue: {
    gross: number;
    net: number;
    taxes: number;
    fees: number;
    refunds: number;
  };
  breakdown: {
    byPaymentMethod: Record<PaymentMethod, {
      amount: number;
      percentage: number;
      fees: number;
    }>;
    byOrderType: {
      PICKUP: { amount: number; percentage: number };
      DELIVERY: { amount: number; percentage: number };
    };
  };
  trends: {
    dailyRevenue: Array<{
      date: string;
      revenue: number;
      orders: number;
    }>;
    monthlyGrowth: number;
    yearOverYearGrowth?: number;
  };
  projections: {
    nextMonth: number;
    nextQuarter: number;
    confidence: number;
  };
  generatedAt: Date;
  generatedBy: string;
}

export class ReportsService extends BaseService {
  async generateSalesReport(
    startDate: Date,
    endDate: Date,
    adminId: string,
    type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom' = 'custom'
  ): Promise<SalesReport> {
    try {
      const reportId = `sales_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Get admin info
      const admin = await this.db.adminUser.findUnique({
        where: { id: adminId },
        select: { name: true, email: true },
      });

      // Get orders in the specified period
      const orders = await this.db.order.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          orderItems: {
            include: {
              menuItem: true,
            },
          },
          payments: true,
        },
      });

      const completedOrders = orders.filter(order => order.status === 'COMPLETED');
      const cancelledOrders = orders.filter(order => order.status === 'CANCELLED');
      
      const totalRevenue = completedOrders.reduce((sum, order) => sum + order.total, 0);
      const averageOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

      // Calculate refunded amount
      const refundedAmount = await this.db.payment.aggregate({
        where: {
          status: 'REFUNDED',
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: { amount: true },
      });

      // Daily breakdown
      const dailyBreakdown = this.groupOrdersByDay(completedOrders);

      // Payment method breakdown
      const paymentMethodBreakdown = this.groupOrdersByPaymentMethod(completedOrders);

      // Order type breakdown
      const orderTypeBreakdown = this.groupOrdersByOrderType(completedOrders);

      // Top selling items
      const topItems = this.getTopSellingItems(completedOrders);

      return {
        reportId,
        title: `Sales Report - ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        period: {
          startDate,
          endDate,
          type,
        },
        summary: {
          totalOrders: orders.length,
          totalRevenue,
          averageOrderValue,
          completedOrders: completedOrders.length,
          cancelledOrders: cancelledOrders.length,
          refundedAmount: refundedAmount._sum.amount || 0,
        },
        breakdown: {
          byDay: dailyBreakdown,
          byPaymentMethod: paymentMethodBreakdown,
          byOrderType: orderTypeBreakdown,
        },
        topItems,
        generatedAt: new Date(),
        generatedBy: admin?.name || 'Unknown Admin',
      };
    } catch (error) {
      this.handleError(error, 'ReportsService.generateSalesReport');
    }
  }

  async generateCustomerReport(
    startDate: Date,
    endDate: Date,
    adminId: string
  ): Promise<CustomerReport> {
    try {
      const reportId = `customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const admin = await this.db.adminUser.findUnique({
        where: { id: adminId },
        select: { name: true },
      });

      // Get customer data
      const orders = await this.db.order.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          status: 'COMPLETED',
        },
      });

      // Group by customer
      const customerData = new Map<string, {
        email: string;
        name: string;
        orders: number;
        totalSpent: number;
        lastOrderDate: Date;
      }>();

      orders.forEach(order => {
        const existing = customerData.get(order.customerEmail) || {
          email: order.customerEmail,
          name: order.customerName || 'Unknown',
          orders: 0,
          totalSpent: 0,
          lastOrderDate: order.createdAt,
        };

        existing.orders += 1;
        existing.totalSpent += order.total;
        if (order.createdAt > existing.lastOrderDate) {
          existing.lastOrderDate = order.createdAt;
        }

        customerData.set(order.customerEmail, existing);
      });

      const customers = Array.from(customerData.values());
      const totalCustomers = customers.length;
      const averageOrdersPerCustomer = totalCustomers > 0 ? orders.length / totalCustomers : 0;
      const customerLifetimeValue = totalCustomers > 0 ? 
        customers.reduce((sum, c) => sum + c.totalSpent, 0) / totalCustomers : 0;

      // Calculate retention rate (simplified)
      const returningCustomers = customers.filter(c => c.orders > 1).length;
      const retentionRate = totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0;

      // Customer segments
      const orderFrequencySegments = this.segmentCustomersByOrderFrequency(customers);
      const spendingLevelSegments = this.segmentCustomersBySpending(customers);

      // Top customers
      const topCustomers = customers
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 20)
        .map(customer => ({
          customerEmail: customer.email,
          customerName: customer.name,
          orderCount: customer.orders,
          totalSpent: customer.totalSpent,
          lastOrderDate: customer.lastOrderDate,
          averageOrderValue: customer.orders > 0 ? customer.totalSpent / customer.orders : 0,
        }));

      return {
        reportId,
        title: 'Customer Analysis Report',
        period: { startDate, endDate },
        summary: {
          totalCustomers,
          newCustomers: totalCustomers, // Simplified - would need historical data
          returningCustomers,
          averageOrdersPerCustomer,
          customerLifetimeValue,
          retentionRate,
        },
        segments: {
          byOrderFrequency: orderFrequencySegments,
          bySpendingLevel: spendingLevelSegments,
        },
        topCustomers,
        generatedAt: new Date(),
        generatedBy: admin?.name || 'Unknown Admin',
      };
    } catch (error) {
      this.handleError(error, 'ReportsService.generateCustomerReport');
    }
  }

  async generateMenuPerformanceReport(
    startDate: Date,
    endDate: Date,
    adminId: string
  ): Promise<MenuPerformanceReport> {
    try {
      const reportId = `menu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const admin = await this.db.adminUser.findUnique({
        where: { id: adminId },
        select: { name: true },
      });

      // Get menu items and their performance
      const orderItems = await this.db.orderItem.findMany({
        where: {
          order: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
            status: 'COMPLETED',
          },
        },
        include: {
          menuItem: true,
        },
      });

      const menuItems = await this.db.menuItem.findMany();
      
      // Calculate performance metrics
      const itemPerformance = new Map<string, {
        item: any;
        quantitySold: number;
        revenue: number;
        lastSaleDate?: Date;
      }>();

      orderItems.forEach(orderItem => {
        const existing = itemPerformance.get(orderItem.menuItemId) || {
          item: orderItem.menuItem,
          quantitySold: 0,
          revenue: 0,
        };

        existing.quantitySold += orderItem.quantity;
        existing.revenue += orderItem.totalPrice;
        existing.lastSaleDate = new Date(); // Simplified

        itemPerformance.set(orderItem.menuItemId, existing);
      });

      // Add items with no sales
      menuItems.forEach(item => {
        if (!itemPerformance.has(item.id)) {
          itemPerformance.set(item.id, {
            item,
            quantitySold: 0,
            revenue: 0,
          });
        }
      });

      const performanceArray = Array.from(itemPerformance.values());

      // Top performers
      const topPerformers = performanceArray
        .filter(p => p.quantitySold > 0)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 20)
        .map(p => ({
          itemId: p.item.id,
          name: p.item.name,
          category: p.item.category,
          quantitySold: p.quantitySold,
          revenue: p.revenue,
        }));

      // Under performers
      const underPerformers = performanceArray
        .filter(p => p.quantitySold === 0 || p.quantitySold < 5)
        .slice(0, 20)
        .map(p => ({
          itemId: p.item.id,
          name: p.item.name,
          category: p.item.category,
          quantitySold: p.quantitySold,
          revenue: p.revenue,
          daysWithoutSale: 30, // Simplified calculation
        }));

      // Category analysis
      const categoryStats = new Map<string, {
        itemCount: number;
        totalSold: number;
        revenue: number;
        totalPrice: number;
      }>();

      performanceArray.forEach(p => {
        const existing = categoryStats.get(p.item.category) || {
          itemCount: 0,
          totalSold: 0,
          revenue: 0,
          totalPrice: 0,
        };

        existing.itemCount += 1;
        existing.totalSold += p.quantitySold;
        existing.revenue += p.revenue;
        existing.totalPrice += p.item.price;

        categoryStats.set(p.item.category, existing);
      });

      const categoryAnalysis = Array.from(categoryStats.entries()).map(([category, stats]) => ({
        category,
        itemCount: stats.itemCount,
        totalSold: stats.totalSold,
        revenue: stats.revenue,
        averagePrice: stats.itemCount > 0 ? stats.totalPrice / stats.itemCount : 0,
      }));

      // Generate recommendations
      const recommendations = this.generateMenuRecommendations(performanceArray);

      return {
        reportId,
        title: 'Menu Performance Report',
        period: { startDate, endDate },
        summary: {
          totalMenuItems: menuItems.length,
          activeItems: menuItems.filter(item => item.isAvailable).length,
          totalItemsSold: performanceArray.reduce((sum, p) => sum + p.quantitySold, 0),
          totalRevenue: performanceArray.reduce((sum, p) => sum + p.revenue, 0),
        },
        performance: {
          topPerformers,
          underPerformers,
          categoryAnalysis,
        },
        recommendations,
        generatedAt: new Date(),
        generatedBy: admin?.name || 'Unknown Admin',
      };
    } catch (error) {
      this.handleError(error, 'ReportsService.generateMenuPerformanceReport');
    }
  }

  async getReportHistory(adminId: string, limit: number = 50): Promise<Array<{
    reportId: string;
    type: string;
    title: string;
    generatedAt: Date;
    generatedBy: string;
    period: {
      startDate: Date;
      endDate: Date;
    };
  }>> {
    // In a real implementation, you would store report metadata in the database
    // For now, return empty array
    return [];
  }

  private groupOrdersByDay(orders: any[]) {
    const dailyStats = new Map<string, { orders: number; revenue: number }>();
    
    orders.forEach(order => {
      const date = order.createdAt.toISOString().split('T')[0];
      const existing = dailyStats.get(date) || { orders: 0, revenue: 0 };
      existing.orders += 1;
      existing.revenue += order.total;
      dailyStats.set(date, existing);
    });

    return Array.from(dailyStats.entries()).map(([date, stats]) => ({
      date,
      orders: stats.orders,
      revenue: stats.revenue,
    }));
  }

  private groupOrdersByPaymentMethod(orders: any[]) {
    const paymentStats = new Map<PaymentMethod, { orders: number; revenue: number }>();
    
    orders.forEach(order => {
      if (order.payments && order.payments.length > 0) {
        const payment = order.payments[0]; // Get the first payment
        const method = payment.method;
        const existing = paymentStats.get(method) || { orders: 0, revenue: 0 };
        existing.orders += 1;
        existing.revenue += order.total;
        paymentStats.set(method, existing);
      }
    });

    const totalOrders = orders.length;
    const result: Record<PaymentMethod, { orders: number; revenue: number; percentage: number }> = {} as any;
    
    paymentStats.forEach((stats, method) => {
      result[method] = {
        orders: stats.orders,
        revenue: stats.revenue,
        percentage: totalOrders > 0 ? (stats.orders / totalOrders) * 100 : 0,
      };
    });

    return result;
  }

  private groupOrdersByOrderType(orders: any[]) {
    const typeStats = { PICKUP: 0, DELIVERY: 0 };
    const revenueStats = { PICKUP: 0, DELIVERY: 0 };
    
    orders.forEach(order => {
      typeStats[order.orderType]++;
      revenueStats[order.orderType] += order.total;
    });

    const totalOrders = orders.length;
    
    return {
      PICKUP: {
        orders: typeStats.PICKUP,
        revenue: revenueStats.PICKUP,
        percentage: totalOrders > 0 ? (typeStats.PICKUP / totalOrders) * 100 : 0,
      },
      DELIVERY: {
        orders: typeStats.DELIVERY,
        revenue: revenueStats.DELIVERY,
        percentage: totalOrders > 0 ? (typeStats.DELIVERY / totalOrders) * 100 : 0,
      },
    };
  }

  private getTopSellingItems(orders: any[]) {
    const itemStats = new Map<string, {
      name: string;
      category: string;
      quantity: number;
      revenue: number;
    }>();

    orders.forEach(order => {
      order.orderItems.forEach((item: any) => {
        const existing = itemStats.get(item.menuItemId) || {
          name: item.menuItem.name,
          category: item.menuItem.category,
          quantity: 0,
          revenue: 0,
        };

        existing.quantity += item.quantity;
        existing.revenue += item.totalPrice;
        itemStats.set(item.menuItemId, existing);
      });
    });

    return Array.from(itemStats.entries())
      .map(([itemId, stats]) => ({
        itemId,
        name: stats.name,
        category: stats.category,
        quantity: stats.quantity,
        revenue: stats.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }

  private segmentCustomersByOrderFrequency(customers: any[]) {
    const segments = [
      { segment: 'One-time (1 order)', min: 1, max: 1 },
      { segment: 'Occasional (2-5 orders)', min: 2, max: 5 },
      { segment: 'Regular (6-15 orders)', min: 6, max: 15 },
      { segment: 'Frequent (16+ orders)', min: 16, max: Infinity },
    ];

    return segments.map(segment => {
      const segmentCustomers = customers.filter(c => 
        c.orders >= segment.min && c.orders <= segment.max
      );
      
      const totalCustomers = customers.length;
      const averageSpend = segmentCustomers.length > 0 ?
        segmentCustomers.reduce((sum, c) => sum + c.totalSpent, 0) / segmentCustomers.length : 0;

      return {
        segment: segment.segment,
        customerCount: segmentCustomers.length,
        percentage: totalCustomers > 0 ? (segmentCustomers.length / totalCustomers) * 100 : 0,
        averageSpend,
      };
    });
  }

  private segmentCustomersBySpending(customers: any[]) {
    const sortedBySpending = customers.sort((a, b) => b.totalSpent - a.totalSpent);
    const totalCustomers = customers.length;
    
    if (totalCustomers === 0) return [];

    const segments = [
      { segment: 'High Value (Top 10%)', percentage: 0.1 },
      { segment: 'Medium Value (Next 30%)', percentage: 0.3 },
      { segment: 'Low Value (Bottom 60%)', percentage: 0.6 },
    ];

    let startIndex = 0;
    
    return segments.map(segment => {
      const segmentSize = Math.ceil(totalCustomers * segment.percentage);
      const segmentCustomers = sortedBySpending.slice(startIndex, startIndex + segmentSize);
      startIndex += segmentSize;

      const totalSpend = segmentCustomers.reduce((sum, c) => sum + c.totalSpent, 0);

      return {
        segment: segment.segment,
        customerCount: segmentCustomers.length,
        percentage: (segmentCustomers.length / totalCustomers) * 100,
        totalSpend,
      };
    });
  }

  private generateMenuRecommendations(performanceArray: any[]) {
    const recommendations: Array<{
      type: 'promote' | 'review' | 'discontinue' | 'price_adjust';
      itemId: string;
      itemName: string;
      reason: string;
      suggestedAction: string;
    }> = [];

    performanceArray.forEach(p => {
      if (p.quantitySold === 0) {
        recommendations.push({
          type: 'discontinue',
          itemId: p.item.id,
          itemName: p.item.name,
          reason: 'No sales in the reporting period',
          suggestedAction: 'Consider removing from menu or investigating why it\'s not selling',
        });
      } else if (p.quantitySold > 100 && p.revenue > 1000) {
        recommendations.push({
          type: 'promote',
          itemId: p.item.id,
          itemName: p.item.name,
          reason: 'High sales volume and revenue',
          suggestedAction: 'Feature prominently in marketing and menu placement',
        });
      } else if (p.quantitySold < 5) {
        recommendations.push({
          type: 'review',
          itemId: p.item.id,
          itemName: p.item.name,
          reason: 'Low sales volume',
          suggestedAction: 'Review pricing, description, or ingredients',
        });
      }
    });

    return recommendations.slice(0, 10); // Limit to top 10 recommendations
  }
}