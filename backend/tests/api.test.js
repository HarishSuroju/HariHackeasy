const request = require('supertest');
const createApp = require('../src/app');

describe('Health check', () => {
  const app = createApp();
  it('responds with ok status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('GET /api/state', () => {
  const app = createApp();
  it('returns the full app state', async () => {
    const res = await request(app).get('/api/state');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('announcement');
    expect(res.body).toHaveProperty('zones');
    expect(res.body).toHaveProperty('schedule');
    expect(Array.isArray(res.body.zones)).toBe(true);
  });
});

describe('POST /api/organizer/login', () => {
  const app = createApp();

  it('rejects an invalid code', async () => {
    const res = await request(app).post('/api/organizer/login').send({ code: '000000' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('accepts the configured organizer code', async () => {
    const res = await request(app).post('/api/organizer/login').send({ code: '123456' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('rejects missing code with a 400 validation error', async () => {
    const res = await request(app).post('/api/organizer/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/announcement', () => {
  const app = createApp();

  it('rejects empty announcements', async () => {
    const res = await request(app).post('/api/announcement').send({ announcement: '' });
    expect(res.status).toBe(400);
  });

  it('publishes a valid announcement', async () => {
    const res = await request(app).post('/api/announcement').send({ announcement: 'Testing 1 2 3' });
    expect(res.status).toBe(200);
    expect(res.body.announcement).toBe('Testing 1 2 3');
    expect(res.body.alerts[0].message).toBe('Testing 1 2 3');
  });
});

describe('Schedule CRUD', () => {
  const app = createApp();
  let createdId;

  it('rejects a session missing required fields', async () => {
    const res = await request(app).post('/api/schedule').send({ title: 'Only a title' });
    expect(res.status).toBe(400);
  });

  it('creates a new session', async () => {
    const res = await request(app)
      .post('/api/schedule')
      .send({ title: 'Test Session', time: '3:00 PM', location: 'Room 1', category: 'Web', speaker: 'Jane Doe' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const created = res.body.schedule.find(s => s.title === 'Test Session');
    expect(created).toBeTruthy();
    createdId = created.id;
  });

  it('updates the created session', async () => {
    const res = await request(app).patch(`/api/schedule/${createdId}`).send({ title: 'Updated Session' });
    expect(res.status).toBe(200);
    expect(res.body.schedule.find(s => s.id === createdId).title).toBe('Updated Session');
  });

  it('404s when updating a non-existent session', async () => {
    const res = await request(app).patch('/api/schedule/999999').send({ title: 'Nope' });
    expect(res.status).toBe(404);
  });

  it('deletes the created session', async () => {
    const res = await request(app).delete(`/api/schedule/${createdId}`);
    expect(res.status).toBe(200);
    expect(res.body.schedule.find(s => s.id === createdId)).toBeUndefined();
  });

  it('404s when deleting a non-existent session', async () => {
    const res = await request(app).delete('/api/schedule/999999');
    expect(res.status).toBe(404);
  });
});

describe('Zones CRUD', () => {
  const app = createApp();
  let createdId;

  it('rejects a zone with an out-of-range latitude', async () => {
    const res = await request(app).post('/api/zones').send({ name: 'Bad Zone', location: 'Nowhere', lat: 999, lng: 0 });
    expect(res.status).toBe(400);
  });

  it('creates a new zone', async () => {
    const res = await request(app)
      .post('/api/zones')
      .send({ name: 'Test Zone', location: 'Building Z', lat: 12.97, lng: 77.59 });
    expect(res.status).toBe(200);
    const created = res.body.zones.find(z => z.name === 'Test Zone');
    expect(created).toBeTruthy();
    createdId = created.id;
  });

  it('updates the created zone', async () => {
    const res = await request(app).patch(`/api/zones/${createdId}`).send({ status: 'Congested' });
    expect(res.status).toBe(200);
    expect(res.body.zones.find(z => z.id === createdId).status).toBe('Congested');
  });

  it('deletes the created zone', async () => {
    const res = await request(app).delete(`/api/zones/${createdId}`);
    expect(res.status).toBe(200);
    expect(res.body.zones.find(z => z.id === createdId)).toBeUndefined();
  });
});

describe('Unknown routes', () => {
  const app = createApp();
  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
  });
});
