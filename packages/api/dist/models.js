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
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTimeSlots = exports.createTables = void 0;
const createTables = (pool) => __awaiter(void 0, void 0, void 0, function* () {
    const client = yield pool.connect();
    try {
        yield client.query(`
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
    }
    finally {
        client.release();
    }
});
exports.createTables = createTables;
const generateTimeSlots = (pool_1, ...args_1) => __awaiter(void 0, [pool_1, ...args_1], void 0, function* (pool, days = 30) {
    const client = yield pool.connect();
    try {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + days);
        const slots = [];
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
            yield client.query(`INSERT INTO time_slots (start_time, end_time, status)
         VALUES ($1, $2, $3)
         ON CONFLICT (start_time) DO NOTHING`, [slot.start_time, slot.end_time, slot.status]);
        }
    }
    finally {
        client.release();
    }
});
exports.generateTimeSlots = generateTimeSlots;
