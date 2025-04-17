import { useState, useEffect, useCallback } from 'react';

interface Slot {
  id: string;
  start: string;
  end: string;
  reserved?: boolean;
}

export const useSlots = () => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSlots = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3000/api/slots');
      if (!response.ok) {
        throw new Error('Failed to fetch slots');
      }
      const data = await response.json();
      setSlots(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const reserveSlot = useCallback(async (slotId: string, patientId: string) => {
    try {
      const response = await fetch('http://localhost:3000/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slotId, patientId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reserve slot');
      }

      // Refresh slots after successful reservation
      await fetchSlots();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  }, [fetchSlots]);

  useEffect(() => {
    fetchSlots();

    // Set up WebSocket connection for real-time updates
    const ws = new WebSocket('ws://localhost:3000');

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'SLOT_UPDATED') {
        setSlots(prevSlots => 
          prevSlots.map(slot => 
            slot.id === data.slot.id ? data.slot : slot
          )
        );
      }
    };

    return () => {
      ws.close();
    };
  }, [fetchSlots]);

  return { slots, error, loading, reserveSlot };
}; 