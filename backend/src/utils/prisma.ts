import { PrismaClient } from '@prisma/client';

// Create a single PrismaClient instance to avoid connection leaks
// This follows Prisma's best practice for serverless/server environments
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Configure connection pool settings
// For PostgreSQL, connection_limit is set via DATABASE_URL query parameters
const getDatabaseUrlWithPoolLimit = () => {
  const dbUrl = process.env.DATABASE_URL || '';
  
  // Check if connection_limit is already set
  if (dbUrl.includes('connection_limit=')) {
    return dbUrl;
  }
  
  // Add connection_limit=3 to the connection string (reduced from 5)
  // This limits the maximum number of connections in the pool to 3
  // Also set pool_timeout and statement_timeout to ensure connections are released promptly
  // statement_timeout=30000 means queries will timeout after 30 seconds
  const separator = dbUrl.includes('?') ? '&' : '?';
  return `${dbUrl}${separator}connection_limit=3&pool_timeout=5&statement_timeout=30000`;
};

// Get the database URL with pool limit configured
const databaseUrl = getDatabaseUrlWithPoolLimit();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    // Connection pool configuration
    // Prisma automatically manages the pool, but we set limits via connection string
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Connection health check function
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
};

// Monitor connection pool (optional - for debugging)
if (process.env.NODE_ENV === 'development') {
  // Log connection pool status periodically in development
  setInterval(async () => {
    try {
      const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT count(*) as count FROM pg_stat_activity WHERE datname = current_database()
      `;
      const activeConnections = Number(result[0]?.count || 0);
      if (activeConnections > 4) {
        console.warn(`⚠️  High connection count: ${activeConnections} active connections`);
      }
    } catch (error) {
      // Silently fail - this is just monitoring
    }
  }, 60000); // Check every minute
}

// Handle graceful shutdown - ensure connections are properly closed
const disconnect = async () => {
  try {
    await prisma.$disconnect();
    console.log('✅ Database connections closed gracefully');
  } catch (error) {
    console.error('❌ Error closing database connections:', error);
  }
};

// Register shutdown handlers
process.on('beforeExit', disconnect);
process.on('SIGINT', async () => {
  await disconnect();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await disconnect();
  process.exit(0);
});

// Handle uncaught exceptions to ensure cleanup
process.on('uncaughtException', async (error) => {
  console.error('Uncaught Exception:', error);
  await disconnect();
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit on unhandled rejection, but log it
});

export default prisma;

