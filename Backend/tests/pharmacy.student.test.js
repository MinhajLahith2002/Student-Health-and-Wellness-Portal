import request from 'supertest';

let app;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
  const appModule = await import('../app.js');
  app = appModule.default;
});

describe('Pharmacy Student APIs', () => {
  test('should block unauthenticated student order list access', async () => {
    const res = await request(app).get('/api/orders');

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/not authorized/i);
  });

  test('should block unauthenticated student order creation', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({
        items: [{ medicineId: '507f1f77bcf86cd799439011', quantity: 2 }],
        address: 'Dorm A, Room 302',
        paymentMethod: 'Cash on Delivery'
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/not authorized/i);
  });

  test('should block unauthenticated prescription upload', async () => {
    const res = await request(app)
      .post('/api/prescriptions/upload')
      .field('notes', 'Test prescription')
      .field('deliveryAddress', 'Dorm A, Room 302');

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/not authorized/i);
  });

  test('should block unauthenticated order tracking access', async () => {
    const res = await request(app).get('/api/orders/507f1f77bcf86cd799439011');

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/not authorized/i);
  });
});
