import { Response } from 'express';
import { BaseController } from './BaseController';
import { AdminAuthRequest } from '../middleware/adminAuth';
import { ReportsService } from '../services/ReportsService';
import { ReportExporter } from '../lib/reports';

const reportsService = new ReportsService();

export class ReportsController extends BaseController {
  async generateSalesReport(req: AdminAuthRequest, res: Response): Promise<void> {
    try {
      const { startDate, endDate, type = 'custom', format = 'json' } = req.body;
      const adminId = req.admin?.id || 'unknown';

      const report = await reportsService.generateSalesReport(
        new Date(startDate),
        new Date(endDate),
        adminId,
        type
      );

      if (format === 'csv') {
        const csvData = ReportExporter.exportToCSV(report, `sales-report-${report.reportId}`);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="sales-report-${report.reportId}.csv"`);
        res.send(csvData);
        return;
      }

      if (format === 'excel') {
        const excelBuffer = ReportExporter.exportToExcel(report, `sales-report-${report.reportId}`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="sales-report-${report.reportId}.xlsx"`);
        res.send(excelBuffer);
        return;
      }

      this.sendSuccess(res, report);
    } catch (error) {
      console.error('Sales report generation error:', error);
      this.sendError(res, 'Failed to generate sales report', 500);
    }
  }

  async generateCustomerReport(req: AdminAuthRequest, res: Response): Promise<void> {
    try {
      const { startDate, endDate, format = 'json' } = req.body;
      const adminId = req.admin?.id || 'unknown';

      const report = await reportsService.generateCustomerReport(
        new Date(startDate),
        new Date(endDate),
        adminId
      );

      if (format === 'csv') {
        const csvData = ReportExporter.exportToCSV(report, `customer-report-${report.reportId}`);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="customer-report-${report.reportId}.csv"`);
        res.send(csvData);
        return;
      }

      if (format === 'excel') {
        const excelBuffer = ReportExporter.exportToExcel(report, `customer-report-${report.reportId}`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="customer-report-${report.reportId}.xlsx"`);
        res.send(excelBuffer);
        return;
      }

      this.sendSuccess(res, report);
    } catch (error) {
      console.error('Customer report generation error:', error);
      this.sendError(res, 'Failed to generate customer report', 500);
    }
  }

  async generateMenuReport(req: AdminAuthRequest, res: Response): Promise<void> {
    try {
      const { startDate, endDate, format = 'json' } = req.body;
      const adminId = req.admin?.id || 'unknown';

      const report = await reportsService.generateMenuPerformanceReport(
        new Date(startDate),
        new Date(endDate),
        adminId
      );

      if (format === 'csv') {
        const csvData = ReportExporter.exportToCSV(report, `menu-report-${report.reportId}`);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="menu-report-${report.reportId}.csv"`);
        res.send(csvData);
        return;
      }

      if (format === 'excel') {
        const excelBuffer = ReportExporter.exportToExcel(report, `menu-report-${report.reportId}`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="menu-report-${report.reportId}.xlsx"`);
        res.send(excelBuffer);
        return;
      }

      this.sendSuccess(res, report);
    } catch (error) {
      console.error('Menu report generation error:', error);
      this.sendError(res, 'Failed to generate menu report', 500);
    }
  }

  async generateDailySalesReport(req: AdminAuthRequest, res: Response): Promise<void> {
    try {
      const { date, format = 'json' } = req.body;
      const adminId = req.admin?.id || 'unknown';
      
      const reportDate = date ? new Date(date) : new Date();
      const startDate = new Date(reportDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(reportDate);
      endDate.setHours(23, 59, 59, 999);

      const report = await reportsService.generateSalesReport(
        startDate,
        endDate,
        adminId,
        'daily'
      );

      // Add daily-specific calculations
      const dailyReport = {
        ...report,
        title: `Daily Sales Report - ${reportDate.toDateString()}`,
        dailyMetrics: {
          hourlyBreakdown: await this.getHourlyBreakdown(startDate, endDate),
          peakHour: await this.getPeakHour(startDate, endDate),
          averageOrdersPerHour: report.summary.totalOrders / 24
        }
      };

      if (format === 'csv') {
        const csvData = ReportExporter.exportToCSV(dailyReport, `daily-sales-${reportDate.toISOString().split('T')[0]}`);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="daily-sales-${reportDate.toISOString().split('T')[0]}.csv"`);
        res.send(csvData);
        return;
      }

      this.sendSuccess(res, dailyReport);
    } catch (error) {
      console.error('Daily sales report generation error:', error);
      this.sendError(res, 'Failed to generate daily sales report', 500);
    }
  }

  async getReportHistory(req: AdminAuthRequest, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const adminId = req.admin?.id || 'unknown';

      const history = await reportsService.getReportHistory(adminId, limit);
      
      this.sendSuccess(res, {
        reports: history,
        total: history.length,
        limit
      });
    } catch (error) {
      console.error('Report history error:', error);
      this.sendError(res, 'Failed to get report history', 500);
    }
  }

  private async getHourlyBreakdown(startDate: Date, endDate: Date) {
    const prisma = new (require('@prisma/client').PrismaClient)();
    const hourlyData = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: 'COMPLETED'
      },
      select: {
        createdAt: true,
        total: true
      }
    });

    const hourlyBreakdown = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      orders: 0,
      revenue: 0
    }));

    hourlyData.forEach((order: any) => {
      const hour = order.createdAt.getHours();
      hourlyBreakdown[hour].orders += 1;
      hourlyBreakdown[hour].revenue += order.total;
    });

    return hourlyBreakdown.map(h => ({
      ...h,
      revenue: h.revenue / 100 // Convert from cents
    }));
  }

  private async getPeakHour(startDate: Date, endDate: Date) {
    const hourlyBreakdown = await this.getHourlyBreakdown(startDate, endDate);
    return hourlyBreakdown.reduce((peak, current) => 
      current.orders > peak.orders ? current : peak
    );
  }
}

export const reportsController = new ReportsController();