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

const formatUTC = (date: Date, fmt: string) => {
  // Only supports the formats used below
  if (fmt === 'MMM d, yyyy') {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
  }
  if (fmt === 'h:mm a') {
    let hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  }
  return '';
};

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
                {formatUTC(new Date(slot.start_time), 'MMM d, yyyy')}
              </div>
              <div className="slot-time">
                {formatUTC(new Date(slot.start_time), 'h:mm a')} -{' '}
                {formatUTC(new Date(slot.end_time), 'h:mm a')} UTC
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