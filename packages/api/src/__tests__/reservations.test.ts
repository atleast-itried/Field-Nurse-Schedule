import request from 'supertest';
import { app } from '../app';

describe('POST /api/reservations', () => {
  it('should create a reservation and mark slot as reserved', async () => {
    // First create a slot
    const slot = {
      start: '2024-04-20T09:00:00Z',
      end: '2024-04-20T10:00:00Z'
    };

    const slotResponse = await request(app)
      .post('/api/slots')
      .send(slot)
      .expect(201);

    const slotId = slotResponse.body.id;

    // Then create a reservation
    const reservation = {
      slotId,
      patientId: 'patient-123'
    };

    const response = await request(app)
      .post('/api/reservations')
      .send(reservation)
      .expect('Content-Type', /json/)
      .expect(201);

    expect(response.body).toMatchObject({
      id: expect.any(String),
      ...reservation
    });

    // Verify slot is marked as reserved
    const slotsResponse = await request(app)
      .get('/api/slots')
      .expect(200);

    const reservedSlot = slotsResponse.body.find((s: any) => s.id === slotId);
    expect(reservedSlot.reserved).toBe(true);
  });

  it('should return 400 if slotId or patientId is missing', async () => {
    const response = await request(app)
      .post('/api/reservations')
      .send({ slotId: 'some-id' })
      .expect(400);

    expect(response.body).toMatchObject({
      error: 'Missing required fields: slotId, patientId'
    });
  });

  it('should return 404 if slot does not exist', async () => {
    const response = await request(app)
      .post('/api/reservations')
      .send({
        slotId: 'non-existent-id',
        patientId: 'patient-123'
      })
      .expect(404);

    expect(response.body).toMatchObject({
      error: 'Slot not found'
    });
  });

  it('should return 409 if slot is already reserved', async () => {
    // First create and reserve a slot
    const slot = {
      start: '2024-04-20T09:00:00Z',
      end: '2024-04-20T10:00:00Z'
    };

    const slotResponse = await request(app)
      .post('/api/slots')
      .send(slot)
      .expect(201);

    const slotId = slotResponse.body.id;

    await request(app)
      .post('/api/reservations')
      .send({
        slotId,
        patientId: 'patient-123'
      })
      .expect(201);

    // Try to reserve the same slot again
    const response = await request(app)
      .post('/api/reservations')
      .send({
        slotId,
        patientId: 'patient-456'
      })
      .expect(409);

    expect(response.body).toMatchObject({
      error: 'Slot already reserved'
    });
  });
}); 