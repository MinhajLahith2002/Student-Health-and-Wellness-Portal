import { jest } from '@jest/globals';
import Medicine from '../models/Medicine.js';
import Order from '../models/Order.js';
import Prescription from '../models/Prescription.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';

let orderController;
let prescriptionController;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  orderController = (await import('../controllers/orderController.js')).default;
  prescriptionController = (await import('../controllers/prescriptionController.js')).default;
});

afterEach(() => {
  jest.restoreAllMocks();
});

function createMockResponse() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

function createStudentRequest(body) {
  return {
    user: {
      id: 'student-1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '0771234567'
    },
    body
  };
}

describe('Pharmacy student order controller', () => {
  test('returns 400 when student order payload has no items', async () => {
    const req = createStudentRequest({
      items: [],
      address: 'Dorm A, Room 302',
      paymentMethod: 'Cash on Delivery'
    });
    const res = createMockResponse();

    await orderController.createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'At least one order item is required'
    });
  });

  test('returns 400 when delivery address is missing', async () => {
    const req = createStudentRequest({
      items: [{ medicineId: 'medicine-1', quantity: 1 }],
      address: '',
      paymentMethod: 'Cash on Delivery'
    });
    const res = createMockResponse();

    await orderController.createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Delivery address is required' });
  });

  test('returns 400 when an order item is invalid', async () => {
    const req = createStudentRequest({
      items: [{ medicineId: 'medicine-1', quantity: 0 }],
      address: 'Dorm A, Room 302',
      paymentMethod: 'Cash on Delivery'
    });
    const res = createMockResponse();

    await orderController.createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Each item must include a valid medicineId and quantity'
    });
  });

  test('returns 404 when medicine does not exist', async () => {
    jest.spyOn(Medicine, 'findById').mockResolvedValue(null);

    const req = createStudentRequest({
      items: [{ medicineId: 'medicine-404', quantity: 1 }],
      address: 'Dorm A, Room 302',
      paymentMethod: 'Cash on Delivery'
    });
    const res = createMockResponse();

    await orderController.createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Medicine not found: medicine-404' });
  });

  test('returns 400 when medicine stock is insufficient', async () => {
    jest.spyOn(Medicine, 'findById').mockResolvedValue({
      _id: 'medicine-1',
      name: 'Cetirizine',
      price: 8.25,
      stock: 1,
      requiresPrescription: false
    });

    const req = createStudentRequest({
      items: [{ medicineId: 'medicine-1', quantity: 2 }],
      address: 'Dorm A, Room 302',
      paymentMethod: 'Cash on Delivery'
    });
    const res = createMockResponse();

    await orderController.createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Insufficient stock for Cetirizine' });
  });

  test('returns 400 when prescription medicine has no approved prescription', async () => {
    jest.spyOn(Medicine, 'findById').mockResolvedValue({
      _id: 'medicine-1',
      name: 'Antibiotic',
      price: 12,
      stock: 10,
      requiresPrescription: true
    });

    const req = createStudentRequest({
      items: [{ medicineId: 'medicine-1', quantity: 1 }],
      address: 'Dorm A, Room 302',
      paymentMethod: 'Cash on Delivery'
    });
    const res = createMockResponse();

    await orderController.createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Prescription is required for one or more selected medicines'
    });
  });

  test('creates a direct medicine order and reduces stock', async () => {
    jest.spyOn(Medicine, 'findById').mockResolvedValue({
      _id: 'medicine-1',
      name: 'Cetirizine',
      price: 8.25,
      stock: 10,
      requiresPrescription: false
    });
    jest.spyOn(Order, 'create').mockResolvedValue({
      _id: 'order-1',
      orderId: 'ORD-00001',
      total: 18.5,
      orderType: 'Direct'
    });
    jest.spyOn(Medicine, 'findByIdAndUpdate').mockResolvedValue({});

    const req = createStudentRequest({
      items: [{ medicineId: 'medicine-1', quantity: 2 }],
      address: '  Dorm A, Room 302  ',
      paymentMethod: 'Cash on Delivery',
      specialInstructions: 'Call before delivery'
    });
    const res = createMockResponse();

    await orderController.createOrder(req, res);

    expect(Order.create).toHaveBeenCalledWith(expect.objectContaining({
      subtotal: 16.5,
      deliveryFee: 2.5,
      total: 19,
      address: 'Dorm A, Room 302',
      orderType: 'Direct',
      status: 'Pending'
    }));
    expect(Medicine.findByIdAndUpdate).toHaveBeenCalledWith('medicine-1', {
      $inc: { stock: -2 }
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe('Pharmacy pharmacist order controller', () => {
  test('returns 404 when updating a missing order status', async () => {
    jest.spyOn(Order, 'findById').mockReturnValue({
      populate: jest.fn().mockResolvedValue(null)
    });

    const req = { params: { id: 'order-404' }, body: { status: 'Packed' }, user: { id: 'pharmacist-1' } };
    const res = createMockResponse();

    await orderController.updateOrderStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Order not found' });
  });

  test('updates order status and notifies the student', async () => {
    const order = {
      _id: 'order-1',
      orderId: 'ORD-00001',
      studentId: { _id: 'student-1' },
      items: [],
      status: 'Pending',
      save: jest.fn().mockResolvedValue()
    };
    jest.spyOn(Order, 'findById').mockReturnValue({
      populate: jest.fn().mockResolvedValue(order)
    });
    jest.spyOn(Notification, 'create').mockResolvedValue({});

    const req = { params: { id: 'order-1' }, body: { status: 'Packed' }, user: { id: 'pharmacist-1' } };
    const res = createMockResponse();

    await orderController.updateOrderStatus(req, res);

    expect(order.status).toBe('Packed');
    expect(order.save).toHaveBeenCalled();
    expect(Notification.create).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Order Packed',
      link: '/student/pharmacy/order/order-1'
    }));
    expect(res.json).toHaveBeenCalledWith(order);
  });
});

describe('Pharmacy pharmacist prescription controller', () => {
  test('approval creates a prescription order with delivery address', async () => {
    const prescription = {
      _id: 'prescription-1',
      studentId: {
        _id: 'student-1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '0771234567'
      },
      studentName: 'John Doe',
      status: 'Pending',
      medicines: [{ name: 'Amoxicillin 250mg', quantity: 2 }],
      createdAt: new Date('2026-04-23T10:00:00.000Z'),
      deliveryAddress: 'Dorm A, Room 302',
      deliveryInstructions: 'Call before delivery',
      save: jest.fn().mockResolvedValue()
    };

    jest.spyOn(Prescription, 'findById').mockReturnValue({
      populate: jest.fn().mockResolvedValue(prescription)
    });
    jest.spyOn(Order, 'findOne').mockResolvedValue(null);
    jest.spyOn(Order, 'create').mockResolvedValue({});
    jest.spyOn(Medicine, 'find').mockReturnValue({
      select: jest.fn().mockResolvedValue([
        {
          _id: 'medicine-1',
          name: 'Amoxicillin',
          price: 12.5,
          stock: 10,
          requiresPrescription: true
        }
      ])
    });
    jest.spyOn(Notification, 'create').mockResolvedValue({});
    jest.spyOn(AuditLog, 'create').mockResolvedValue({});

    const req = {
      params: { id: 'prescription-1' },
      body: { status: 'Approved', pharmacistNotes: 'Approved for preparation' },
      user: { id: 'pharmacist-1', name: 'Robert Brown' },
      ip: '127.0.0.1',
      get: jest.fn(() => 'jest')
    };
    const res = createMockResponse();

    await prescriptionController.verifyPrescription(req, res);

    expect(prescription.status).toBe('Approved');
    expect(prescription.verifiedBy).toBe('pharmacist-1');
    expect(Order.create).toHaveBeenCalledWith(expect.objectContaining({
      address: 'Dorm A, Room 302',
      specialInstructions: 'Approved for preparation Call before delivery',
      prescriptionId: 'prescription-1',
      orderType: 'Prescription',
      items: [
        {
          medicineId: 'medicine-1',
          name: 'Amoxicillin',
          price: 12.5,
          quantity: 2,
          requiresPrescription: true
        }
      ],
      subtotal: 25,
      deliveryFee: 2.5,
      total: 27.5
    }));
    expect(res.json).toHaveBeenCalledWith(prescription);
  });

  test('rejection stores the rejection reason and does not create an order', async () => {
    const prescription = {
      _id: 'prescription-2',
      studentId: { _id: 'student-1', email: 'john@example.com' },
      status: 'Pending',
      createdAt: new Date('2026-04-23T10:00:00.000Z'),
      save: jest.fn().mockResolvedValue()
    };

    jest.spyOn(Prescription, 'findById').mockReturnValue({
      populate: jest.fn().mockResolvedValue(prescription)
    });
    jest.spyOn(Order, 'create').mockResolvedValue({});
    jest.spyOn(Notification, 'create').mockResolvedValue({});
    jest.spyOn(AuditLog, 'create').mockResolvedValue({});

    const req = {
      params: { id: 'prescription-2' },
      body: { status: 'Rejected', rejectionReason: 'Expired prescription' },
      user: { id: 'pharmacist-1', name: 'Robert Brown' },
      ip: '127.0.0.1',
      get: jest.fn(() => 'jest')
    };
    const res = createMockResponse();

    await prescriptionController.verifyPrescription(req, res);

    expect(prescription.status).toBe('Rejected');
    expect(prescription.rejectionReason).toBe('Expired prescription');
    expect(Order.create).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(prescription);
  });
});
