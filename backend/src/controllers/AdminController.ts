import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { BaseController } from './BaseController';
import { AdminAuthRequest } from '../middleware/adminAuth';

const prisma = new PrismaClient();

interface LoginRequest {
  email: string;
  password: string;
}

export class AdminController extends BaseController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password }: LoginRequest = req.body;

      // Validate input
      if (!email || !password) {
        this.sendError(res, 'Email and password are required', 400);
        return;
      }

      // Find admin user
      const admin = await prisma.adminUser.findUnique({
        where: { email: email.toLowerCase() },
        select: {
          id: true,
          email: true,
          name: true,
          password: true,
          role: true,
          isActive: true,
          phone: true,
        },
      });

      if (!admin) {
        this.sendError(res, 'Invalid email or password', 401);
        return;
      }

      if (!admin.isActive) {
        this.sendError(res, 'Account is deactivated', 401);
        return;
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, admin.password);
      if (!isPasswordValid) {
        this.sendError(res, 'Invalid email or password', 401);
        return;
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          adminId: admin.id,
          email: admin.email,
          role: admin.role 
        },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      // Update last login time
      await prisma.adminUser.update({
        where: { id: admin.id },
        data: { lastLoginAt: new Date() },
      });

      // Return user data (without password) and token
      const { password: _, ...userWithoutPassword } = admin;
      
      this.sendSuccess(res, {
        user: userWithoutPassword,
        token,
        expiresIn: '7d'
      }, 'Login successful');
    } catch (error) {
      console.error('Admin login error:', error);
      this.sendError(res, 'Login failed', 500);
    }
  }

  async getProfile(req: AdminAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.admin) {
        this.sendError(res, 'Admin not found in request', 401);
        return;
      }

      // Get fresh admin data from database
      const admin = await prisma.adminUser.findUnique({
        where: { id: req.admin.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!admin) {
        this.sendError(res, 'Admin not found', 404);
        return;
      }

      this.sendSuccess(res, admin, 'Profile retrieved successfully');
    } catch (error) {
      console.error('Get admin profile error:', error);
      this.sendError(res, 'Failed to retrieve profile', 500);
    }
  }

  async updateProfile(req: AdminAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.admin) {
        this.sendError(res, 'Admin not found in request', 401);
        return;
      }

      const { name, email, phone } = req.body;
      const updateData: any = {};

      // Only update provided fields
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email.toLowerCase();
      if (phone !== undefined) updateData.phone = phone;

      // Check if email is already taken by another admin
      if (email && email !== req.admin.email) {
        const existingAdmin = await prisma.adminUser.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (existingAdmin) {
          this.sendError(res, 'Email is already in use', 400);
          return;
        }
      }

      // Update admin profile
      const updatedAdmin = await prisma.adminUser.update({
        where: { id: req.admin.id },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      this.sendSuccess(res, updatedAdmin, 'Profile updated successfully');
    } catch (error) {
      console.error('Update admin profile error:', error);
      this.sendError(res, 'Failed to update profile', 500);
    }
  }

  async getOrders(req: AdminAuthRequest, res: Response): Promise<void> {
    // Implementation will be added in the next task (Order Management Interface)
    this.sendError(res, 'Order management not implemented yet', 501);
  }

  async updateOrderStatus(req: AdminAuthRequest, res: Response): Promise<void> {
    // Implementation will be added in the next task (Order Management Interface)
    this.sendError(res, 'Order status update not implemented yet', 501);
  }

  async refreshToken(req: AdminAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.admin) {
        this.sendError(res, 'Admin not found in request', 401);
        return;
      }

      // Generate new JWT token
      const token = jwt.sign(
        { 
          adminId: req.admin.id,
          email: req.admin.email,
          role: req.admin.role 
        },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      this.sendSuccess(res, {
        token,
        expiresIn: '7d'
      }, 'Token refreshed successfully');
    } catch (error) {
      console.error('Token refresh error:', error);
      this.sendError(res, 'Failed to refresh token', 500);
    }
  }
}

export const adminController = new AdminController();