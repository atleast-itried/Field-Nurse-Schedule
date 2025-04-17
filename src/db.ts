import { Pool, PoolConfig } from 'pg';
import { createTables, generateTimeSlots } from './models';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

const pool = new Pool(poolConfig);

export const setupDatabase = async (): Promise<void> => {
  try {
    await createTables(pool);
    await generateTimeSlots(pool, 30); // Generate slots for the next 30 days
    console.log('Database connection established and tables created');
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  }
};

export const query = async (text: string, params?: any[]): Promise<any> => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Executed query', { text, duration, rows: res.rowCount });
  return res;
}; 