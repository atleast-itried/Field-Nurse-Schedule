import { Pool, QueryResult } from 'pg';

export interface TimeSlot {
  id: number;
  start_time: Date;
  end_time: Date;
  status: 'available' | 'reserved';
  nurse_id?: string;
  created_at?: Date;
  updated_at?: Date;
}

export const createTables = async (pool: Pool): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS time_slots (
        id SERIAL PRIMARY KEY,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'available',
        nurse_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(start_time)
      );
      
      CREATE INDEX IF NOT EXISTS idx_time_slots_date 
      ON time_slots (date_trunc('day', start_time));
      
      CREATE INDEX IF NOT EXISTS idx_time_slots_status 
      ON time_slots (status);
    `);
  } finally {
    client.release();
  }
};

export const generateTimeSlots = async (pool: Pool, days: number = 30): Promise<void> => {
  const client = await pool.connect();
  try {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const slots: Omit<TimeSlot, 'id' | 'created_at' | 'updated_at'>[] = [];
    let currentDate = new Date(startDate);

    while (currentDate < endDate) {
      // Generate slots for each day from 8 AM to 8 PM
      for (let hour = 8; hour < 20; hour++) {
        const startTime = new Date(currentDate);
        startTime.setHours(hour, 0, 0, 0);
        
        const endTime = new Date(currentDate);
        endTime.setHours(hour + 1, 0, 0, 0);

        slots.push({
          start_time: startTime,
          end_time: endTime,
          status: 'available'
        });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Insert slots in batches
    for (const slot of slots) {
      await client.query(
        `INSERT INTO time_slots (start_time, end_time, status)
         VALUES ($1, $2, $3)
         ON CONFLICT (start_time) DO NOTHING`,
        [slot.start_time, slot.end_time, slot.status]
      );
    }
  } finally {
    client.release();
  }
}; 