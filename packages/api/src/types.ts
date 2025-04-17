export interface Slot {
  id: string;
  date: string;
  start: string;
  end: string;
  reserved?: boolean;
}

export interface CreateSlotRequest {
  date: string;
  start: string;
  end: string;
}

export interface Reservation {
  id: string;
  slotId: string;
  patientId: string;
}

export interface CreateReservationRequest {
  slotId: string;
  patientId: string;
} 