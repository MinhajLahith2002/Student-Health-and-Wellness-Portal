const API_BASE = 'http://localhost:5001/api';
const TEST_OBJECT_ID = '507f1f77bcf86cd799439011';
const studentCredentials = {
  email: 'student@gmail.com',
  password: 'student123',
};
const pharmacistCredentials = {
  email: 'pharmacist@gmail.com',
  password: 'pharmacist123',
};

const apiUrl = (path) => `${API_BASE}${path}`;

const requestApi = (method, path, options = {}) =>
  cy.request({
    method,
    url: apiUrl(path),
    failOnStatusCode: false,
    ...options,
  });

const loginApiUser = (credentials) =>
  requestApi('POST', '/auth/login', {
    body: credentials,
  }).then((loginResponse) => {
    expect(loginResponse.status).to.eq(200);
    expect(loginResponse.body).to.have.property('token');
    return loginResponse.body.token;
  });

describe('Pharmacy APIs', () => {
  it('confirms the backend API is running', () => {
    requestApi('GET', '/health').then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('status', 'OK');
    });
  });

  it('loads public pharmacy locations', () => {
    requestApi('GET', '/pharmacy').then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.be.an('array');
    });
  });

  it('returns not found for a missing public pharmacy detail', () => {
    requestApi('GET', `/pharmacy/${TEST_OBJECT_ID}`).then((response) => {
      expect(response.status).to.eq(404);
      expect(response.body.message).to.match(/pharmacy not found/i);
    });
  });

  it('rejects invalid pharmacy location search parameters', () => {
    requestApi('GET', '/pharmacy?lat=abc&lng=79.8612&radius=10').then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body.message).to.eq('Invalid coordinates or radius');
    });
  });

  it('loads public medicines with pagination metadata', () => {
    requestApi('GET', '/medicines?page=1&limit=5').then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.include.keys(
        'medicines',
        'totalPages',
        'currentPage',
        'total'
      );
      expect(response.body.medicines).to.be.an('array');
      expect(response.body.currentPage).to.eq(1);
    });
  });

  it('returns not found for a missing public medicine detail', () => {
    requestApi('GET', `/medicines/${TEST_OBJECT_ID}`).then((response) => {
      expect(response.status).to.eq(404);
      expect(response.body.message).to.match(/medicine not found/i);
    });
  });

  it('filters medicines by search query', () => {
    requestApi('GET', '/medicines?search=para&page=1&limit=5').then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.include.keys(
        'medicines',
        'totalPages',
        'currentPage',
        'total'
      );
      expect(response.body.medicines).to.be.an('array');
    });
  });

  it('blocks unauthenticated student order APIs', () => {
    requestApi('POST', '/orders', {
      body: {
        items: [{ medicineId: TEST_OBJECT_ID, quantity: 2 }],
        address: 'Dorm A, Room 302',
        paymentMethod: 'Cash on Delivery',
      },
    }).then((response) => {
      expect(response.status).to.eq(401);
      expect(response.body.message).to.match(/not authorized/i);
    });

    requestApi('GET', '/orders').then((response) => {
      expect(response.status).to.eq(401);
      expect(response.body.message).to.match(/not authorized/i);
    });

    requestApi('GET', `/orders/${TEST_OBJECT_ID}`).then((response) => {
      expect(response.status).to.eq(401);
      expect(response.body.message).to.match(/not authorized/i);
    });
  });

  it('blocks unauthenticated prescription APIs', () => {
    requestApi('GET', '/prescriptions').then((response) => {
      expect(response.status).to.eq(401);
      expect(response.body.message).to.match(/not authorized/i);
    });

    requestApi('POST', '/prescriptions/upload', {
      form: true,
      body: {
        notes: 'Test prescription',
        deliveryAddress: 'Dorm A, Room 302',
      },
    }).then((response) => {
      expect(response.status).to.eq(401);
      expect(response.body.message).to.match(/not authorized/i);
    });

    requestApi('PUT', `/prescriptions/${TEST_OBJECT_ID}/verify`, {
      body: {
        status: 'Approved',
        pharmacistNotes: 'Approved for preparation',
      },
    }).then((response) => {
      expect(response.status).to.eq(401);
      expect(response.body.message).to.match(/not authorized/i);
    });
  });

  it('blocks unauthenticated pharmacist medicine and queue APIs', () => {
    requestApi('POST', '/medicines', {
      body: {
        name: 'Cetirizine',
        strength: '10mg',
        manufacturer: 'Campus Health',
        category: 'Allergy',
        description: 'Allergy relief tablet',
        usage: 'Take once daily',
        price: 8.25,
        stock: 20,
        reorderLevel: 5,
      },
    }).then((response) => {
      expect(response.status).to.eq(401);
      expect(response.body.message).to.match(/not authorized/i);
    });

    requestApi('PUT', `/medicines/${TEST_OBJECT_ID}/stock`, {
      body: { stock: 25 },
    }).then((response) => {
      expect(response.status).to.eq(401);
      expect(response.body.message).to.match(/not authorized/i);
    });

    requestApi('PUT', `/pharmacy/${TEST_OBJECT_ID}/queue`, {
      body: { queueLength: 4 },
    }).then((response) => {
      expect(response.status).to.eq(401);
      expect(response.body.message).to.match(/not authorized/i);
    });

    requestApi('PUT', `/orders/${TEST_OBJECT_ID}/status`, {
      body: { status: 'Packed' },
    }).then((response) => {
      expect(response.status).to.eq(401);
      expect(response.body.message).to.match(/not authorized/i);
    });
  });

  it('allows student to access orders with a valid token', () => {
    loginApiUser(studentCredentials).then((studentToken) => {
      requestApi('GET', '/orders', {
        headers: {
          Authorization: `Bearer ${studentToken}`,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
      });
    });
  });

  it('allows pharmacist to access all orders with a valid token', () => {
    loginApiUser(pharmacistCredentials).then((pharmacistToken) => {
      requestApi('GET', '/orders/all', {
        headers: {
          Authorization: `Bearer ${pharmacistToken}`,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
      });
    });
  });

  it('blocks student users from pharmacist-only APIs', () => {
    loginApiUser(studentCredentials).then((studentToken) => {
      const authHeaders = {
        Authorization: `Bearer ${studentToken}`,
      };

      requestApi('GET', '/orders/all', {
        headers: authHeaders,
      }).then((response) => {
        expect(response.status).to.eq(403);
        expect(response.body.message).to.match(/not authorized/i);
      });

      requestApi('POST', '/medicines', {
        headers: authHeaders,
        body: {
          name: 'Student Cannot Create Medicine',
          strength: '10mg',
          manufacturer: 'Campus Health',
          category: 'Allergy',
          description: 'Role guard test',
          usage: 'Role guard test',
          price: 8.25,
          stock: 20,
          reorderLevel: 5,
        },
      }).then((response) => {
        expect(response.status).to.eq(403);
        expect(response.body.message).to.match(/not authorized/i);
      });

      requestApi('PUT', `/medicines/${TEST_OBJECT_ID}/stock`, {
        headers: authHeaders,
        body: { stock: 25 },
      }).then((response) => {
        expect(response.status).to.eq(403);
        expect(response.body.message).to.match(/not authorized/i);
      });

      requestApi('PUT', `/pharmacy/${TEST_OBJECT_ID}/queue`, {
        headers: authHeaders,
        body: { queueLength: 4 },
      }).then((response) => {
        expect(response.status).to.eq(403);
        expect(response.body.message).to.match(/not authorized/i);
      });

      requestApi('PUT', `/orders/${TEST_OBJECT_ID}/status`, {
        headers: authHeaders,
        body: { status: 'Packed' },
      }).then((response) => {
        expect(response.status).to.eq(403);
        expect(response.body.message).to.match(/not authorized/i);
      });

      requestApi('GET', `/prescriptions/${TEST_OBJECT_ID}/review`, {
        headers: authHeaders,
      }).then((response) => {
        expect(response.status).to.eq(403);
        expect(response.body.message).to.match(/not authorized/i);
      });

      requestApi('PUT', `/prescriptions/${TEST_OBJECT_ID}/verify`, {
        headers: authHeaders,
        body: { status: 'Approved' },
      }).then((response) => {
        expect(response.status).to.eq(403);
        expect(response.body.message).to.match(/not authorized/i);
      });
    });
  });

  it('blocks pharmacist users from student-only order creation and prescription upload', () => {
    loginApiUser(pharmacistCredentials).then((pharmacistToken) => {
      const authHeaders = {
        Authorization: `Bearer ${pharmacistToken}`,
      };

      requestApi('POST', '/orders', {
        headers: authHeaders,
        body: {
          items: [{ medicineId: TEST_OBJECT_ID, quantity: 1 }],
          address: 'Dorm A, Room 302',
          paymentMethod: 'Cash on Delivery',
        },
      }).then((response) => {
        expect(response.status).to.eq(403);
        expect(response.body.message).to.match(/not authorized/i);
      });

      requestApi('POST', '/prescriptions/upload', {
        headers: authHeaders,
        form: true,
        body: {
          notes: 'Role guard test',
          deliveryAddress: 'Dorm A, Room 302',
        },
      }).then((response) => {
        expect(response.status).to.eq(403);
        expect(response.body.message).to.match(/not authorized/i);
      });
    });
  });

  it('allows pharmacist to access prescription queue and validates queue payloads before updating', () => {
    loginApiUser(pharmacistCredentials).then((pharmacistToken) => {
      const authHeaders = {
        Authorization: `Bearer ${pharmacistToken}`,
      };

      requestApi('GET', '/prescriptions?status=Pending&limit=5', {
        headers: authHeaders,
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.include.keys(
          'prescriptions',
          'totalPages',
          'currentPage',
          'total'
        );
        expect(response.body.prescriptions).to.be.an('array');
      });

      requestApi('PUT', `/pharmacy/${TEST_OBJECT_ID}/queue`, {
        headers: authHeaders,
        body: { queueLength: -1 },
      }).then((response) => {
        expect(response.status).to.eq(400);
        expect(response.body.message).to.match(/non-negative number/i);
      });
    });
  });
});
