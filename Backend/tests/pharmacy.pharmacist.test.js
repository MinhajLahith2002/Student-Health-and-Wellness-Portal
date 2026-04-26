import request from 'supertest';

let app;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
  const appModule = await import('../app.js');
  app = appModule.default;
});

describe('Pharmacy Pharmacist APIs', () => {
  test('should block unauthenticated prescription queue access', async () => {
    const res = await request(app).get('/api/prescriptions');

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/not authorized/i);
  });

  test('should block unauthenticated pharmacist order queue access', async () => {
    const res = await request(app).get('/api/orders/all');

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/not authorized/i);
  });

  test('should block unauthenticated medicine creation', async () => {
    const res = await request(app)
      .post('/api/medicines')
      .send({
        name: 'Cetirizine',
        category: 'Allergy',
        price: 8.25,
        stock: 20
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/not authorized/i);
  });

  test('should block unauthenticated medicine stock updates', async () => {
    const res = await request(app)
      .put('/api/medicines/507f1f77bcf86cd799439011/stock')
      .send({ stock: 25 });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/not authorized/i);
  });

  test('should block unauthenticated order status updates', async () => {
    const res = await request(app)
      .put('/api/orders/507f1f77bcf86cd799439011/status')
      .send({ status: 'Packed' });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/not authorized/i);
  });

  test('should block unauthenticated prescription verification', async () => {
    const res = await request(app)
      .put('/api/prescriptions/507f1f77bcf86cd799439011/verify')
      .send({ status: 'Approved', pharmacistNotes: 'Approved for preparation' });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/not authorized/i);
  });
});
