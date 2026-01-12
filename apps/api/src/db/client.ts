/**
 * VORTEX API - Database Client
 * Neon PostgreSQL with Drizzle ORM
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon, NeonQueryFunction } from '@neondatabase/serverless';

import { env } from '../env';
import * as schema from './schema';

// Create Neon SQL function
const sql: NeonQueryFunction<boolean, boolean> = neon(env.DATABASE_URL);

// Create Drizzle instance with schema for type-safe queries
export const db = drizzle(sql, { 
  schema,
  logger: env.NODE_ENV === 'development',
});

export type Database = typeof db;

// Re-export schema for convenience
export { schema };
