const studentUser = {
  _id: 'student-1',
  name: 'John Student',
  email: 'john.student@example.com',
  role: 'student',
  isVerified: true,
};

const pharmacistUser = {
  _id: 'pharmacist-1',
  name: 'Maya Pharmacist',
  email: 'maya.pharmacist@example.com',
  phone: '0771234567',
  role: 'pharmacist',
  isVerified: true,
};

const medicines = [
  {
    _id: 'med-1',
    name: 'Paracetamol',
    strength: '500mg',
    manufacturer: 'Campus Health',
    category: 'Pain Relief',
    description: 'Fast relief for fever and mild pain.',
    usage: 'Take after meals.',
    price: 4.5,
    stock: 42,
    reorderLevel: 10,
    requiresPrescription: false,
    image: '',
  },
  {
    _id: 'med-2',
    name: 'Vitamin C',
    strength: '1000mg',
    manufacturer: 'Wellness Labs',
    category: 'Vitamins',
    description: 'Daily immune support supplement.',
    usage: 'Take once daily.',
    price: 8,
    stock: 3,
    reorderLevel: 8,
    requiresPrescription: false,
    image: '',
  },
  {
    _id: 'med-3',
    name: 'Amoxicillin',
    strength: '250mg',
    manufacturer: 'MediCare',
    category: 'Antibiotics',
    description: 'Prescription antibiotic.',
    usage: 'Use as prescribed.',
    price: 12.25,
    stock: 12,
    reorderLevel: 5,
    requiresPrescription: true,
    image: '',
  },
];

const studentOrders = [
  {
    _id: 'order-1',
    orderId: 'ORD-1001',
    orderType: 'Direct',
    status: 'Pending',
    createdAt: '2026-04-24T09:30:00.000Z',
    total: 17,
    paymentMethod: 'Cash on Delivery',
    address: 'Dorm A, Room 302',
    items: [
      { name: 'Paracetamol', quantity: 2, price: 4.5, requiresPrescription: false },
      { name: 'Vitamin C', quantity: 1, price: 8, requiresPrescription: false },
    ],
  },
];

const prescriptions = [
  {
    _id: 'rx-1',
    studentId: { _id: 'student-1', studentId: 'STU-001' },
    studentName: 'John Student',
    status: 'Pending',
    imageUrl: '',
    fileMimeType: 'image/png',
    notes: 'Flu prescription for pickup',
    deliveryAddress: 'Dorm A, Room 302',
    createdAt: '2026-04-24T10:15:00.000Z',
  },
];

const pharmacistOrders = [
  {
    _id: 'order-1',
    orderId: 'ORD-1001',
    orderType: 'Direct',
    status: 'Pending',
    studentId: { _id: 'student-1', studentId: 'STU-001' },
    studentName: 'John Student',
    studentEmail: 'john.student@example.com',
    studentPhone: '0771112222',
    createdAt: '2026-04-24T09:30:00.000Z',
    updatedAt: '2026-04-24T09:30:00.000Z',
    total: 17,
    paymentMethod: 'Cash on Delivery',
    address: 'Dorm A, Room 302',
    items: [
      { name: 'Paracetamol', quantity: 2, price: 4.5, requiresPrescription: false },
      { name: 'Vitamin C', quantity: 1, price: 8, requiresPrescription: false },
    ],
  },
  {
    _id: 'order-2',
    orderId: 'RX-2040',
    orderType: 'Prescription',
    status: 'Packed',
    studentId: { _id: 'student-2', studentId: 'STU-002' },
    studentName: 'Asha Student',
    studentEmail: 'asha.student@example.com',
    studentPhone: '0773334444',
    prescriptionId: { _id: 'rx-2', notes: 'Antibiotic course' },
    createdAt: '2026-04-24T11:00:00.000Z',
    updatedAt: '2026-04-24T11:20:00.000Z',
    total: 0,
    paymentMethod: 'Cash on Delivery',
    address: 'Dorm B, Room 101',
    items: [],
  },
];

function medicinesResponse() {
  return {
    medicines,
    totalPages: 1,
    currentPage: 1,
    total: medicines.length,
  };
}

function stubStudentPharmacyApi() {
  cy.intercept('GET', '**/api/users/profile', studentUser).as('studentProfile');
  cy.intercept('GET', '**/api/medicines/*', (req) => {
    const medicineId = req.url.split('/').pop();
    req.reply(medicines.find((medicine) => medicine._id === medicineId) || medicines[0]);
  }).as('getMedicineDetail');
  cy.intercept('GET', '**/api/medicines?*', medicinesResponse()).as('getMedicines');
  cy.intercept('GET', '**/api/orders*', {
    orders: studentOrders,
    totalPages: 1,
    currentPage: 1,
    total: studentOrders.length,
  }).as('getStudentOrders');
  cy.intercept('GET', '**/api/prescriptions*', {
    prescriptions,
    totalPages: 1,
    currentPage: 1,
    total: prescriptions.length,
  }).as('getStudentPrescriptions');
  cy.intercept('POST', '**/api/prescriptions/upload', {
    statusCode: 201,
    body: { ...prescriptions[0], _id: 'rx-uploaded' },
  }).as('uploadPrescription');
  cy.intercept('POST', '**/api/orders', {
    statusCode: 201,
    body: { ...studentOrders[0], _id: 'order-new', orderId: 'ORD-2002' },
  }).as('createOrder');
}

function stubPharmacistPharmacyApi() {
  cy.intercept('GET', '**/api/users/profile', pharmacistUser).as('pharmacistProfile');
  cy.intercept('GET', '**/api/medicines/*', (req) => {
    const medicineId = req.url.split('/').pop();
    req.reply(medicines.find((medicine) => medicine._id === medicineId) || medicines[0]);
  }).as('getMedicineDetail');
  cy.intercept('GET', '**/api/medicines?*', medicinesResponse()).as('getMedicines');
  cy.intercept('GET', '**/api/orders/all*', {
    orders: pharmacistOrders,
    totalPages: 1,
    currentPage: 1,
    total: pharmacistOrders.length,
  }).as('getAllOrders');
  cy.intercept('GET', '**/api/prescriptions/*/review', {
    mode: 'checklist',
    summary: 'Prescription is readable and ready for pharmacist review.',
    checks: [{ label: 'Legibility', status: 'pass', detail: 'Student details are clear.' }],
    recommendation: 'Approve if medicine availability is confirmed.',
  }).as('getPrescriptionReview');
  cy.intercept('GET', '**/api/prescriptions*', {
    prescriptions,
    totalPages: 1,
    currentPage: 1,
    total: prescriptions.length,
  }).as('getPrescriptions');
  cy.intercept('PUT', '**/api/orders/*/status', (req) => {
    expect(req.body.status).to.eq('Packed');
    req.reply({ ...pharmacistOrders[0], status: 'Packed' });
  }).as('updateOrderStatus');
  cy.intercept('PUT', '**/api/prescriptions/*/verify', (req) => {
    expect(req.body.status).to.eq('Approved');
    req.reply({ ...prescriptions[0], status: 'Approved', pharmacistNotes: req.body.pharmacistNotes });
  }).as('verifyPrescription');
  cy.intercept('POST', '**/api/medicines', {
    statusCode: 201,
    body: { ...medicines[0], _id: 'med-new', name: 'Campus Pain Relief' },
  }).as('createMedicine');
}

before(() => {
  cy.task('startVite');
});

describe('Pharmacy UI - student role', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    stubStudentPharmacyApi();
  });

  it('shows the student pharmacy dashboard and navigates search to the catalog', () => {
    cy.visitAsRole('/student/pharmacy', 'student');

    cy.contains('Modern pharmacy care designed for everyday student health.').should('be.visible');
    cy.contains('Catalog').should('be.visible');
    cy.contains('Upload').should('be.visible');
    cy.contains('Orders').should('be.visible');
    cy.contains('ORD-1001').should('be.visible');
    cy.contains('Paracetamol').should('be.visible');

    cy.get('input[placeholder*="Search for medicines"]').type('vitamin{enter}');
    cy.location('pathname').should('eq', '/student/pharmacy/products');
    cy.location('search').should('include', 'q=vitamin');
  });

  it('lets a student browse, filter, and add a pharmacy product to cart', () => {
    cy.visitAsRole('/student/pharmacy/products', 'student');
    cy.wait('@getMedicines');

    cy.contains('Pharmacy Catalog').should('be.visible');
    cy.contains('Paracetamol').should('be.visible');
    cy.contains('Vitamin C').should('be.visible');

    cy.get('input[placeholder*="Search medicines"]').clear().type('Vitamin');
    cy.contains('Vitamin C').should('be.visible');
    cy.contains('Paracetamol').should('not.exist');

    cy.contains('button', 'Add').click();
    cy.contains('a[href="/student/pharmacy/checkout"] span', '1').should('be.visible');
  });

  it('shows student order and prescription activity', () => {
    cy.visitAsRole('/student/pharmacy/orders', 'student');
    cy.wait(['@getStudentOrders', '@getStudentPrescriptions']);

    cy.contains('Pharmacy Activity').should('be.visible');
    cy.contains('ORD-1001').should('be.visible');
    cy.contains('Paracetamol x2').should('be.visible');
    cy.contains('Track').should('be.visible');

    cy.contains('button', 'Prescriptions').click();
    cy.contains('Flu prescription for pickup').should('be.visible');
    cy.contains('Verification in progress').should('be.visible');
  });

  it('shows medicine details and adds the medicine to the cart', () => {
    cy.visitAsRole('/student/pharmacy/medicine/med-1', 'student');
    cy.wait(['@getMedicineDetail', '@getMedicines']);

    cy.contains('Paracetamol').should('be.visible');
    cy.contains('Fast relief for fever and mild pain.').should('be.visible');
    cy.contains('How to use').should('be.visible');

    cy.contains('button', 'Add to Cart').click();
    cy.contains('a[href="/student/pharmacy/checkout"] span', '1').should('be.visible');
  });

  it('lets a student upload a prescription document', () => {
    cy.visitAsRole('/student/pharmacy/upload-prescription', 'student');

    cy.contains('Submit Your Prescription').should('be.visible');
    cy.get('input[type="file"]').selectFile({
      contents: Cypress.Buffer.from('fake prescription pdf'),
      fileName: 'prescription.pdf',
      mimeType: 'application/pdf',
    }, { force: true });

    cy.contains('File ready to upload').should('be.visible');
    cy.get('textarea[placeholder*="generic version"]').type('Please prepare generic option if available.');
    cy.get('textarea[placeholder*="campus delivery address"]').type('Dorm A, Room 302');
    cy.get('input[placeholder*="Delivery instructions"]').type('Call before delivery');
    cy.contains('button', 'Submit for Verification').click();

    cy.wait('@uploadPrescription');
    cy.contains('Upload Successful!').should('be.visible');
    cy.contains('Track Status').should('be.visible');
  });

  it('lets a student place a direct checkout order', () => {
    cy.visitAsRole('/student/pharmacy/checkout', 'student', {
      onBeforeLoad(win) {
        win.localStorage.setItem('pharmacy_cart', JSON.stringify([{ ...medicines[0], quantity: 2 }]));
      },
    });

    cy.contains('Checkout').should('be.visible');
    cy.contains('Paracetamol').should('be.visible');
    cy.get('#delivery-address').type('Dorm A, Room 302');
    cy.contains('button', 'Place Order').click();

    cy.wait('@createOrder');
    cy.contains('Order Placed!').should('be.visible');
    cy.contains('order-new').should('be.visible');
  });
});

describe('Pharmacy UI - pharmacist role', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    stubPharmacistPharmacyApi();
  });

  it('shows the pharmacist dashboard work queues and stock alerts', () => {
    cy.visitAsRole('/pharmacist/dashboard', 'pharmacist');
    cy.wait(['@pharmacistProfile', '@getPrescriptions', '@getAllOrders', '@getMedicines']);

    cy.contains('Pharmacist Portal').should('be.visible');
    cy.contains('Pending Prescriptions').should('be.visible');
    cy.contains('Orders to Process').should('be.visible');
    cy.contains('Low Stock Items').should('be.visible');
    cy.contains('ORD-1001').should('be.visible');
    cy.contains('Vitamin C').should('be.visible');
    cy.contains('John Student').should('be.visible');
  });

  it('lets a pharmacist review inventory and search low-stock medicine', () => {
    cy.visitAsRole('/pharmacist/inventory', 'pharmacist');
    cy.wait('@getMedicines');

    cy.contains('Inventory Management').should('be.visible');
    cy.contains('Low Stock Alert').should('be.visible');
    cy.contains('Vitamin C:').should('be.visible');

    cy.get('input[placeholder*="Search by medicine"]').click({ force: true }).type('Vitamin', { force: true });
    cy.contains('Vitamin C').should('be.visible');
    cy.contains('Paracetamol').should('not.exist');
    cy.contains('Low Stock').should('be.visible');
  });

  it('lets a pharmacist open an order and mark it as packed', () => {
    cy.visitAsRole('/pharmacist/orders', 'pharmacist');
    cy.wait('@getAllOrders');

    cy.contains('Order Management').should('be.visible');
    cy.contains('Order ORD-1001').click();
    cy.contains('Student: John Student').should('be.visible');
    cy.contains('Dorm A, Room 302').should('be.visible');

    cy.contains('button', 'Mark as Packed').click();
    cy.wait('@updateOrderStatus');
  });

  it('lets a pharmacist review and approve a pending prescription', () => {
    cy.visitAsRole('/pharmacist/prescriptions', 'pharmacist');
    cy.wait(['@getPrescriptions', '@getPrescriptionReview']);

    cy.contains('Prescription Processing').should('be.visible');
    cy.contains('John Student').should('be.visible');
    cy.contains('Prescription is readable and ready for pharmacist review.').should('be.visible');

    cy.contains('button', 'Approve Prescription').click();
    cy.get('textarea[placeholder*="Approved for processing"]').type('Approved for preparation.');
    cy.contains('button', 'Confirm Approval').click();
    cy.wait('@verifyPrescription');
    cy.location('pathname').should('eq', '/pharmacist/orders');
  });

  it('lets a pharmacist add a new medicine', () => {
    cy.visitAsRole('/pharmacist/medicines/new', 'pharmacist');

    cy.contains('Add New Medicine').should('be.visible');
    cy.get('input[name="name"]').type('Campus Pain Relief');
    cy.get('input[name="strength"]').type('500mg');
    cy.get('input[name="manufacturer"]').type('Campus Health');
    cy.get('select[name="category"]').select('Pain Relief');
    cy.get('input[name="price"]').type('6.50');
    cy.get('input[name="stock"]').type('50');
    cy.get('textarea[name="description"]').type('Pain relief tablet for mild headaches.');
    cy.get('textarea[name="usage"]').type('Take one tablet after meals when needed.');
    cy.contains('button', 'Save Medicine').click();

    cy.wait('@createMedicine');
    cy.contains('Medicine added successfully!').should('be.visible');
  });
});
