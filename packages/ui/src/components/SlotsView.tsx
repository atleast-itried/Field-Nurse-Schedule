import React from 'react';
import { format } from 'date-fns';

interface Slot {
  id: string;
  date: string;
  start: string;
  end: string;
  reserved?: boolean;
}

interface SlotsViewProps {
  slots: Slot[];
  onReserve: (slotId: string) => void;
}

export const SlotsView: React.FC<SlotsViewProps> = ({ slots, onReserve }) => {
  const formatSlotTime = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${format(startDate, 'h:mm a')} - ${format(endDate, 'h:mm a')}`;
  };

  return (
    <div className="p-4">
      {slots.length === 0 ? (
        <p className="text-gray-500">No slots available for this date</p>
      ) : (
        <ul className="space-y-2">
          {slots.map((slot) => (
            <li key={slot.id} className="p-4 border rounded-lg">
              <div className="flex justify-between items-center">
                <p className="font-medium">{formatSlotTime(slot.start, slot.end)}</p>
                {slot.reserved ? (
                  <span className="px-3 py-1 text-sm font-semibold text-green-800 bg-green-100 rounded-full">
                    Reserved
                  </span>
                ) : (
                  <button
                    onClick={() => onReserve(slot.id)}
                    className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Reserve
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}; 