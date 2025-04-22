"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupRoutes = void 0;
const express_1 = require("express");
const db_1 = require("./db");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// Rate limiter middleware
const reservationLimiter = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 2, // limit each IP to 2 requests per windowMs
    message: { error: 'Too many requests' },
    statusCode: 429,
});
// Middleware to validate nurse_id
const validateNurseId = (req, res, next) => {
    const { nurse_id } = req.body;
    if (!nurse_id) {
        return res.status(400).json({ error: 'nurse_id is required' });
    }
    next();
};
const setupRoutes = (app, io) => {
    const router = (0, express_1.Router)();
    // Health check endpoint
    router.get('/health', (req, res) => {
        res.json({ status: 'ok' });
    });
    // Get all slots with optional status filter
    router.get('/slots', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const status = req.query.status || 'available';
            const result = yield (0, db_1.query)(`SELECT * FROM time_slots 
         WHERE status = $1 
         ORDER BY start_time`, [status]);
            res.json(result.rows);
        }
        catch (error) {
            console.error('Error fetching slots:', error);
            res.status(500).json({ error: 'Failed to fetch slots' });
        }
    }));
    // Get available slots for a specific date
    router.get('/slots/:date', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
            const result = yield (0, db_1.query)(`SELECT * FROM time_slots 
         WHERE date_trunc('day', start_time) = $1 
         ORDER BY start_time`, [date]);
            res.json(result.rows);
        }
        catch (error) {
            console.error('Error fetching slots:', error);
            res.status(500).json({ error: 'Failed to fetch slots' });
        }
    }));
    // Reserve a slot
    router.post('/slots/:id/reserve', validateNurseId, reservationLimiter, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { id } = req.params;
            const { nurse_id } = req.body;
            const result = yield (0, db_1.query)(`UPDATE time_slots 
         SET status = 'reserved', nurse_id = $1 
         WHERE id = $2 AND status = 'available' 
         RETURNING *`, [nurse_id, id]);
            if (result.rows.length === 0) {
                return res.status(400).json({ error: 'Slot not available' });
            }
            // Emit socket event for real-time updates
            io.emit('slotUpdated', result.rows[0]);
            res.json(result.rows[0]);
        }
        catch (error) {
            console.error('Error reserving slot:', error);
            res.status(500).json({ error: 'Failed to reserve slot' });
        }
    }));
    // Cancel a reservation
    router.post('/slots/:id/cancel', validateNurseId, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { id } = req.params;
            const { nurse_id } = req.body;
            const result = yield (0, db_1.query)(`UPDATE time_slots 
         SET status = 'available', nurse_id = NULL 
         WHERE id = $1 AND nurse_id = $2 
         RETURNING *`, [id, nurse_id]);
            if (result.rows.length === 0) {
                return res.status(400).json({ error: 'Invalid reservation' });
            }
            // Emit socket event for real-time updates
            io.emit('slotUpdated', result.rows[0]);
            res.json(result.rows[0]);
        }
        catch (error) {
            console.error('Error canceling reservation:', error);
            res.status(500).json({ error: 'Failed to cancel reservation' });
        }
    }));
    // Mount all routes under /api
    app.use('/api', router);
};
exports.setupRoutes = setupRoutes;
