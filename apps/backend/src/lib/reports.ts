import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';

const prisma = new PrismaClient();

export interface ReportExportOptions {
  format: 'pdf' | 'excel' | 'csv' | 'json';
  includeCharts?: boolean;
  includeRawData?: boolean;
  template?: string;
}

export interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'doughnut';
  title: string;
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
  }>;
}

/**
 * Report export utilities
 */
export class ReportExporter {
  /**
   * Export report data to Excel format
   */
  static exportToExcel(reportData: any, filename: string): Buffer {
    const workbook = XLSX.utils.book_new();
    
    // Summary sheet
    if (reportData.summary) {
      const summaryData = Object.entries(reportData.summary).map(([key, value]) => ({
        Metric: this.formatLabel(key),
        Value: this.formatValue(value),
      }));
      
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    }
    
    // Detailed data sheets
    if (reportData.breakdown) {
      Object.entries(reportData.breakdown).forEach(([key, data]) => {
        if (Array.isArray(data)) {
          const sheet = XLSX.utils.json_to_sheet(data);
          XLSX.utils.book_append_sheet(workbook, sheet, this.formatLabel(key));
        }
      });
    }
    
    // Raw data sheet
    if (reportData.rawData) {
      const rawSheet = XLSX.utils.json_to_sheet(reportData.rawData);
      XLSX.utils.book_append_sheet(workbook, rawSheet, 'Raw Data');
    }
    
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * Export report data to PDF format
   */
  static exportToPDF(reportData: any, filename: string): Buffer {
    const doc = new PDFDocument();
    const buffers: Buffer[] = [];
    
    doc.on('data', buffers.push.bind(buffers));
    
    // Header
    doc.fontSize(20).text(reportData.title || 'Report', 50, 50);
    doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`, 50, 80);
    doc.fontSize(12).text(`Period: ${reportData.period?.startDate} to ${reportData.period?.endDate}`, 50, 100);
    
    let yPosition = 140;
    
    // Summary section
    if (reportData.summary) {
      doc.fontSize(16).text('Summary', 50, yPosition);
      yPosition += 30;
      
      Object.entries(reportData.summary).forEach(([key, value]) => {
        doc.fontSize(12).text(`${this.formatLabel(key)}: ${this.formatValue(value)}`, 70, yPosition);
        yPosition += 20;
      });
      
      yPosition += 20;
    }
    
    // Breakdown sections
    if (reportData.breakdown) {
      Object.entries(reportData.breakdown).forEach(([sectionKey, sectionData]) => {
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }
        
        doc.fontSize(16).text(this.formatLabel(sectionKey), 50, yPosition);
        yPosition += 30;
        
        if (Array.isArray(sectionData)) {
          sectionData.slice(0, 10).forEach((item: any) => {
            const text = Object.entries(item)
              .map(([k, v]) => `${k}: ${this.formatValue(v)}`)
              .join(', ');
            doc.fontSize(10).text(text, 70, yPosition);
            yPosition += 15;
          });
        }
        
        yPosition += 20;
      });
    }
    
    doc.end();
    
    return Buffer.concat(buffers);
  }

  /**
   * Export report data to CSV format
   */
  static exportToCSV(reportData: any, filename: string): string {
    let csv = '';
    
    // Add summary
    if (reportData.summary) {
      csv += 'Summary\n';
      csv += 'Metric,Value\n';
      Object.entries(reportData.summary).forEach(([key, value]) => {
        csv += `"${this.formatLabel(key)}","${this.formatValue(value)}"\n`;
      });
      csv += '\n';
    }
    
    // Add breakdown data
    if (reportData.breakdown) {
      Object.entries(reportData.breakdown).forEach(([sectionKey, sectionData]) => {
        if (Array.isArray(sectionData) && sectionData.length > 0) {
          csv += `${this.formatLabel(sectionKey)}\n`;
          
          // Headers
          const headers = Object.keys(sectionData[0]);
          csv += headers.map(h => `"${h}"`).join(',') + '\n';
          
          // Data rows
          sectionData.forEach(item => {
            const row = headers.map(header => `"${this.formatValue(item[header])}"`);
            csv += row.join(',') + '\n';
          });
          
          csv += '\n';
        }
      });
    }
    
    return csv;
  }

  private static formatLabel(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  private static formatValue(value: any): string {
    if (typeof value === 'number') {
      if (value > 1000000) {
        return (value / 1000000).toFixed(2) + 'M';
      } else if (value > 1000) {
        return (value / 1000).toFixed(2) + 'K';
      } else {
        return value.toFixed(2);
      }
    }
    
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    
    return String(value);
  }
}

/**
 * Chart data generation utilities
 */
export class ChartGenerator {
  /**
   * Generate sales trend chart data
   */
  static generateSalesTrendChart(salesData: Array<{ date: string; revenue: number; orders: number }>): ChartData {
    return {
      type: 'line',
      title: 'Sales Trend',
      labels: salesData.map(d => d.date),
      datasets: [
        {
          label: 'Revenue',
          data: salesData.map(d => d.revenue),
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
        },
        {
          label: 'Orders',
          data: salesData.map(d => d.orders),
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
        },
      ],
    };
  }

  /**
   * Generate payment method distribution chart
   */
  static generatePaymentMethodChart(paymentData: Record<string, { orders: number; percentage: number }>): ChartData {
    const methods = Object.keys(paymentData);
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    
    return {
      type: 'doughnut',
      title: 'Payment Method Distribution',
      labels: methods,
      datasets: [
        {
          label: 'Orders',
          data: methods.map(method => paymentData[method].orders),
          backgroundColor: colors.slice(0, methods.length),
        },
      ],
    };
  }

  /**
   * Generate top items chart
   */
  static generateTopItemsChart(itemsData: Array<{ name: string; revenue: number; quantity: number }>): ChartData {
    return {
      type: 'bar',
      title: 'Top Selling Items',
      labels: itemsData.map(item => item.name),
      datasets: [
        {
          label: 'Revenue',
          data: itemsData.map(item => item.revenue),
          backgroundColor: '#3B82F6',
        },
        {
          label: 'Quantity Sold',
          data: itemsData.map(item => item.quantity),
          backgroundColor: '#10B981',
        },
      ],
    };
  }

  /**
   * Generate customer segments chart
   */
  static generateCustomerSegmentsChart(segmentData: Array<{ segment: string; customerCount: number; percentage: number }>): ChartData {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
    
    return {
      type: 'pie',
      title: 'Customer Segments',
      labels: segmentData.map(s => s.segment),
      datasets: [
        {
          label: 'Customers',
          data: segmentData.map(s => s.customerCount),
          backgroundColor: colors.slice(0, segmentData.length),
        },
      ],
    };
  }
}

/**
 * Report template system
 */
export class ReportTemplateEngine {
  private static templates = new Map<string, ReportTemplate>();

  static registerTemplate(id: string, template: ReportTemplate): void {
    this.templates.set(id, template);
  }

  static getTemplate(id: string): ReportTemplate | undefined {
    return this.templates.get(id);
  }

  static renderReport(templateId: string, data: any): string {
    const template = this.getTemplate(templateId);
    
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }
    
    return template.render(data);
  }
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  render(data: any): string;
}

/**
 * Email report templates
 */
export class EmailReportTemplate implements ReportTemplate {
  constructor(
    public id: string,
    public name: string,
    public description: string,
    private htmlTemplate: string
  ) {}

  render(data: any): string {
    let html = this.htmlTemplate;
    
    // Simple template variable replacement
    Object.entries(data).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      html = html.replace(new RegExp(placeholder, 'g'), String(value));
    });
    
    return html;
  }
}

// Register default templates
ReportTemplateEngine.registerTemplate('sales-summary', new EmailReportTemplate(
  'sales-summary',
  'Sales Summary Email',
  'Daily/weekly sales summary email template',
  [
    '<html>',
    '  <body>',
    '    <h2>Sales Summary Report</h2>',
    '    <p>Period: {{startDate}} to {{endDate}}</p>',
    '    ',
    '    <h3>Key Metrics</h3>',
    '    <ul>',
    '      <li>Total Orders: {{totalOrders}}</li>',
    '      <li>Total Revenue: ${{totalRevenue}}</li>',
    '      <li>Average Order Value: ${{averageOrderValue}}</li>',
    '    </ul>',
    '    ',
    '    <h3>Performance</h3>',
    '    <p>Compared to previous period:</p>',
    '    <ul>',
    '      <li>Revenue Change: {{revenueChange}}%</li>',
    '      <li>Order Change: {{orderChange}}%</li>',
    '    </ul>',
    '    ',
    '    <p>Generated on {{generatedAt}}</p>',
    '  </body>',
    '</html>'
  ].join('\n')
));

/**
 * Report scheduling utilities
 */
export class ReportScheduler {
  /**
   * Calculate next execution time based on frequency
   */
  static getNextExecutionTime(frequency: string, lastRun?: Date): Date {
    const now = lastRun || new Date();
    
    switch (frequency) {
      case 'daily':
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        return tomorrow;
        
      case 'weekly':
        const nextWeek = new Date(now);
        const daysUntilMonday = (8 - nextWeek.getDay()) % 7 || 7;
        nextWeek.setDate(nextWeek.getDate() + daysUntilMonday);
        nextWeek.setHours(9, 0, 0, 0);
        return nextWeek;
        
      case 'monthly':
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1, 1);
        nextMonth.setHours(9, 0, 0, 0);
        return nextMonth;
        
      default:
        throw new Error(`Unsupported frequency: ${frequency}`);
    }
  }

  /**
   * Check if report should be executed
   */
  static shouldExecute(scheduledTime: Date, lastRun?: Date): boolean {
    const now = new Date();
    
    if (now < scheduledTime) {
      return false;
    }
    
    if (!lastRun) {
      return true;
    }
    
    return lastRun < scheduledTime;
  }
}

/**
 * Report data validation
 */
export class ReportValidator {
  /**
   * Validate date range
   */
  static validateDateRange(startDate: Date, endDate: Date): { valid: boolean; error?: string } {
    if (startDate >= endDate) {
      return { valid: false, error: 'Start date must be before end date' };
    }
    
    const maxRange = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds
    if (endDate.getTime() - startDate.getTime() > maxRange) {
      return { valid: false, error: 'Date range cannot exceed 1 year' };
    }
    
    const futureLimit = new Date();
    futureLimit.setDate(futureLimit.getDate() + 1);
    if (endDate > futureLimit) {
      return { valid: false, error: 'End date cannot be in the future' };
    }
    
    return { valid: true };
  }

  /**
   * Validate report parameters
   */
  static validateReportParams(params: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!params.startDate || !params.endDate) {
      errors.push('Start date and end date are required');
    }
    
    if (params.startDate && params.endDate) {
      const dateValidation = this.validateDateRange(
        new Date(params.startDate),
        new Date(params.endDate)
      );
      
      if (!dateValidation.valid) {
        errors.push(dateValidation.error!);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
}