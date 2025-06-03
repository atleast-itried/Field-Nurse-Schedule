import { Application, Request, Response, Router } from 'express';
import { Server } from 'socket.io';
import { query } from './db';
import { TimeSlot } from './models';

// Custom error class
class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// Error handler wrapper
const asyncHandler = (fn: Function) => async (req: Request, res: Response) => {
  try {
    await fn(req, res);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

// Middleware to validate slot identifier
const validateSlotIdentifier = (req: any, res: any, next: any) => {
  const { id } = req.params;
  const { start_time } = req.body;
  
  if (!id && !start_time) {
    return res.status(400).json({ error: 'Either slot ID or start_time is required' });
  }
  next();
};

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
  router.post('/slots', asyncHandler(async (req: Request, res: Response) => {
    const { status = 'available' } = req.body;
    const result = await query(
      `SELECT * FROM time_slots 
       WHERE status = $1 
       ORDER BY start_time`,
      [status]
    );
    res.json(result.rows);
  }));

  // Get slots for a specific date
  router.post('/slots/date', asyncHandler(async (req: Request, res: Response) => {
    const { date } = req.body;

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new ApiError(400, 'Invalid date format. Use YYYY-MM-DD');
    }

    // Validate date range
    const requestedDate = new Date(date);
    const now = new Date();
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(now.getMonth() + 3);

    if (requestedDate > threeMonthsFromNow) {
      throw new ApiError(400, 'Date must be within the next 3 months');
    }

    const result = await query(
      `SELECT * FROM time_slots 
       WHERE date_trunc('day', start_time) = $1 
       ORDER BY start_time`,
      [date]
    );
    res.json(result.rows);
  }));

  // Get available slots for next week
  router.post('/slots/next-week', asyncHandler(async (req: Request, res: Response) => {
    const { days } = req.body;
    
    // Validate days parameter
    if (!days || isNaN(days) || days < 1 || days > 10) {
      throw new ApiError(400, 'Days parameter must be between 1 and 10');
    }

    const now = new Date();
    const endDate = new Date();
    endDate.setDate(now.getDate() + days);

    const result = await query(
      `SELECT * FROM time_slots 
       WHERE status = 'available' 
       AND start_time >= $1 
       AND start_time < $2 
       ORDER BY start_time`,
      [now.toISOString(), endDate.toISOString()]
    );
    res.json(result.rows);
  }));

  // Reserve a slot
  router.post('/slots/:id/reserve', validateSlotIdentifier, asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { start_time } = req.body;

    let queryText = '';
    let queryParams: (string | number)[] = [];

    if (start_time) {
      queryText = `
        UPDATE time_slots 
        SET status = 'reserved'
        WHERE start_time = $1 AND status = 'available' 
        RETURNING *`;
      queryParams = [start_time];
    } else {
      queryText = `
        UPDATE time_slots 
        SET status = 'reserved'
        WHERE id = $1 AND status = 'available' 
        RETURNING *`;
      queryParams = [parseInt(id, 10)];
    }

    const result = await query(queryText, queryParams);

    if (result.rows.length === 0) {
      throw new ApiError(400, 'Slot not available');
    }

    // Emit socket event for real-time updates
    io.emit('slotUpdated', result.rows[0]);
    res.json(result.rows[0]);
  }));

  // Cancel a reservation
  router.post('/slots/:id/cancel', validateNurseId, asyncHandler(async (req: Request, res: Response) => {
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
      throw new ApiError(400, 'Invalid reservation');
    }

    // Emit socket event for real-time updates
    io.emit('slotUpdated', result.rows[0]);
    res.json(result.rows[0]);
  }));

  // Reset all slots to available
  router.post('/slots/reset', asyncHandler(async (req: Request, res: Response) => {
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
  }));

  // Mount all routes under /api
  app.use('/api', router);
}; 