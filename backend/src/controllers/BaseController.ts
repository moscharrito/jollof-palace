import { Request, Response } from 'express';

export abstract class BaseController {
  protected sendSuccess<T>(
    res: Response,
    data?: T,
    message?: string,
    statusCode: number = 200
  ): void {
    res.status(statusCode).json({
      success: true,
      ...(data !== undefined && { data }),
      ...(message && { message }),
    });
  }

  protected sendPaginatedSuccess<T>(
    res: Response,
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    },
    message?: string
  ): void {
    res.status(200).json({
      success: true,
      data,
      pagination,
      ...(message && { message }),
    });
  }

  protected sendError(
    res: Response,
    message: string,
    statusCode: number = 400,
    code?: string
  ): void {
    res.status(statusCode).json({
      success: false,
      error: {
        code: code || 'ERROR',
        message,
        timestamp: new Date().toISOString(),
      },
    });
  }

  protected getPagination(req: Request): {
    page: number;
    limit: number;
    skip: number;
  } {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    return { page, limit, skip };
  }

  protected calculateTotalPages(total: number, limit: number): number {
    return Math.ceil(total / limit);
  }
}