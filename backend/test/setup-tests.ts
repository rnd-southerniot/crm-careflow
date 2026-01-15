// Global test setup for e2e tests
import { PrismaClient } from '@prisma/client';

// Increase timeout for e2e tests
jest.setTimeout(30000);

// Global test database setup
beforeAll(async () => {
  // Ensure test database is ready
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('✅ Test database connection established');
  } catch (error) {
    console.error('❌ Failed to connect to test database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
});