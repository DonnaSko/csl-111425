import { PrismaClient } from '@prisma/client';

// Create a single PrismaClient instance to avoid connection leaks
// This follows Prisma's best practice for serverless/server environments
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Configure connection pool settings properly
// Prisma Client manages its own connection pool internally
// We need to ensure the connection string has proper timeout settings
// to prevent connections from being held indefinitely
const getDatabaseUrlWithPoolSettings = () => {
  const dbUrl = process.env.DATABASE_URL || '';
  
  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  
  // Safely add connection parameters to prevent connection leaks
  // PostgreSQL connection string parameters:
  // - connect_timeout: Time to wait for a connection (seconds)
  // - statement_timeout: Maximum time a query can run (milliseconds)  
  // - pool_timeout: Time to wait for a connection from the pool (seconds)
  
  // Check if parameters are already present (case-insensitive check)
  const hasConnectTimeout = /[?&]connect_timeout=/i.test(dbUrl);
  const hasStatementTimeout = /[?&]statement_timeout=/i.test(dbUrl);
  const hasPoolTimeout = /[?&]pool_timeout=/i.test(dbUrl);
  
  // If all parameters are already set, return the URL as-is
  if (hasConnectTimeout && hasStatementTimeout && hasPoolTimeout) {
    return dbUrl;
  }
  
  // Build the parameter string safely
  const params: string[] = [];
  
  // Add timeout parameters if not already present
  if (!hasConnectTimeout) {
    params.push('connect_timeout=10');
  }
  if (!hasStatementTimeout) {
    params.push('statement_timeout=30000'); // 30 seconds - prevents long-running queries
  }
  if (!hasPoolTimeout) {
    params.push('pool_timeout=10');
  }
  
  // Safely append parameters to the connection string
  // Handle both ? and & separators correctly
  if (params.length > 0) {
    const separator = dbUrl.includes('?') ? '&' : '?';
    return `${dbUrl}${separator}${params.join('&')}`;
  }
  
  // Return original URL if no parameters to add
  return dbUrl;
};

// Get the database URL with proper pool settings
const databaseUrl = getDatabaseUrlWithPoolSettings();

// Prisma Client connection pool configuration
// Prisma Client by default uses a connection pool with:
// - Maximum 10 connections per instance
// - Connections are reused and managed automatically
// - Connections are released back to the pool after queries complete
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    // Prisma automatically manages connection pooling
    // We ensure proper cleanup and connection release via:
    // 1. Proper error handling in all route handlers
    // 2. Graceful shutdown handlers
    // 3. Connection timeouts to prevent hanging connections
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
// This helps identify connection leaks during development
if (process.env.NODE_ENV === 'development') {
  let monitoringInterval: NodeJS.Timeout | null = null;
  
  const monitorConnections = async () => {
    try {
      // Get active connections for the current database
      const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT count(*) as count 
        FROM pg_stat_activity 
        WHERE datname = current_database()
        AND state != 'idle'
      `;
      const activeConnections = Number(result[0]?.count || 0);
      
      // Warn if we have more than 5 active connections (Prisma default max is 10)
      // This indicates potential connection leaks
      if (activeConnections > 5) {
        console.warn(`⚠️  High active connection count: ${activeConnections} connections`);
        console.warn(`   Prisma Client pool max: 10 connections`);
        console.warn(`   Consider checking for connection leaks or long-running queries`);
      } else {
        console.log(`✓ Connection pool healthy: ${activeConnections} active connections`);
      }
      
      // Also check for idle connections that might be stuck
      const idleResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT count(*) as count 
        FROM pg_stat_activity 
        WHERE datname = current_database()
        AND state = 'idle'
        AND state_change < now() - interval '5 minutes'
      `;
      const staleIdleConnections = Number(idleResult[0]?.count || 0);
      if (staleIdleConnections > 0) {
        console.warn(`⚠️  Found ${staleIdleConnections} stale idle connections (idle > 5 minutes)`);
      }
    } catch (error) {
      // Silently fail - this is just monitoring
      // Don't log errors as they might be connection-related
    }
  };
  
  // Start monitoring after a short delay to let the app initialize
  setTimeout(() => {
    monitoringInterval = setInterval(monitorConnections, 60000); // Check every minute
    console.log('🔍 Database connection monitoring started');
  }, 5000);
  
  // Cleanup monitoring on shutdown
  const cleanupMonitoring = () => {
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
      monitoringInterval = null;
    }
  };
  
  process.on('SIGINT', cleanupMonitoring);
  process.on('SIGTERM', cleanupMonitoring);
}

// Handle graceful shutdown - ensure connections are properly closed
// This is critical to prevent connection leaks
let isDisconnecting = false;

const disconnect = async () => {
  if (isDisconnecting) {
    return; // Prevent multiple disconnect calls
  }
  isDisconnecting = true;
  
  try {
    console.log('🔄 Closing database connections...');
    // Prisma will automatically close all connections in the pool
    await prisma.$disconnect();
    console.log('✅ Database connections closed gracefully');
  } catch (error) {
    console.error('❌ Error closing database connections:', error);
    // Force exit even if disconnect fails
  }
};

// Register shutdown handlers - ensure connections are always released
// These handlers are critical for preventing connection leaks
process.on('beforeExit', async () => {
  await disconnect();
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  await disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  await disconnect();
  process.exit(0);
});

// Handle uncaught exceptions to ensure cleanup
process.on('uncaughtException', async (error) => {
  console.error('❌ Uncaught Exception:', error);
  await disconnect();
  process.exit(1);
});

// Handle unhandled promise rejections
// These can cause connection leaks if database queries fail without proper cleanup
process.on('unhandledRejection', async (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise);
  console.error('   Reason:', reason);
  // Log but don't exit - let the app continue but log for debugging
  // This helps identify queries that aren't properly awaited
});

export default prisma;

