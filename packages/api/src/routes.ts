import { Application, Request, Response, Router } from 'express';
import { Server } from 'socket.io';
import { query } from './db';
import { TimeSlot } from './models';
import rateLimit from 'express-rate-limit';

// Rate limiter middleware
const reservationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 2, // limit each IP to 2 requests per windowMs
  message: { error: 'Too many requests' },
  statusCode: 429,
});

// Middleware to validate nurse_id
const validateNurseId = (req: any, res: any, next: any) => {
  const { nurse_id } = req.body;
  if (!nurse_id) {
    return res.status(400).json({ error: 'nurse_id is required' });
  }
  next();
};

export const setupRoutes = (app: Application, io: Server) => {
  const router = Router();

  // Health check endpoint
  router.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  // Get all slots with optional status filter
  router.get('/slots', async (req, res) => {
    try {
      const status = req.query.status || 'available';
      const result = await query(
        `SELECT * FROM time_slots 
         WHERE status = $1 
         ORDER BY start_time`,
        [status]
      );
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching slots:', error);
      res.status(500).json({ error: 'Failed to fetch slots' });
    }
  });

  // Get available slots for a specific date
  router.get('/slots/:date', async (req, res) => {
    try {
      const { date } = req.params;

      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      }

      // Validate date range
      const requestedDate = new Date(date);
      const now = new Date();
      const threeMonthsFromNow = new Date();
      threeMonthsFromNow.setMonth(now.getMonth() + 3);

      if (requestedDate > threeMonthsFromNow) {
        return res.status(400).json({ error: 'Date must be within the next 3 months' });
      }

      const result = await query(
        `SELECT * FROM time_slots 
         WHERE date_trunc('day', start_time) = $1 
         ORDER BY start_time`,
        [date]
      );
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching slots:', error);
      res.status(500).json({ error: 'Failed to fetch slots' });
    }
  });

  // Reserve a slot
  router.post('/slots/:id/reserve', validateNurseId, reservationLimiter, async (req, res) => {
    try {
      const { id } = req.params;
      const { nurse_id } = req.body;

      const result = await query(
        `UPDATE time_slots 
         SET status = 'reserved', nurse_id = $1 
         WHERE id = $2 AND status = 'available' 
         RETURNING *`,
        [nurse_id, id]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({ error: 'Slot not available' });
      }

      // Emit socket event for real-time updates
      io.emit('slotUpdated', result.rows[0]);
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error reserving slot:', error);
      res.status(500).json({ error: 'Failed to reserve slot' });
    }
  });

  // Cancel a reservation
  router.post('/slots/:id/cancel', validateNurseId, async (req, res) => {
    try {
      const { id } = req.params;
      const { nurse_id } = req.body;

      const result = await query(
        `UPDATE time_slots 
         SET status = 'available', nurse_id = NULL 
         WHERE id = $1 AND nurse_id = $2 
         RETURNING *`,
        [id, nurse_id]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid reservation' });
      }

      // Emit socket event for real-time updates
      io.emit('slotUpdated', result.rows[0]);
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error canceling reservation:', error);
      res.status(500).json({ error: 'Failed to cancel reservation' });
    }
  });

  // Reset all slots to available
  router.post('/slots/reset', async (req, res) => {
    try {
      const result = await query(
        `UPDATE time_slots 
         SET status = 'available', nurse_id = NULL 
         WHERE status = 'reserved' 
         RETURNING *`,
        []
      );

      // Emit socket events for each updated slot
      result.rows.forEach(slot => {
        io.emit('slotUpdated', slot);
      });

      res.json({ message: 'All slots reset to available', updatedSlots: result.rows });
    } catch (error) {
      console.error('Error resetting slots:', error);
      res.status(500).json({ error: 'Failed to reset slots' });
    }
  });

  // Mount all routes under /api
  app.use('/api', router);
}; 