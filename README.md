# Field Nurse Schedule

A real-time scheduling application for field nurses to manage their appointments.

## Features

- Calendar view of available time slots
- Real-time updates using Socket.IO
- PostgreSQL database for data storage
- RESTful API for slot management
- Modern React frontend with TypeScript

## Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)
- PostgreSQL database
- Heroku account (for deployment)

## Local Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/field-nurse-schedule.git
   cd field-nurse-schedule
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the `packages/api` directory:
   ```
   DATABASE_URL=postgres://username:password@localhost:5432/field_nurse_schedule
   PORT=3000
   ```

4. Start the development servers:
   ```bash
   npm run dev
   ```

This will start both the API server (port 3000) and the UI development server (port 5173).

## Testing

Run tests for both packages:
```bash
npm test
```

## Deployment to Heroku

1. Create a new Heroku app:
   ```bash
   heroku create field-nurse-schedule
   ```

2. Add the PostgreSQL add-on:
   ```bash
   heroku addons:create heroku-postgresql:hobby-dev
   ```

3. Set environment variables:
   ```bash
   heroku config:set NODE_ENV=production
   ```

4. Deploy the application:
   ```bash
   git push heroku main
   ```

5. Run database migrations:
   ```bash
   heroku run npm run migrate
   ```

## Project Structure

```
packages/
├── api/                 # Backend API
│   ├── src/
│   │   ├── app.ts      # Express application
│   │   ├── db.ts       # Database configuration
│   │   └── routes.ts   # API routes
│   └── package.json
└── ui/                  # Frontend React application
    ├── src/
    │   ├── App.tsx     # Main application component
    │   └── components/ # React components
    └── package.json
```

## API Endpoints

- `GET /api/slots/:date` - Get available slots for a specific date
- `POST /api/slots/:id/reserve` - Reserve a time slot
- `POST /api/slots/:id/cancel` - Cancel a reservation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT 