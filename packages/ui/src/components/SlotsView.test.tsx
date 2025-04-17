import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SlotsView from './SlotsView';

// Add type declarations for vi
declare global {
  namespace vi {
    interface MockContext {
      calls: any[];
    }
  }
}

const mockSlots = [
  {
    id: 1,
    start_time: '2024-01-01T08:00:00Z',
    end_time: '2024-01-01T09:00:00Z',
    status: 'available' as const,
  },
  {
    id: 2,
    start_time: '2024-01-01T09:00:00Z',
    end_time: '2024-01-01T10:00:00Z',
    status: 'reserved' as const,
    nurse_id: 'nurse-123',
  },
];

describe('SlotsView', () => {
  const mockOnReserveSlot = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders available and reserved slots correctly', () => {
    render(<SlotsView title="Test Slots" slots={mockSlots} onReserveSlot={mockOnReserveSlot} />);

    // Check if slots are rendered
    const slots = screen.getAllByRole('button');
    expect(slots).toHaveLength(2);

    // Check status labels
    expect(screen.getByText('available')).toBeInTheDocument();
    expect(screen.getByText('reserved')).toBeInTheDocument();
  });

  it('calls onReserveSlot when clicking an available slot', () => {
    render(<SlotsView title="Test Slots" slots={mockSlots} onReserveSlot={mockOnReserveSlot} />);

    const availableSlot = screen.getByText('available').closest('button');
    fireEvent.click(availableSlot!);

    expect(mockOnReserveSlot).toHaveBeenCalledWith(1);
  });

  it('does not call onReserveSlot when clicking a reserved slot', () => {
    render(<SlotsView title="Test Slots" slots={mockSlots} onReserveSlot={mockOnReserveSlot} />);

    const reservedSlot = screen.getByText('reserved').closest('button');
    fireEvent.click(reservedSlot!);

    expect(mockOnReserveSlot).not.toHaveBeenCalled();
  });

  it('applies correct CSS classes based on slot status', () => {
    render(<SlotsView title="Test Slots" slots={mockSlots} onReserveSlot={mockOnReserveSlot} />);

    const availableSlot = screen.getByText('available').closest('button');
    const reservedSlot = screen.getByText('reserved').closest('button');

    expect(availableSlot).toHaveClass('slot', 'available');
    expect(reservedSlot).toHaveClass('slot', 'reserved');
  });

  it('displays time slots in correct format', () => {
    render(<SlotsView title="Test Slots" slots={mockSlots} onReserveSlot={mockOnReserveSlot} />);

    // Check if time is displayed in correct format (8:00 AM - 9:00 AM)
    expect(screen.getByText('8:00 AM - 9:00 AM')).toBeInTheDocument();
    expect(screen.getByText('9:00 AM - 10:00 AM')).toBeInTheDocument();
  });

  it('handles empty slots array gracefully', () => {
    render(<SlotsView title="Test Slots" slots={[]} onReserveSlot={mockOnReserveSlot} />);

    expect(screen.getByText('No slots available')).toBeInTheDocument();
  });

  it('displays nurse ID for reserved slots', () => {
    render(<SlotsView title="Test Slots" slots={mockSlots} onReserveSlot={mockOnReserveSlot} />);

    expect(screen.getByText('Reserved by: nurse-123')).toBeInTheDocument();
  });
}); 