import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface TimeRange {
  startDate: Date;
  endDate: Date;
}

export interface MetricCalculation {
  current: number;
  previous: number;
  change: number;
  changePercentage: number;
}

/**
 * Calculate percentage change between two values
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
}

/**
 * Calculate metric with comparison to previous period
 */
export function calculateMetricWithComparison(
  current: number,
  previous: number
): MetricCalculation {
  const change = current - previous;
  const changePercentage = calculatePercentageChange(current, previous);
  
  return {
    current,
    previous,
    change,
    changePercentage,
  };
}

/**
 * Get time range for comparison period
 */
export function getComparisonTimeRange(startDate: Date, endDate: Date): TimeRange {
  const duration = endDate.getTime() - startDate.getTime();
  const comparisonEndDate = new Date(startDate.getTime() - 1);
  const comparisonStartDate = new Date(comparisonEndDate.getTime() - duration);
  
  return {
    startDate: comparisonStartDate,
    endDate: comparisonEndDate,
  };
}

/**
 * Format currency amount from cents to dollars
 */
export function formatCurrency(amountInCents: number): string {
  return (amountInCents / 100).toFixed(2);
}

/**
 * Format percentage with specified decimal places
 */
export function formatPercentage(percentage: number, decimals: number = 1): string {
  return `${percentage.toFixed(decimals)}%`;
}

/**
 * Get date ranges for different periods
 */
export class DateRangeHelper {
  static getToday(): TimeRange {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    
    return {
      startDate: today,
      endDate: endOfDay,
    };
  }

  static getYesterday(): TimeRange {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const endOfDay = new Date(yesterday);
    endOfDay.setHours(23, 59, 59, 999);
    
    return {
      startDate: yesterday,
      endDate: endOfDay,
    };
  }

  static getThisWeek(): TimeRange {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    return {
      startDate: startOfWeek,
      endDate: endOfWeek,
    };
  }

  static getLastWeek(): TimeRange {
    const thisWeek = this.getThisWeek();
    const lastWeekStart = new Date(thisWeek.startDate);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    
    const lastWeekEnd = new Date(thisWeek.endDate);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);
    
    return {
      startDate: lastWeekStart,
      endDate: lastWeekEnd,
    };
  }

  static getThisMonth(): TimeRange {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);
    
    return {
      startDate: startOfMonth,
      endDate: endOfMonth,
    };
  }

  static getLastMonth(): TimeRange {
    const now = new Date();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    endOfLastMonth.setHours(23, 59, 59, 999);
    
    return {
      startDate: startOfLastMonth,
      endDate: endOfLastMonth,
    };
  }

  static getThisYear(): TimeRange {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31);
    endOfYear.setHours(23, 59, 59, 999);
    
    return {
      startDate: startOfYear,
      endDate: endOfYear,
    };
  }

  static getLastYear(): TimeRange {
    const now = new Date();
    const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
    const endOfLastYear = new Date(now.getFullYear() - 1, 11, 31);
    endOfLastYear.setHours(23, 59, 59, 999);
    
    return {
      startDate: startOfLastYear,
      endDate: endOfLastYear,
    };
  }

  static getLast30Days(): TimeRange {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    startDate.setHours(0, 0, 0, 0);
    
    return {
      startDate,
      endDate,
    };
  }

  static getLast7Days(): TimeRange {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    startDate.setHours(0, 0, 0, 0);
    
    return {
      startDate,
      endDate,
    };
  }
}

/**
 * Analytics aggregation helpers
 */
export class AnalyticsAggregator {
  /**
   * Group data by time period
   */
  static groupByTimePeriod<T extends { createdAt: Date }>(
    data: T[],
    period: 'hour' | 'day' | 'week' | 'month'
  ): Map<string, T[]> {
    const grouped = new Map<string, T[]>();
    
    data.forEach(item => {
      let key: string;
      
      switch (period) {
        case 'hour':
          key = `${item.createdAt.toISOString().split('T')[0]}-${item.createdAt.getHours()}`;
          break;
        case 'day':
          key = item.createdAt.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(item.createdAt);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${item.createdAt.getFullYear()}-${String(item.createdAt.getMonth() + 1).padStart(2, '0')}`;
          break;
      }
      
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(item);
    });
    
    return grouped;
  }

  /**
   * Calculate moving average
   */
  static calculateMovingAverage(values: number[], windowSize: number): number[] {
    const result: number[] = [];
    
    for (let i = 0; i < values.length; i++) {
      const start = Math.max(0, i - windowSize + 1);
      const window = values.slice(start, i + 1);
      const average = window.reduce((sum, val) => sum + val, 0) / window.length;
      result.push(average);
    }
    
    return result;
  }

  /**
   * Calculate growth rate between periods
   */
  static calculateGrowthRate(currentPeriod: number[], previousPeriod: number[]): number {
    const currentSum = currentPeriod.reduce((sum, val) => sum + val, 0);
    const previousSum = previousPeriod.reduce((sum, val) => sum + val, 0);
    
    return calculatePercentageChange(currentSum, previousSum);
  }

  /**
   * Find outliers using IQR method
   */
  static findOutliers(values: number[]): { outliers: number[]; threshold: { lower: number; upper: number } } {
    const sorted = [...values].sort((a, b) => a - b);
    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);
    
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;
    
    const lowerThreshold = q1 - 1.5 * iqr;
    const upperThreshold = q3 + 1.5 * iqr;
    
    const outliers = values.filter(val => val < lowerThreshold || val > upperThreshold);
    
    return {
      outliers,
      threshold: {
        lower: lowerThreshold,
        upper: upperThreshold,
      },
    };
  }
}

/**
 * Real-time metrics cache
 */
export class MetricsCache {
  private static cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  static set(key: string, data: any, ttlSeconds: number = 300): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
    });
  }

  static get(key: string): any | null {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  static clear(): void {
    this.cache.clear();
  }

  static clearExpired(): void {
    const now = Date.now();
    
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * Performance monitoring
 */
export class PerformanceMonitor {
  private static metrics = new Map<string, number[]>();

  static recordExecutionTime(operation: string, timeMs: number): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    
    const times = this.metrics.get(operation)!;
    times.push(timeMs);
    
    // Keep only last 100 measurements
    if (times.length > 100) {
      times.shift();
    }
  }

  static getAverageExecutionTime(operation: string): number {
    const times = this.metrics.get(operation);
    
    if (!times || times.length === 0) {
      return 0;
    }
    
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  static getPerformanceReport(): Record<string, {
    average: number;
    min: number;
    max: number;
    count: number;
  }> {
    const report: Record<string, any> = {};
    
    for (const [operation, times] of this.metrics.entries()) {
      if (times.length > 0) {
        report[operation] = {
          average: times.reduce((sum, time) => sum + time, 0) / times.length,
          min: Math.min(...times),
          max: Math.max(...times),
          count: times.length,
        };
      }
    }
    
    return report;
  }
}