import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, AdminRole } from '@prisma/client';
import { UnauthorizedError, ForbiddenError } from './errorHandler';

const prisma = new PrismaClient();

export interface AdminAuthRequest extends Request {
  admin?: {
    id: string;
    email: string;
    role: AdminRole;
    name: string;
  };
}

/**
 * Middleware to authenticate admin users
 */
export const authenticateAdmin = async (
  req: AdminAuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Access token required');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      throw new UnauthorizedError('Access token required');
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    if (!decoded.adminId) {
      throw new UnauthorizedError('Invalid token format');
    }

    // Get admin user from database
    const admin = await prisma.adminUser.findUnique({
      where: { id: decoded.adminId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    if (!admin) {
      throw new UnauthorizedError('Admin user not found');
    }

    if (!admin.isActive) {
      throw new UnauthorizedError('Admin account is deactivated');
    }

    // Attach admin info to request
    req.admin = admin;
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
        error: 'INVALID_TOKEN',
      });
    }
    
    if (error instanceof UnauthorizedError) {
      return res.status(401).json({
        success: false,
        message: error.message,
        error: 'UNAUTHORIZED',
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: 'AUTH_ERROR',
    });
  }
};

/**
 * Middleware to authorize admin users based on roles
 */
export const authorizeAdmin = (allowedRoles: AdminRole[]) => {
  return (req: AdminAuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.admin) {
        throw new UnauthorizedError('Admin authentication required');
      }

      if (!allowedRoles.includes(req.admin.role)) {
        throw new ForbiddenError('Insufficient permissions');
      }

      next();
    } catch (error) {
      if (error instanceof ForbiddenError) {
        return res.status(403).json({
          success: false,
          message: error.message,
          error: 'FORBIDDEN',
        });
      }
      
      if (error instanceof UnauthorizedError) {
        return res.status(401).json({
          success: false,
          message: error.message,
          error: 'UNAUTHORIZED',
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Authorization error',
        error: 'AUTH_ERROR',
      });
    }
  };
};

/**
 * Middleware to check if admin is ADMIN role (highest permission)
 */
export const requireAdminRole = authorizeAdmin(['ADMIN']);

/**
 * Middleware to check if admin is ADMIN or MANAGER role
 */
export const requireManagerRole = authorizeAdmin(['ADMIN', 'MANAGER']);

/**
 * Middleware to check if admin has any admin role (ADMIN, MANAGER, or STAFF)
 */
export const requireAnyAdminRole = authorizeAdmin(['ADMIN', 'MANAGER', 'STAFF']);

/**
 * Optional admin authentication - doesn't fail if no token provided
 */
export const optionalAdminAuth = async (
  req: AdminAuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without admin info
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      return next(); // Continue without admin info
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    if (decoded.adminId) {
      const admin = await prisma.adminUser.findUnique({
        where: { id: decoded.adminId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
        },
      });

      if (admin && admin.isActive) {
        req.admin = admin;
      }
    }
    
    next();
  } catch (error) {
    // Ignore token errors in optional auth
    next();
  }
};