import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SlotsView } from './SlotsView';

describe('SlotsView', () => {
  const mockSlots = [
    {
      id: '1',
      start: '2024-04-20T17:00:00Z',
      end: '2024-04-20T18:00:00Z',
    },
    {
      id: '2',
      start: '2024-04-20T18:00:00Z',
      end: '2024-04-20T19:00:00Z',
      reserved: true,
    },
  ];

  const mockOnReserve = jest.fn();

  it('renders empty state when no slots are available', () => {
    render(<SlotsView slots={[]} onReserve={mockOnReserve} />);
    expect(screen.getByText('No slots available')).toBeInTheDocument();
  });

  it('renders a list of slots', () => {
    render(<SlotsView slots={mockSlots} onReserve={mockOnReserve} />);
    const timePattern = /April 20, 2024, \d{1,2}:\d{2} [AP]M - \d{1,2}:\d{2} [AP]M/;
    const slots = screen.getAllByText(timePattern);
    expect(slots).toHaveLength(2);
  });

  it('shows reserve button for available slots', () => {
    render(<SlotsView slots={mockSlots} onReserve={mockOnReserve} />);
    expect(screen.getByText('Reserve')).toBeInTheDocument();
  });

  it('shows reserved status for reserved slots', () => {
    render(<SlotsView slots={mockSlots} onReserve={mockOnReserve} />);
    expect(screen.getByText('Reserved')).toBeInTheDocument();
  });

  it('calls onReserve with correct slot ID when reserve button is clicked', () => {
    render(<SlotsView slots={mockSlots} onReserve={mockOnReserve} />);
    fireEvent.click(screen.getByText('Reserve'));
    expect(mockOnReserve).toHaveBeenCalledWith('1');
  });
}); 