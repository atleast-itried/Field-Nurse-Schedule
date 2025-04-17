import React, { useEffect, useState } from 'react';
import { SlotsView } from './components/SlotsView';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format } from 'date-fns';

interface Slot {
  id: string;
  date: string;
  start: string;
  end: string;
  reserved?: boolean;
}

export function App() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    fetchSlots();
  }, [selectedDate]);

  const fetchSlots = async () => {
    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const response = await fetch(`http://localhost:3000/api/slots?date=${formattedDate}`);
      const data = await response.json();
      setSlots(data);
    } catch (error) {
      console.error('Error fetching slots:', error);
    }
  };

  const handleReserve = async (slotId: string) => {
    try {
      const response = await fetch('http://localhost:3000/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slotId }),
      });

      if (response.ok) {
        fetchSlots();
      } else {
        const error = await response.json();
        console.error('Error reserving slot:', error);
      }
    } catch (error) {
      console.error('Error reserving slot:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Field Nurse Schedule</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
            minDate={new Date()}
            className="border rounded-lg p-4"
          />
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Available Slots for {format(selectedDate, 'MMMM d, yyyy')}
          </h2>
          <SlotsView slots={slots} onReserve={handleReserve} />
        </div>
      </div>
    </div>
  );
} 