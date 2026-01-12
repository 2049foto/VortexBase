/**
 * VORTEX PROTOCOL - DATABASE CLIENT
 * Drizzle ORM with Neon Serverless PostgreSQL
 */

import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

import * as schema from './schema';

// Configure Neon for serverless
neonConfig.fetchConnectionCache = true;

// Create database connection
function createDbClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const sql = neon(connectionString);

  return drizzle(sql, {
    schema,
    logger: process.env.DRIZZLE_LOG_LEVEL === 'debug',
  });
}

// Singleton database instance
let dbInstance: ReturnType<typeof createDbClient> | null = null;

export function getDb() {
  if (!dbInstance) {
    dbInstance = createDbClient();
  }
  return dbInstance;
}

// Export for direct use
export const db = getDb();

// Export schema
export * from './schema';

// Export type
export type Database = ReturnType<typeof createDbClient>;
