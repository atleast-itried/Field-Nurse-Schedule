import React from 'react';
import { format } from 'date-fns';
import { Button } from './Button/Button';
import './SlotsView.css';

interface TimeSlot {
  id: number;
  start_time: string;
  end_time: string;
  status: 'available' | 'reserved';
  nurse_id?: string;
}

interface SlotsViewProps {
  slots: TimeSlot[];
  onReserveSlot: (slotId: number) => void;
  title: string;
}

const SlotsView: React.FC<SlotsViewProps> = ({ slots, onReserveSlot, title }) => {
  return (
    <div className="slots-view">
      <h2>{title}</h2>
      <div className="slots-grid">
        {slots.length === 0 ? (
          <div className="no-slots">No available slots</div>
        ) : (
          slots.map(slot => (
            <Button
              key={slot.id}
              variant={slot.status === 'available' ? 'primary' : 'secondary'}
              className={`slot ${slot.status}`}
              onClick={() => slot.status === 'available' && onReserveSlot(slot.id)}
              disabled={slot.status === 'reserved'}
            >
              <div className="slot-date">
                {format(new Date(slot.start_time), 'MMM d, yyyy')}
              </div>
              <div className="slot-time">
                {format(new Date(slot.start_time), 'h:mm a')} -{' '}
                {format(new Date(slot.end_time), 'h:mm a')}
              </div>
              <div className="slot-status">{slot.status}</div>
            </Button>
          ))
        )}
      </div>
    </div>
  );
};

export default SlotsView; 