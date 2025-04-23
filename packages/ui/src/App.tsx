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

  useEffect(() => {
    const newSocket = io(API_URL);
    setSocket(newSocket);

    newSocket.on('slotUpdated', (updatedSlot: TimeSlot) => {
      setSlots(prevSlots => 
        prevSlots.map(slot => 
          slot.id === updatedSlot.id ? updatedSlot : slot
        )
      );
    });

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const url = viewMode === 'date' 
          ? `${API_URL}/api/slots/${format(selectedDate, 'yyyy-MM-dd')}`
          : `${API_URL}/api/slots?status=available`;
        
        const response = await fetch(url);
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
    // Optimistically update the UI
    setSlots(prevSlots =>
      prevSlots.map(slot =>
        slot.id === slotId
          ? { ...slot, status: 'reserved' as const, nurse_id: 'current-user-id' }
          : slot
      )
    );

    try {
      const response = await fetch(`${API_URL}/api/slots/${slotId}/reserve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nurse_id: 'current-user-id' }), // Replace with actual user ID
      });
      
      if (!response.ok) {
        // Revert the optimistic update if the API call fails
        setSlots(prevSlots =>
          prevSlots.map(slot =>
            slot.id === slotId
              ? { ...slot, status: 'available' as const, nurse_id: undefined }
              : slot
          )
        );
        throw new Error('Failed to reserve slot');
      }
    } catch (error) {
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