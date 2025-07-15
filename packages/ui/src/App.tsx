import { useEffect, useState } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  addMonths, 
  subMonths,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay
} from 'date-fns';
import { io } from 'socket.io-client';
import SlotsView from './components/SlotsView';
import { Button } from './components/Button/Button';
import logo from './assets/logo.svg';
import './App.css';

interface TimeSlot {
  id: number;
  start_time: string;
  end_time: string;
  status: 'available' | 'reserved';
  nurse_id?: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function App() {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [socket, setSocket] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'date' | 'all'>('date');
  const [optimisticUpdates, setOptimisticUpdates] = useState<Set<number>>(new Set());

  useEffect(() => {
    const newSocket = io(API_URL);
    setSocket(newSocket);

    newSocket.on('slotUpdated', (updatedSlot: TimeSlot) => {
      setSlots(prevSlots => 
        prevSlots.map(slot => 
          slot.id === updatedSlot.id && !optimisticUpdates.has(slot.id)
            ? updatedSlot 
            : slot
        )
      );
    });

    return () => {
      newSocket.close();
    };
  }, [optimisticUpdates]);

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        let response;
        if (viewMode === 'date') {
          response = await fetch(`${API_URL}/api/slots/date`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: format(selectedDate, 'yyyy-MM-dd') })
          });
        } else {
          response = await fetch(`${API_URL}/api/slots`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'available' })
          });
        }
        if (!response.ok) {
          throw new Error('Failed to fetch slots');
        }
        const data = await response.json();
        setSlots(data);
      } catch (error) {
        console.error('Error fetching slots:', error);
        setSlots([]);
      }
    };

    fetchSlots();
  }, [selectedDate, viewMode]);

  const handleReserveSlot = async (slotId: number) => {
    setOptimisticUpdates(prev => new Set(prev).add(slotId));
    setSlots(prevSlots =>
      prevSlots.map(slot =>
        slot.id === slotId
          ? { ...slot, status: 'reserved' as const }
          : slot
      )
    );

    try {
      const slot = slots.find(s => s.id === slotId);
      const response = await fetch(`${API_URL}/api/slots/${slotId}/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slot ? { start_time: slot.start_time } : {})
      });
      if (!response.ok) {
        setSlots(prevSlots =>
          prevSlots.map(slot =>
            slot.id === slotId
              ? { ...slot, status: 'available' as const }
              : slot
          )
        );
        throw new Error('Failed to reserve slot');
      }
      setOptimisticUpdates(prev => {
        const next = new Set(prev);
        next.delete(slotId);
        return next;
      });
    } catch (error) {
      setOptimisticUpdates(prev => {
        const next = new Set(prev);
        next.delete(slotId);
        return next;
      });
      console.error('Error reserving slot:', error);
    }
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const getDaysInMonth = () => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  };

  return (
    <div className="app">
      <header className="app-header">
        <img src={logo} alt="Field Nurse Logo" className="app-logo" />
        <h1 className="app-title">Field Nurse Schedule</h1>
        <div className="view-toggle">
          <Button
            variant={viewMode === 'date' ? 'primary' : 'secondary'}
            onClick={() => setViewMode('date')}
          >
            Calendar View
          </Button>
          <Button
            variant={viewMode === 'all' ? 'primary' : 'secondary'}
            onClick={() => setViewMode('all')}
          >
            All Available Slots
          </Button>
        </div>
      </header>
      <main className="app-main">
        {viewMode === 'date' && (
          <div className="calendar">
            <div className="calendar-header">
              <Button variant="secondary" onClick={prevMonth}>&lt;</Button>
              <h2>{format(currentMonth, 'MMMM yyyy')}</h2>
              <Button variant="secondary" onClick={nextMonth}>&gt;</Button>
            </div>
            <div className="calendar-weekdays">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="calendar-weekday">{day}</div>
              ))}
            </div>
            <div className="calendar-grid">
              {getDaysInMonth().map(day => (
                <Button
                  key={day.toString()}
                  variant="secondary"
                  className={`calendar-day ${
                    !isSameMonth(day, currentMonth) ? 'other-month' : ''
                  } ${
                    isSameDay(day, selectedDate) ? 'selected' : ''
                  }`}
                  onClick={() => setSelectedDate(day)}
                >
                  {format(day, 'd')}
                </Button>
              ))}
            </div>
          </div>
        )}
        <SlotsView
          slots={slots}
          onReserveSlot={handleReserveSlot}
          title={viewMode === 'date' ? 'Available Time Slots' : 'All Available Slots'}
        />
      </main>
    </div>
  );
}

export default App; 