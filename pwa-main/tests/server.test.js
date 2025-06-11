const request = require('supertest');

jest.mock('express-session', () => {
  return () => (req, res, next) => {
    req.session = { userId: 1 };
    next();
  };
});

jest.mock('pg', () => {
  const query = jest.fn((text, params) => {
    if (text.includes('SELECT profile_id FROM skill_profile')) {
      return Promise.resolve({ rows: [{ profile_id: 1 }] });
    }
    if (text.includes('SELECT location FROM skill_profile')) {
      return Promise.resolve({ rows: [{ location: 'Johannesburg' }] });
    }
    if (text.includes('SELECT profile_id_1, profile_id_2 FROM exchange')) {
      return Promise.resolve({ rows: [{ profile_id_1: 2, profile_id_2: 1 }] });
    }
    if (text.startsWith('INSERT INTO exchange')) {
      return Promise.resolve({});
    }
    if (text.includes('FROM exchange')) {
      return Promise.resolve({
        rows: [{ profile_1_name: 'Alice', profile_2_name: 'Bob' }],
      });
    }
    return Promise.resolve({ rows: [] });
  });
  return { Pool: jest.fn(() => ({ query })), __query: query };
});

const app = require('../server');
const { __query: pgQuery } = require('pg');

describe('GET /api/profiles', () => {
  it('responds with an empty array', async () => {
    const res = await request(app).get('/api/profiles');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('GET /api/exchange/received', () => {
  it('includes profile name fields', async () => {
    const res = await request(app).get('/api/exchange/received');
    expect(res.status).toBe(200);
    expect(res.body[0]).toHaveProperty('profile_1_name', 'Alice');
    expect(res.body[0]).toHaveProperty('profile_2_name', 'Bob');
  });
});

describe('GET /api/exchange/sent', () => {
  it('includes profile name fields', async () => {
    const res = await request(app).get('/api/exchange/sent');
    expect(res.status).toBe(200);
    expect(res.body[0]).toHaveProperty('profile_1_name', 'Alice');
    expect(res.body[0]).toHaveProperty('profile_2_name', 'Bob');
  });
});

describe('PUT /api/exchange/:id/status', () => {
  it('allows the receiver to accept an exchange', async () => {
    const res = await request(app)
      .put('/api/exchange/1/status')
      .send({ status: 'Active' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Exchange status updated');
  });
});

describe('POST /api/exchange/request', () => {
  it('rejects self exchanges', async () => {
    const res = await request(app)
      .post('/api/exchange/request')
      .send({ to_profile_id: 1, skill_id_1: 2, skill_id_2: 3 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/yourself/);
  });
});

describe('PUT /api/profile', () => {
  it('updates skill listing for provided skills', async () => {
    pgQuery.mockClear();
    const skills = ['JavaScript', 'Node.js', 'React'];
    const res = await request(app)
      .put('/api/profile')
      .send({ name: 'Test', skills, languages: ['English'] });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Profile updated successfully');

    const calls = pgQuery.mock.calls;
    const deleteIndex = calls.findIndex(([text]) =>
      text.includes('DELETE FROM skill_listing')
    );
    expect(deleteIndex).toBeGreaterThan(-1);
    const insertCalls = calls.filter(([text]) =>
      text.includes('INSERT INTO skill_listing')
    );
    expect(insertCalls).toHaveLength(skills.length);
    insertCalls.forEach((call, idx) => {
      expect(call[1][1]).toBe(skills[idx]);
      expect(calls.indexOf(call)).toBeGreaterThan(deleteIndex);
    });
  });
});
