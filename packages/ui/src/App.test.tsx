import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from './App';
import { io } from 'socket.io-client';

// Add type declarations for vi
declare global {
  namespace vi {
    interface MockContext {
      calls: any[];
    }
  }
}

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    close: vi.fn(),
  })),
}));

// Mock fetch and console.error
global.fetch = vi.fn();
const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('App', () => {
  const mockSlots = [
    {
      id: 1,
      start_time: '2024-01-01T08:00:00Z',
      end_time: '2024-01-01T09:00:00Z',
      status: 'available' as const,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as vi.Mock).mockResolvedValue({
      json: () => Promise.resolve(mockSlots),
    });
  });

  afterEach(() => {
    consoleError.mockClear();
  });

  it('renders the calendar and slots view', async () => {
    await act(async () => {
      render(<App />);
    });

    expect(screen.getByText('Field Nurse Schedule')).toBeInTheDocument();
    expect(screen.getByText('Available Time Slots')).toBeInTheDocument();
  });

  it('fetches slots when a date is selected', async () => {
    await act(async () => {
      render(<App />);
    });

    const dateButton = screen.getByText('1');
    await act(async () => {
      fireEvent.click(dateButton);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/slots/')
    );
  });

  it('handles socket updates for slot changes', async () => {
    const mockSocket = {
      on: vi.fn(),
      close: vi.fn(),
    };
    (io as vi.Mock).mockReturnValue(mockSocket);

    await act(async () => {
      render(<App />);
    });

    const updatedSlot = {
      id: 1,
      start_time: '2024-01-01T08:00:00Z',
      end_time: '2024-01-01T09:00:00Z',
      status: 'reserved' as const,
    };

    // Simulate socket update
    const slotUpdateCallback = mockSocket.on.mock.calls.find(
      (call: any) => call[0] === 'slotUpdated'
    )[1];
    await act(async () => {
      slotUpdateCallback(updatedSlot);
    });

    expect(screen.getByText('reserved')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    (global.fetch as vi.Mock).mockRejectedValueOnce(new Error('API error'));

    await act(async () => {
      render(<App />);
    });

    const dateButton = screen.getByText('1');
    await act(async () => {
      fireEvent.click(dateButton);
    });

    expect(consoleError).toHaveBeenCalledWith(
      'Error fetching slots:',
      expect.any(Error)
    );
  });
}); 