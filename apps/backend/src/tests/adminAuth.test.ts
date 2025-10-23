import request from 'supertest';
import app from '../app';
import { prisma } from '../lib/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

describe('Admin Authentication and Authorization', () => {
  let adminUser: any;
  let managerUser: any;
  let staffUser: any;
  let adminToken: string;
  let managerToken: string;
  let staffToken: string;

  beforeAll(async () => {
    // Clean up existing test data
    await prisma.adminUser.deleteMany({
      where: {
        email: {
          in: ['test-admin@test.com', 'test-manager@test.com', 'test-staff@test.com']
        }
      }
    });

    // Create test admin users
    const hashedPassword = await bcrypt.hash('testpassword123', 10);

    adminUser = await prisma.adminUser.create({
      data: {
        email: 'test-admin@test.com',
        name: 'Test Admin',
        password: hashedPassword,
        role: 'ADMIN',
        phone: '+1234567890',
        isActive: true,
      },
    });

    managerUser = await prisma.adminUser.create({
      data: {
        email: 'test-manager@test.com',
        name: 'Test Manager',
        password: hashedPassword,
        role: 'MANAGER',
        phone: '+1234567891',
        isActive: true,
      },
    });

    staffUser = await prisma.adminUser.create({
      data: {
        email: 'test-staff@test.com',
        name: 'Test Staff',
        password: hashedPassword,
        role: 'STAFF',
        phone: '+1234567892',
        isActive: true,
      },
    });

    // Generate tokens for testing
    adminToken = jwt.sign(
      { adminId: adminUser.id, email: adminUser.email, role: adminUser.role },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    managerToken = jwt.sign(
      { adminId: managerUser.id, email: managerUser.email, role: managerUser.role },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    staffToken = jwt.sign(
      { adminId: staffUser.id, email: staffUser.email, role: staffUser.role },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.adminUser.deleteMany({
      where: {
        email: {
          in: ['test-admin@test.com', 'test-manager@test.com', 'test-staff@test.com']
        }
      }
    });
  });

  describe('POST /api/admin/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/admin/login')
        .send({
          email: 'test-admin@test.com',
          password: 'testpassword123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).not.toHaveProperty('password');
      expect(response.body.data.user.email).toBe('test-admin@test.com');
      expect(response.body.data.user.role).toBe('ADMIN');
    });

    it('should fail with invalid email', async () => {
      const response = await request(app)
        .post('/api/admin/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'testpassword123',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should fail with invalid password', async () => {
      const response = await request(app)
        .post('/api/admin/login')
        .send({
          email: 'test-admin@test.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should fail with missing credentials', async () => {
      const response = await request(app)
        .post('/api/admin/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail for deactivated account', async () => {
      // Deactivate the admin user
      await prisma.adminUser.update({
        where: { id: adminUser.id },
        data: { isActive: false },
      });

      const response = await request(app)
        .post('/api/admin/login')
        .send({
          email: 'test-admin@test.com',
          password: 'testpassword123',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Account is deactivated');

      // Reactivate for other tests
      await prisma.adminUser.update({
        where: { id: adminUser.id },
        data: { isActive: true },
      });
    });
  });

  describe('GET /api/admin/profile', () => {
    it('should get profile with valid token', async () => {
      const response = await request(app)
        .get('/api/admin/profile')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('email');
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data).toHaveProperty('role');
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .get('/api/admin/profile');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/admin/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/admin/profile', () => {
    it('should update profile successfully', async () => {
      const updateData = {
        name: 'Updated Admin Name',
        phone: '+9876543210',
      };

      const response = await request(app)
        .put('/api/admin/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.phone).toBe(updateData.phone);
    });

    it('should fail to update with duplicate email', async () => {
      const response = await request(app)
        .put('/api/admin/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'test-manager@test.com', // Manager's email
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email is already in use');
    });
  });

  describe('POST /api/admin/refresh-token', () => {
    it('should refresh token successfully', async () => {
      const response = await request(app)
        .post('/api/admin/refresh-token')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('expiresIn');
    });

    it('should fail without valid token', async () => {
      const response = await request(app)
        .post('/api/admin/refresh-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Role-based Authorization', () => {
    it('should allow admin access to admin-only routes', async () => {
      // This test will be expanded when we implement admin-only routes
      const response = await request(app)
        .get('/api/admin/profile')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    it('should allow manager access to manager routes', async () => {
      const response = await request(app)
        .get('/api/admin/profile')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(response.status).toBe(200);
    });

    it('should allow staff access to basic routes', async () => {
      const response = await request(app)
        .get('/api/admin/profile')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('Token Validation', () => {
    it('should reject expired tokens', async () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        { adminId: adminUser.id, email: adminUser.email, role: adminUser.role },
        process.env.JWT_SECRET!,
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const response = await request(app)
        .get('/api/admin/profile')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject malformed tokens', async () => {
      const response = await request(app)
        .get('/api/admin/profile')
        .set('Authorization', 'Bearer malformed.token.here');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject tokens without Bearer prefix', async () => {
      const response = await request(app)
        .get('/api/admin/profile')
        .set('Authorization', adminToken);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Session Management', () => {
    it('should update lastLoginAt on successful login', async () => {
      const beforeLogin = new Date();
      
      await request(app)
        .post('/api/admin/login')
        .send({
          email: 'test-admin@test.com',
          password: 'testpassword123',
        });

      const updatedUser = await prisma.adminUser.findUnique({
        where: { id: adminUser.id },
        select: { lastLoginAt: true },
      });

      expect(updatedUser?.lastLoginAt).toBeDefined();
      expect(updatedUser?.lastLoginAt!.getTime()).toBeGreaterThanOrEqual(beforeLogin.getTime());
    });
  });
});