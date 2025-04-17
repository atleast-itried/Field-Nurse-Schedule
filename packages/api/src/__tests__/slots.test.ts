import request from 'supertest';
import { app } from '../app';

describe('GET /api/slots', () => {
  it('should return 200 and empty array when no slots exist', async () => {
    const response = await request(app)
      .get('/api/slots')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toEqual([]);
  });
});

describe('POST /api/slots', () => {
  it('should create a new slot and return 201', async () => {
    const slot = {
      start: '2024-04-20T09:00:00Z',
      end: '2024-04-20T10:00:00Z'
    };

    const response = await request(app)
      .post('/api/slots')
      .send(slot)
      .expect('Content-Type', /json/)
      .expect(201);

    expect(response.body).toMatchObject({
      id: expect.any(String),
      ...slot
    });
  });

  it('should return 400 if start or end is missing', async () => {
    const response = await request(app)
      .post('/api/slots')
      .send({ start: '2024-04-20T09:00:00Z' })
      .expect(400);

    expect(response.body).toMatchObject({
      error: 'Missing required fields: start, end'
    });
  });
}); 