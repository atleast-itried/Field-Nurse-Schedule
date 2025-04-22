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
const pg_1 = require("pg");
const models_1 = require("./models");
const initializeDatabase = () => __awaiter(void 0, void 0, void 0, function* () {
    const pool = new pg_1.Pool({
        connectionString: process.env.DATABASE_URL,
    });
    try {
        console.log('Creating tables...');
        yield (0, models_1.createTables)(pool);
        console.log('Generating time slots...');
        yield (0, models_1.generateTimeSlots)(pool, 30); // Generate slots for the next 30 days
        console.log('Database initialization completed successfully!');
    }
    catch (error) {
        console.error('Error initializing database:', error);
    }
    finally {
        yield pool.end();
    }
});
// Run the initialization
initializeDatabase();
