import { Pool } from 'pg';
import { createTables, generateTimeSlots, TimeSlot } from './models';

// Mock the pg Pool
jest.mock('pg', () => {
  const mockPool = {
    connect: jest.fn(),
    query: jest.fn(),
  };
  return { Pool: jest.fn(() => mockPool) };
});

describe('Database Models', () => {
  let pool: Pool;
  let mockClient: any;

  beforeEach(() => {
    pool = new Pool();
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    (pool.connect as jest.Mock).mockResolvedValue(mockClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTables', () => {
    it('should create tables and indexes', async () => {
      await createTables(pool);

      expect(mockClient.query).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE'));
      expect(mockClient.query).toHaveBeenCalledWith(expect.stringContaining('CREATE INDEX'));
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockClient.query.mockRejectedValueOnce(new Error('Database error'));

      await expect(createTables(pool)).rejects.toThrow('Database error');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('generateTimeSlots', () => {
    it('should generate slots for the specified number of days', async () => {
      const days = 2;
      await generateTimeSlots(pool, days);

      // Should generate 24 slots (12 hours * 2 days)
      expect(mockClient.query).toHaveBeenCalledTimes(24);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should generate slots with correct time intervals', async () => {
      const days = 1;
      await generateTimeSlots(pool, days);

      // Check first and last slot times
      const firstCall = mockClient.query.mock.calls[0];
      const lastCall = mockClient.query.mock.calls[11];

      expect(firstCall[1][0].getHours()).toBe(8); // First slot at 8 AM
      expect(lastCall[1][0].getHours()).toBe(19); // Last slot at 7 PM
    });

    it('should handle errors gracefully', async () => {
      mockClient.query.mockRejectedValueOnce(new Error('Database error'));

      await expect(generateTimeSlots(pool, 1)).rejects.toThrow('Database error');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });
}); 