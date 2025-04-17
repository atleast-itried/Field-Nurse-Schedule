import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Slot, CreateSlotRequest } from './types';
import cors from 'cors';
import { addDays, startOfDay, addHours, format } from 'date-fns';

const app = express();
app.use(cors());
app.use(express.json());

// Generate slots for the next 30 days
const generateSlots = () => {
  const slots: Slot[] = [];
  const today = new Date();
  
  for (let i = 0; i < 30; i++) {
    const date = addDays(today, i);
    const dayStart = startOfDay(date);
    
    // Generate 5 slots per day
    for (let j = 0; j < 5; j++) {
      const startTime = addHours(dayStart, 9 + j * 2); // 9 AM, 11 AM, 1 PM, 3 PM, 5 PM
      const endTime = addHours(startTime, 2);
      
      slots.push({
        id: uuidv4(),
        date: format(date, 'yyyy-MM-dd'),
        start: startTime.toISOString(),
        end: endTime.toISOString(),
      });
    }
  }
  
  return slots;
};

let slots: Slot[] = generateSlots();

app.get('/api/slots', (req: Request, res: Response) => {
  const { date } = req.query;
  
  if (date) {
    const filteredSlots = slots.filter(slot => slot.date === date);
    res.json(filteredSlots);
  } else {
    res.json(slots);
  }
});

app.post('/api/slots', (req: Request<{}, {}, CreateSlotRequest>, res: Response) => {
  const { start, end, date } = req.body;

  if (!start || !end || !date) {
    return res.status(400).json({
      error: 'Missing required fields: start, end, date'
    });
  }

  const newSlot: Slot = {
    id: uuidv4(),
    date,
    start,
    end
  };

  slots.push(newSlot);
  res.status(201).json(newSlot);
});

app.post('/api/reservations', (req: Request<{}, {}, { slotId: string }>, res: Response) => {
  const { slotId } = req.body;

  if (!slotId) {
    return res.status(400).json({
      error: 'Missing required field: slotId'
    });
  }

  const slot = slots.find(s => s.id === slotId);
  if (!slot) {
    return res.status(404).json({
      error: 'Slot not found'
    });
  }

  if (slot.reserved) {
    return res.status(400).json({
      error: 'Slot is already reserved'
    });
  }

  slot.reserved = true;
  res.status(200).json(slot);
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

export { app }; 