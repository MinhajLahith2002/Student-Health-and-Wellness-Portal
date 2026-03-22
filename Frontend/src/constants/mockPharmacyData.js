export const OrderStatus = Object.freeze({
  PENDING: 'Pending',
  VERIFIED: 'Verified',
  PACKED: 'Packed',
  DISPATCHED: 'Dispatched',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
});

export const PrescriptionStatus = Object.freeze({
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
});


export const MOCK_MEDICINES = [
  {
    id: "1",
    name: "Paracetamol",
    strength: "500mg",
    manufacturer: "GSK",
    price: 5.99,
    stock: 150,
    reorderLevel: 20,
    requiresPrescription: false,
    category: "Pain Relief",
    description: "Used to treat many conditions such as headache, muscle aches, arthritis, backache, toothaches, colds, and fevers.",
    usage: "Take 1-2 tablets every 4-6 hours as needed.",
    sideEffects: "Nausea, stomach pain, loss of appetite.",
    storage: "Store at room temperature away from moisture and heat.",
    image: "https://picsum.photos/seed/paracetamol/400/300"
  },
  {
    id: "2",
    name: "Amoxicillin",
    strength: "250mg",
    manufacturer: "Pfizer",
    price: 12.50,
    stock: 45,
    reorderLevel: 10,
    requiresPrescription: true,
    category: "Antibiotics",
    description: "A penicillin antibiotic that fights bacteria.",
    usage: "Take as directed by your doctor, usually every 8 hours.",
    sideEffects: "Diarrhea, nausea, skin rash.",
    storage: "Store at room temperature or in the refrigerator.",
    image: "https://picsum.photos/seed/amoxicillin/400/300"
  },
  {
    id: "3",
    name: "Cetirizine",
    strength: "10mg",
    manufacturer: "Johnson & Johnson",
    price: 8.25,
    stock: 8,
    reorderLevel: 15,
    requiresPrescription: false,
    category: "Allergy",
    description: "An antihistamine that reduces the natural chemical histamine in the body.",
    usage: "Take one tablet daily.",
    sideEffects: "Drowsiness, dry mouth, sore throat.",
    storage: "Store at room temperature.",
    image: "https://picsum.photos/seed/cetirizine/400/300"
  },
  {
    id: "4",
    name: "Ibuprofen",
    strength: "400mg",
    manufacturer: "Advil",
    price: 7.45,
    stock: 200,
    reorderLevel: 30,
    requiresPrescription: false,
    category: "Pain Relief",
    description: "A nonsteroidal anti-inflammatory drug (NSAID).",
    usage: "Take 1 tablet every 4 to 6 hours.",
    sideEffects: "Upset stomach, mild heartburn, nausea.",
    storage: "Store in a cool, dry place.",
    image: "https://picsum.photos/seed/ibuprofen/400/300"
  }
];

export const MOCK_ORDERS = [
  {
    id: "ORD-1001",
    studentId: "S123",
    studentName: "John Doe",
    items: [{ medicineId: "1", quantity: 2, price: 5.99 }],
    total: 11.98,
    status: OrderStatus.DISPATCHED,
    date: "2026-02-27T10:00:00Z",
    address: "Dorm A, Room 302",
    paymentMethod: "Campus Card"
  },
  {
    id: "ORD-1002",
    studentId: "S123",
    studentName: "John Doe",
    items: [{ medicineId: "3", quantity: 1, price: 8.25 }],
    total: 8.25,
    status: OrderStatus.PENDING,
    date: "2026-02-28T09:30:00Z",
    address: "Dorm A, Room 302",
    paymentMethod: "Credit Card"
  }
];

export const MOCK_PRESCRIPTIONS = [
  {
    id: "PR-501",
    studentId: "S123",
    studentName: "John Doe",
    imageUrl: "https://picsum.photos/seed/prescription/600/800",
    status: PrescriptionStatus.APPROVED,
    date: "2026-02-26T14:20:00Z",
    notes: "Need generic version if possible"
  }
];

export const MOCK_PHARMACIES = [
  {
    id: "PH-1",
    name: "Central Campus Pharmacy",
    address: "Student Union, Level 1",
    lat: 51.505,
    lng: -0.09,
    queueLength: 3,
    openingHours: "08:00 - 20:00"
  },
  {
    id: "PH-2",
    name: "North Dorms Health Store",
    address: "North Gate Plaza",
    lat: 51.51,
    lng: -0.1,
    queueLength: 12,
    openingHours: "09:00 - 18:00"
  }
];
