import request from 'supertest';
import express from 'express';
import { Server } from 'socket.io';
import { setupRoutes } from './routes';
import { query } from './db';

jest.mock('./db');
jest.mock('socket.io');

describe('API Routes', () => {
  let app: express.Application;
  let io: Server;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    io = new Server();
    setupRoutes(app, io);
    jest.clearAllMocks();
  });

  const mockQuery = query as jest.Mock;
  const mockSlots = [
    {
      id: 1,
      start_time: '2024-03-20T09:00:00Z',
      end_time: '2024-03-20T10:00:00Z',
      status: 'available'
    }
  ];

  describe('GET /api/slots', () => {
    it('should return all available slots', async () => {
      mockQuery.mockResolvedValueOnce({ rows: mockSlots });

      const response = await request(app)
        .get('/api/slots')
        .expect(200);

      expect(response.body).toEqual(mockSlots);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM time_slots'),
        ['available']
      );
    });
  });

  describe('POST /api/slots/{id}/reserve', () => {
    it('should reserve a slot by ID', async () => {
      const reservedSlot = { ...mockSlots[0], status: 'reserved' };
      mockQuery.mockResolvedValueOnce({ rows: [reservedSlot] });

      const response = await request(app)
        .post('/api/slots/1/reserve')
        .set('X-Test-Override-Rate-Limit', 'true')
        .expect(200);

      expect(response.body).toEqual(reservedSlot);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE time_slots'),
        [1]
      );
    });

    it('should reserve a slot by start_time', async () => {
      const reservedSlot = { ...mockSlots[0], status: 'reserved' };
      mockQuery.mockResolvedValueOnce({ rows: [reservedSlot] });

      const response = await request(app)
        .post('/api/slots/1/reserve')
        .set('X-Test-Override-Rate-Limit', 'true')
        .send({ start_time: '2024-03-20T09:00:00Z' })
        .expect(200);

      expect(response.body).toEqual(reservedSlot);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE time_slots'),
        ['2024-03-20T09:00:00Z']
      );
    });

    it('should return 400 when slot is not available', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/slots/1/reserve')
        .set('X-Test-Override-Rate-Limit', 'true')
        .expect(400);

      expect(response.body).toEqual({ error: 'Slot not available' });
    });
  });

  describe('POST /api/slots/next-week', () => {
    beforeEach(() => {
      // Mock Date.now() to return a fixed date
      const mockDate = new Date('2024-03-20T00:00:00Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return available slots for the specified number of days', async () => {
      const availableSlots = [
        {
          id: 1,
          start_time: '2024-03-20T09:00:00Z',
          end_time: '2024-03-20T10:00:00Z',
          status: 'available'
        }
      ];
      mockQuery.mockResolvedValueOnce({ rows: availableSlots });

      const response = await request(app)
        .post('/api/slots/next-week')
        .send({ days: 5 })
        .expect(200);

      expect(response.body).toEqual(availableSlots);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM time_slots'),
        expect.any(Array)
      );
    });

    it('should return 400 for invalid days parameter', async () => {
      const response = await request(app)
        .post('/api/slots/next-week')
        .send({ days: 'invalid' })
        .expect(400);

      expect(response.body).toEqual({ error: 'Days parameter must be between 1 and 10' });
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('should return 400 when days parameter is missing', async () => {
      const response = await request(app)
        .post('/api/slots/next-week')
        .send({})
        .expect(400);

      expect(response.body).toEqual({ error: 'Days parameter must be between 1 and 10' });
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('should return 500 on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .post('/api/slots/next-week')
        .send({ days: 5 })
        .expect(500);

      expect(response.body).toEqual({ error: 'Internal server error' });
    });
  });
}); 