import { Pool } from 'pg';
import { createTables, generateTimeSlots } from './models';

const initializeDatabase = async () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Creating tables...');
    await createTables(pool);
    
    console.log('Generating time slots...');
    await generateTimeSlots(pool, 30); // Generate slots for the next 30 days
    
    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await pool.end();
  }
};

// Run the initialization
initializeDatabase(); 