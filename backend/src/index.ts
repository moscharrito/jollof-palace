import dotenv from 'dotenv';
import { createServer } from 'http';
import app from './app';
import { connectRedis } from './lib/redis';
import { prisma } from './lib/database';
import { initializeSocket } from './lib/socket';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3001;

// Validate critical environment variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0 && process.env.NODE_ENV === 'production') {
  console.error('❌ Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

async function startServer() {
  try {
    // Connect to Redis (optional)
    try {
      await connectRedis();
      console.log('✅ Redis connected successfully');
    } catch (redisError) {
      console.warn('⚠️ Redis connection failed, continuing without cache:', redisError);
    }

    // Test database connection
    try {
      await prisma.$connect();
      console.log('✅ Database connected successfully');
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError);
      if (process.env.NODE_ENV === 'production') {
        console.error('💥 Cannot start server without database in production');
        process.exit(1);
      }
      throw dbError;
    }

    // Create HTTP server
    const server = createServer(app);

    // Initialize Socket.io
    const socketManager = initializeSocket(server);
    console.log('✅ Socket.io initialized');

    // Start the server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`🔌 Socket.io ready for connections`);
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down server...');
      
      try {
        await prisma.$disconnect();
        console.log('✅ Database disconnected');
        
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

startServer();