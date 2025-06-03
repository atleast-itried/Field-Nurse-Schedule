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
exports.query = exports.setupDatabase = void 0;
const pg_1 = require("pg");
const models_1 = require("./models");
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
const poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
};
const pool = new pg_1.Pool(poolConfig);
const setupDatabase = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Creating tables...');
        yield (0, models_1.createTables)(pool);
        console.log('Generating time slots...');
        yield (0, models_1.generateTimeSlots)(pool, 30); // Generate slots for the next 30 days
        console.log('Database initialization completed successfully!');
    }
    catch (error) {
        console.error('Database setup failed:', error);
        throw error;
    }
});
exports.setupDatabase = setupDatabase;
const query = (text, params) => __awaiter(void 0, void 0, void 0, function* () {
    const start = Date.now();
    const res = yield pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
});
exports.query = query;
