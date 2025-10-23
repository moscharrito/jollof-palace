import { DateRangeHelper, MetricsCache, AnalyticsAggregator, calculatePercentageChange } from '../lib/analytics';
import { ReportExporter } from '../lib/reports';

describe('Analytics Library Functions', () => {
  describe('DateRangeHelper', () => {
    it('should get today date range correctly', () => {
      const today = DateRangeHelper.getToday();
      
      expect(today.startDate.getHours()).toBe(0);
      expect(today.startDate.getMinutes()).toBe(0);
      expect(today.startDate.getSeconds()).toBe(0);
      expect(today.endDate.getHours()).toBe(23);
      expect(today.endDate.getMinutes()).toBe(59);
      expect(today.endDate.getSeconds()).toBe(59);
    });

    it('should get yesterday date range correctly', () => {
      const yesterday = DateRangeHelper.getYesterday();
      const today = new Date();
      
      expect(yesterday.startDate.getDate()).toBe(today.getDate() - 1);
      expect(yesterday.startDate.getHours()).toBe(0);
      expect(yesterday.endDate.getHours()).toBe(23);
    });

    it('should get this week date range correctly', () => {
      const thisWeek = DateRangeHelper.getThisWeek();
      const now = new Date();
      const expectedStart = new Date(now);
      expectedStart.setDate(now.getDate() - now.getDay());
      expectedStart.setHours(0, 0, 0, 0);
      
      expect(thisWeek.startDate.getDay()).toBe(0); // Sunday
      expect(thisWeek.endDate.getDay()).toBe(6); // Saturday
    });

    it('should get this month date range correctly', () => {
      const thisMonth = DateRangeHelper.getThisMonth();
      const now = new Date();
      
      expect(thisMonth.startDate.getDate()).toBe(1);
      expect(thisMonth.startDate.getMonth()).toBe(now.getMonth());
      expect(thisMonth.endDate.getMonth()).toBe(now.getMonth());
    });

    it('should get last 7 days correctly', () => {
      const last7Days = DateRangeHelper.getLast7Days();
      const daysDiff = Math.floor((last7Days.endDate.getTime() - last7Days.startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      expect(daysDiff).toBe(7);
    });

    it('should get last 30 days correctly', () => {
      const last30Days = DateRangeHelper.getLast30Days();
      const daysDiff = Math.floor((last30Days.endDate.getTime() - last30Days.startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      expect(daysDiff).toBe(30);
    });
  });

  describe('MetricsCache', () => {
    beforeEach(() => {
      MetricsCache.clear();
    });

    it('should store and retrieve cached data', () => {
      const testData = { value: 123, name: 'test' };
      MetricsCache.set('test-key', testData, 300);
      
      const retrieved = MetricsCache.get('test-key');
      expect(retrieved).toEqual(testData);
    });

    it('should return null for non-existent keys', () => {
      const result = MetricsCache.get('non-existent');
      expect(result).toBeNull();
    });

    it('should expire cached data after TTL', (done) => {
      const testData = { value: 123 };
      MetricsCache.set('test-key', testData, 0.1); // 100ms TTL
      
      setTimeout(() => {
        const result = MetricsCache.get('test-key');
        expect(result).toBeNull();
        done();
      }, 150);
    });

    it('should clear all cached data', () => {
      MetricsCache.set('key1', { value: 1 }, 300);
      MetricsCache.set('key2', { value: 2 }, 300);
      
      MetricsCache.clear();
      
      expect(MetricsCache.get('key1')).toBeNull();
      expect(MetricsCache.get('key2')).toBeNull();
    });
  });

  describe('AnalyticsAggregator', () => {
    const testData = [
      { createdAt: new Date('2023-01-01T10:00:00Z'), value: 100 },
      { createdAt: new Date('2023-01-01T14:00:00Z'), value: 200 },
      { createdAt: new Date('2023-01-02T09:00:00Z'), value: 150 },
      { createdAt: new Date('2023-01-02T16:00:00Z'), value: 250 },
    ];

    it('should group data by day correctly', () => {
      const grouped = AnalyticsAggregator.groupByTimePeriod(testData, 'day');
      
      expect(grouped.size).toBe(2);
      expect(grouped.get('2023-01-01')).toHaveLength(2);
      expect(grouped.get('2023-01-02')).toHaveLength(2);
    });

    it('should group data by hour correctly', () => {
      const grouped = AnalyticsAggregator.groupByTimePeriod(testData, 'hour');
      
      expect(grouped.size).toBe(4); // Each entry has different hour
    });

    it('should calculate moving average correctly', () => {
      const values = [10, 20, 30, 40, 50];
      const movingAvg = AnalyticsAggregator.calculateMovingAverage(values, 3);
      
      expect(movingAvg[0]).toBe(10); // First value
      expect(movingAvg[1]).toBe(15); // (10 + 20) / 2
      expect(movingAvg[2]).toBe(20); // (10 + 20 + 30) / 3
      expect(movingAvg[3]).toBe(30); // (20 + 30 + 40) / 3
      expect(movingAvg[4]).toBe(40); // (30 + 40 + 50) / 3
    });

    it('should calculate growth rate correctly', () => {
      const currentPeriod = [100, 200, 300];
      const previousPeriod = [80, 160, 240];
      
      const growthRate = AnalyticsAggregator.calculateGrowthRate(currentPeriod, previousPeriod);
      
      // Current sum: 600, Previous sum: 480
      // Growth rate: ((600 - 480) / 480) * 100 = 25%
      expect(growthRate).toBeCloseTo(25, 2);
    });

    it('should find outliers using IQR method', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 100]; // 100 is an outlier
      const result = AnalyticsAggregator.findOutliers(values);
      
      expect(result.outliers).toContain(100);
      expect(result.threshold.upper).toBeGreaterThan(9);
    });
  });

  describe('Percentage Change Calculation', () => {
    it('should calculate positive percentage change correctly', () => {
      const result = calculatePercentageChange(120, 100);
      expect(result).toBe(20);
    });

    it('should calculate negative percentage change correctly', () => {
      const result = calculatePercentageChange(80, 100);
      expect(result).toBe(-20);
    });

    it('should handle zero previous value', () => {
      const result = calculatePercentageChange(100, 0);
      expect(result).toBe(100);
    });

    it('should handle zero current value', () => {
      const result = calculatePercentageChange(0, 100);
      expect(result).toBe(-100);
    });

    it('should handle both values being zero', () => {
      const result = calculatePercentageChange(0, 0);
      expect(result).toBe(0);
    });
  });

  describe('ReportExporter', () => {
    const sampleReportData = {
      title: 'Test Report',
      period: {
        startDate: '2023-01-01',
        endDate: '2023-01-31'
      },
      summary: {
        totalOrders: 150,
        totalRevenue: 15000,
        averageOrderValue: 100
      },
      breakdown: {
        dailySales: [
          { date: '2023-01-01', orders: 10, revenue: 1000 },
          { date: '2023-01-02', orders: 15, revenue: 1500 }
        ]
      }
    };

    it('should export report to CSV format', () => {
      const csvData = ReportExporter.exportToCSV(sampleReportData, 'test-report');
      
      expect(csvData).toContain('Summary');
      expect(csvData).toContain('Total Orders');
      expect(csvData).toContain('150');
      expect(csvData).toContain('Daily Sales');
      expect(csvData).toContain('2023-01-01');
    });

    it('should export report to Excel format', () => {
      const excelBuffer = ReportExporter.exportToExcel(sampleReportData, 'test-report');
      
      expect(excelBuffer).toBeInstanceOf(Buffer);
      expect(excelBuffer.length).toBeGreaterThan(0);
    });

    it('should handle empty report data', () => {
      const emptyReport = {
        title: 'Empty Report',
        summary: {},
        breakdown: {}
      };
      
      const csvData = ReportExporter.exportToCSV(emptyReport, 'empty-report');
      expect(csvData).toContain('Summary');
    });

    it('should format large numbers correctly', () => {
      const reportWithLargeNumbers = {
        summary: {
          totalRevenue: 1500000, // 1.5M
          totalOrders: 2500000   // 2.5M
        }
      };
      
      const csvData = ReportExporter.exportToCSV(reportWithLargeNumbers, 'large-numbers');
      expect(csvData).toContain('1.50M');
      expect(csvData).toContain('2.50M');
    });
  });

  describe('Analytics Calculations Integration', () => {
    it('should calculate daily revenue trends correctly', () => {
      const salesData = [
        { date: '2023-01-01', revenue: 1000, orders: 10 },
        { date: '2023-01-02', revenue: 1200, orders: 12 },
        { date: '2023-01-03', revenue: 800, orders: 8 },
        { date: '2023-01-04', revenue: 1500, orders: 15 }
      ];

      const revenues = salesData.map(d => d.revenue);
      const movingAverage = AnalyticsAggregator.calculateMovingAverage(revenues, 3);
      
      expect(movingAverage).toHaveLength(4);
      expect(movingAverage[2]).toBeCloseTo(1000, 2); // (1000 + 1200 + 800) / 3
    });

    it('should identify performance outliers in menu items', () => {
      const itemSales = [50, 55, 48, 52, 49, 51, 200, 47, 53, 46]; // 200 is outlier
      const outlierAnalysis = AnalyticsAggregator.findOutliers(itemSales);
      
      expect(outlierAnalysis.outliers).toContain(200);
      expect(outlierAnalysis.outliers.length).toBe(1);
    });

    it('should calculate customer retention metrics correctly', () => {
      const customerData = [
        { orders: 1, totalSpent: 100 },
        { orders: 3, totalSpent: 300 },
        { orders: 1, totalSpent: 150 },
        { orders: 5, totalSpent: 500 },
        { orders: 2, totalSpent: 200 }
      ];

      const returningCustomers = customerData.filter(c => c.orders > 1).length;
      const retentionRate = (returningCustomers / customerData.length) * 100;
      
      expect(retentionRate).toBe(60); // 3 out of 5 customers have more than 1 order
    });

    it('should calculate average order value trends', () => {
      const orderData = [
        { total: 2500, date: '2023-01-01' }, // $25.00
        { total: 3000, date: '2023-01-01' }, // $30.00
        { total: 2000, date: '2023-01-02' }, // $20.00
        { total: 4000, date: '2023-01-02' }  // $40.00
      ];

      // Group by date and calculate daily averages
      const dailyAverages = new Map();
      orderData.forEach(order => {
        const existing = dailyAverages.get(order.date) || { total: 0, count: 0 };
        existing.total += order.total;
        existing.count += 1;
        dailyAverages.set(order.date, existing);
      });

      const averages = Array.from(dailyAverages.values()).map(day => day.total / day.count);
      
      expect(averages[0]).toBe(2750); // (2500 + 3000) / 2
      expect(averages[1]).toBe(3000); // (2000 + 4000) / 2
    });
  });

  describe('Performance Metrics', () => {
    it('should handle large datasets efficiently', () => {
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        createdAt: new Date(2023, 0, 1 + (i % 365)),
        value: Math.random() * 1000
      }));

      const start = Date.now();
      const grouped = AnalyticsAggregator.groupByTimePeriod(largeDataset, 'day');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      expect(grouped.size).toBeGreaterThan(0);
    });

    it('should cache frequently accessed calculations', () => {
      const testKey = 'performance-test';
      const complexCalculation = { result: Math.random() * 1000000 };
      
      // First access - store in cache
      const start1 = Date.now();
      MetricsCache.set(testKey, complexCalculation, 300);
      const cached1 = MetricsCache.get(testKey);
      const duration1 = Date.now() - start1;

      // Second access - retrieve from cache
      const start2 = Date.now();
      const cached2 = MetricsCache.get(testKey);
      const duration2 = Date.now() - start2;

      expect(cached1).toEqual(complexCalculation);
      expect(cached2).toEqual(complexCalculation);
      expect(duration2).toBeLessThanOrEqual(duration1);
    });
  });
});