import { Router } from 'express';
import express from 'express';
import request from 'supertest';
import { Server } from 'socket.io';
import { setupRoutes } from './routes';
import { query } from './db';

// Mock the database query function
jest.mock('./db', () => ({
  query: jest.fn(),
}));

describe('API Routes', () => {
  let app: express.Application;
  let router: Router;
  let io: Server;
  let mockQuery: jest.Mock;

  beforeEach(() => {
    app = express();
    router = Router();
    io = {
      emit: jest.fn(),
    } as any;
    mockQuery = query as jest.Mock;
    setupRoutes(app, io);
    app.use(express.json());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/slots/:date', () => {
    it('should return slots for a specific date', async () => {
      const mockSlots = [
        { id: 1, start_time: '2024-01-01T08:00:00Z', end_time: '2024-01-01T09:00:00Z', status: 'available' },
      ];
      mockQuery.mockResolvedValueOnce({ rows: mockSlots });

      const res = await request(app)
        .get('/api/slots/2024-01-01')
        .expect(200);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM time_slots'),
        ['2024-01-01']
      );
      expect(res.body).toEqual(mockSlots);
    });

    it('should handle database errors', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      const res = await request(app)
        .get('/api/slots/2024-01-01')
        .expect(500);

      expect(res.body).toEqual({ error: 'Failed to fetch slots' });
    });

    it('should validate date format', async () => {
      const res = await request(app)
        .get('/api/slots/invalid-date')
        .expect(400);

      expect(res.body).toEqual({ error: 'Invalid date format. Use YYYY-MM-DD' });
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('should reject dates too far in the future', async () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 4); // 4 months in the future
      const dateString = futureDate.toISOString().split('T')[0];

      const res = await request(app)
        .get(`/api/slots/${dateString}`)
        .expect(400);

      expect(res.body).toEqual({ error: 'Date must be within the next 3 months' });
      expect(mockQuery).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/slots/:id/reserve', () => {
    it('should reserve a slot successfully', async () => {
      const mockSlot = {
        id: 1,
        start_time: '2024-01-01T08:00:00Z',
        end_time: '2024-01-01T09:00:00Z',
        status: 'reserved',
        nurse_id: 'nurse-1',
      };
      mockQuery.mockResolvedValueOnce({ rows: [mockSlot] });

      const res = await request(app)
        .post('/api/slots/1/reserve')
        .send({ nurse_id: 'nurse-1' })
        .expect(200);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE time_slots'),
        ['nurse-1', '1']
      );
      expect(io.emit).toHaveBeenCalledWith('slotUpdated', mockSlot);
      expect(res.body).toEqual(mockSlot);
    });

    it('should handle unavailable slots', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .post('/api/slots/1/reserve')
        .send({ nurse_id: 'nurse-1' })
        .expect(400);

      expect(res.body).toEqual({ error: 'Slot not available' });
    });

    it('should return error when nurse_id is missing', async () => {
      const res = await request(app)
        .post('/api/slots/1/reserve')
        .send({})
        .expect(400);

      expect(res.body).toEqual({ error: 'nurse_id is required' });
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('should handle rate limiting for multiple quick reservations', async () => {
      const mockSlot = {
        id: 1,
        start_time: '2024-01-01T08:00:00Z',
        end_time: '2024-01-01T09:00:00Z',
        status: 'reserved',
        nurse_id: 'nurse-1',
      };
      mockQuery.mockResolvedValue({ rows: [mockSlot] });

      // Make multiple requests in quick succession
      await Promise.all([
        request(app)
          .post('/api/slots/1/reserve')
          .send({ nurse_id: 'nurse-1' })
          .expect(429),
        request(app)
          .post('/api/slots/1/reserve')
          .send({ nurse_id: 'nurse-1' })
          .expect(429),
        request(app)
          .post('/api/slots/1/reserve')
          .send({ nurse_id: 'nurse-1' })
          .expect(429)
      ]);
    });
  });

  describe('POST /api/slots/:id/cancel', () => {
    it('should cancel a reservation successfully', async () => {
      const mockSlot = {
        id: 1,
        start_time: '2024-01-01T08:00:00Z',
        end_time: '2024-01-01T09:00:00Z',
        status: 'available',
        nurse_id: null,
      };
      mockQuery.mockResolvedValueOnce({ rows: [mockSlot] });

      const res = await request(app)
        .post('/api/slots/1/cancel')
        .send({ nurse_id: 'nurse-1' })
        .expect(200);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE time_slots'),
        ['1', 'nurse-1']
      );
      expect(io.emit).toHaveBeenCalledWith('slotUpdated', mockSlot);
      expect(res.body).toEqual(mockSlot);
    });

    it('should handle invalid cancellations', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .post('/api/slots/1/cancel')
        .send({ nurse_id: 'nurse-1' })
        .expect(400);

      expect(res.body).toEqual({ error: 'Invalid reservation' });
    });
  });

  describe('POST /api/slots/reset', () => {
    it('should reset all reserved slots to available', async () => {
      const mockResetSlots = [
        {
          id: 1,
          start_time: '2024-01-01T08:00:00Z',
          end_time: '2024-01-01T09:00:00Z',
          status: 'available',
          nurse_id: null,
        },
        {
          id: 2,
          start_time: '2024-01-01T09:00:00Z',
          end_time: '2024-01-01T10:00:00Z',
          status: 'available',
          nurse_id: null,
        },
      ];
      mockQuery.mockResolvedValueOnce({ rows: mockResetSlots });

      const res = await request(app)
        .post('/api/slots/reset')
        .expect(200);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE time_slots'),
        []
      );
      expect(io.emit).toHaveBeenCalledTimes(2); // Once for each reset slot
      expect(res.body).toEqual({
        message: 'All slots reset to available',
        updatedSlots: mockResetSlots,
      });
    });

    it('should handle database errors when resetting slots', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      const res = await request(app)
        .post('/api/slots/reset')
        .expect(500);

      expect(res.body).toEqual({ error: 'Failed to reset slots' });
    });
  });

  describe('GET /api/slots/next-week', () => {
    it('should return available slots for the next 7 days', async () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      const dayAfterTomorrow = new Date(now);
      dayAfterTomorrow.setDate(now.getDate() + 2);

      const mockSlots = [
        {
          id: 1,
          start_time: tomorrow.toISOString(),
          end_time: new Date(tomorrow.setHours(tomorrow.getHours() + 1)).toISOString(),
          status: 'available',
        },
        {
          id: 2,
          start_time: dayAfterTomorrow.toISOString(),
          end_time: new Date(dayAfterTomorrow.setHours(dayAfterTomorrow.getHours() + 1)).toISOString(),
          status: 'available',
        },
      ];
      mockQuery.mockResolvedValueOnce({ rows: mockSlots });

      const res = await request(app)
        .get('/api/slots/next-week')
        .expect(200);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM time_slots'),
        expect.arrayContaining([
          expect.any(String), // now
          expect.any(String), // 7 days from now
        ])
      );
      expect(res.body).toEqual(mockSlots);
    });

    it('should handle database errors', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      const res = await request(app)
        .get('/api/slots/next-week')
        .expect(500);

      expect(res.body).toEqual({ error: 'Failed to fetch next week slots' });
    });
  });
}); 