# Field Nurse Scheduler

A full-stack web application for scheduling field nurse appointments.

## Tech Stack

- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + TypeScript
- Testing: Jest + React Testing Library
- Styling: Tailwind CSS

## Setup

1. Install dependencies:
```bash
npm install
```

2. Install workspace dependencies:
```bash
npm install -w @field-nurse-scheduler/api
npm install -w @field-nurse-scheduler/ui
```

## Development

Run the development servers:
```bash
npm start
```

This will start both the API server and the UI development server concurrently.

## Testing

Run all tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Project Structure

```
.
├── packages/
│   ├── api/           # Backend API
│   └── ui/            # Frontend React application
├── package.json       # Root package.json
└── README.md          # This file
``` 