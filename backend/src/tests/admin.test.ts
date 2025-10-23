import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../app';
import { AdminService } from '../services/AdminService';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

describe('Admin API', () => {
  let adminToken: string;
  let adminId: string;

  beforeAll(async () => {
    // Clean up test data
    await prisma.adminUser.deleteMany({
      where: { email: { contains: 'test' } },
    });

    // Create test admin user
    const hashedPassword = await bcrypt.hash('testpassword123', 12);
    const testAdmin = await prisma.adminUser.create({
      data: {
        email: 'test.admin@example.com',
        name: 'Test Admin',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
      },
    });

    adminId = testAdmin.id;

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/admin/auth/login')
      .send({
        email: 'test.admin@example.com',
        password: 'testpassword123',
      });

    adminToken = loginResponse.body.data.token;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.adminUser.deleteMany({
      where: { email: { contains: 'test' } },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/admin/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/admin/auth/login')
        .send({
          email: 'test.admin@example.com',
          password: 'testpassword123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.admin).toHaveProperty('email', 'test.admin@example.com');
      expect(response.body.data.admin).not.toHaveProperty('password');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/admin/auth/login')
        .send({
          email: 'test.admin@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject non-existent user', async () => {
      const response = await request(app)
        .post('/api/admin/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/profile', () => {
    it('should get admin profile with valid token', async () => {
      const response = await request(app)
        .get('/api/admin/profile')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('email', 'test.admin@example.com');
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/admin/profile');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/admin/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/admin/users', () => {
    it('should create new admin user', async () => {
      const newAdminData = {
        email: 'test.newadmin@example.com',
        name: 'New Test Admin',
        role: 'MANAGER',
        phone: '+1234567890',
      };

      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newAdminData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('email', newAdminData.email);
      expect(response.body.data).toHaveProperty('role', newAdminData.role);
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('should reject duplicate email', async () => {
      const duplicateData = {
        email: 'test.admin@example.com', // Already exists
        name: 'Duplicate Admin',
        role: 'STAFF',
      };

      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(duplicateData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid role', async () => {
      const invalidData = {
        email: 'test.invalid@example.com',
        name: 'Invalid Admin',
        role: 'INVALID_ROLE',
      };

      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/users', () => {
    it('should get all admin users', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      // Check that passwords are not included
      response.body.data.forEach((admin: any) => {
        expect(admin).not.toHaveProperty('password');
      });
    });
  });

  describe('PUT /api/admin/profile', () => {
    it('should update admin profile', async () => {
      const updateData = {
        name: 'Updated Test Admin',
        phone: '+1987654321',
      };

      const response = await request(app)
        .put('/api/admin/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('name', updateData.name);
      expect(response.body.data).toHaveProperty('phone', updateData.phone);
    });

    it('should not allow role change in profile update', async () => {
      const updateData = {
        name: 'Updated Test Admin',
        role: 'STAFF', // Should be ignored
      };

      const response = await request(app)
        .put('/api/admin/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('role', 'ADMIN'); // Should remain ADMIN
    });
  });

  describe('POST /api/admin/change-password', () => {
    it('should change password with valid current password', async () => {
      const passwordData = {
        currentPassword: 'testpassword123',
        newPassword: 'newtestpassword123',
      };

      const response = await request(app)
        .post('/api/admin/change-password')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(passwordData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify new password works
      const loginResponse = await request(app)
        .post('/api/admin/auth/login')
        .send({
          email: 'test.admin@example.com',
          password: 'newtestpassword123',
        });

      expect(loginResponse.status).toBe(200);
    });

    it('should reject incorrect current password', async () => {
      const passwordData = {
        currentPassword: 'wrongpassword',
        newPassword: 'newtestpassword123',
      };

      const response = await request(app)
        .post('/api/admin/change-password')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(passwordData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/stats', () => {
    it('should get admin statistics', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalAdmins');
      expect(response.body.data).toHaveProperty('activeAdmins');
      expect(response.body.data).toHaveProperty('adminsByRole');
      expect(response.body.data).toHaveProperty('recentLogins');
    });
  });
});

describe('AdminService', () => {
  let adminService: AdminService;

  beforeAll(() => {
    adminService = new AdminService();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('createAdmin', () => {
    it('should create admin with valid data', async () => {
      const adminData = {
        email: 'test.service@example.com',
        name: 'Test Service Admin',
        role: 'STAFF' as const,
        phone: '+1234567890',
      };

      const admin = await adminService.createAdmin(adminData);

      expect(admin).toHaveProperty('id');
      expect(admin).toHaveProperty('email', adminData.email);
      expect(admin).toHaveProperty('role', adminData.role);
      expect(admin).toHaveProperty('isActive', true);

      // Clean up
      await prisma.adminUser.delete({ where: { id: admin.id } });
    });

    it('should throw error for duplicate email', async () => {
      const adminData = {
        email: 'test.admin@example.com', // Already exists
        name: 'Duplicate Admin',
        role: 'STAFF' as const,
      };

      await expect(adminService.createAdmin(adminData)).rejects.toThrow();
    });
  });

  describe('loginAdmin', () => {
    it('should return auth result for valid credentials', async () => {
      const loginData = {
        email: 'test.admin@example.com',
        password: 'newtestpassword123', // From previous test
      };

      const result = await adminService.loginAdmin(loginData);

      expect(result).toHaveProperty('admin');
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('refreshToken');
      expect(result.admin).not.toHaveProperty('password');
    });

    it('should throw error for invalid credentials', async () => {
      const loginData = {
        email: 'test.admin@example.com',
        password: 'wrongpassword',
      };

      await expect(adminService.loginAdmin(loginData)).rejects.toThrow();
    });
  });
});