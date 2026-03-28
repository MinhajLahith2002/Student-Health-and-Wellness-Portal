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
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=400"
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
    image: "https://images.unsplash.com/photo-1471864190281-ad5f9f3ef0b2?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "3",
    name: "Daily Multivitamin",
    strength: "100% DV",
    manufacturer: "Nature Made",
    price: 15.99,
    stock: 80,
    reorderLevel: 15,
    requiresPrescription: false,
    category: "Vitamins",
    description: "Complete multivitamin for daily health support.",
    usage: "Take 1 tablet daily with a meal.",
    sideEffects: "Mild stomach upset.",
    storage: "Store in a cool, dry place.",
    image: "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "4",
    name: "Vitamin C 1000mg",
    strength: "1000mg",
    manufacturer: "Centrum",
    price: 12.50,
    stock: 120,
    reorderLevel: 20,
    requiresPrescription: false,
    category: "Vitamins",
    description: "High-potency Vitamin C for immune support.",
    usage: "Take 1 tablet per day.",
    sideEffects: "None known.",
    storage: "Store at room temperature.",
    image: "https://images.unsplash.com/photo-1631549916768-4119cb8e0f72?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "5",
    name: "Fish Oil Omega-3",
    strength: "1200mg",
    manufacturer: "Nordic Naturals",
    price: 18.25,
    stock: 60,
    reorderLevel: 10,
    requiresPrescription: false,
    category: "Vitamins",
    description: "Supports heart, brain, and eye health.",
    usage: "Take 2 capsules daily with food.",
    sideEffects: "Fishy aftertaste.",
    storage: "Keep in a cool, dark place.",
    image: "https://images.unsplash.com/photo-1559839734-2b71f1e59816?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "6",
    name: "Hand Sanitizer 500ml",
    strength: "70% Alcohol",
    manufacturer: "Purell",
    price: 6.50,
    stock: 300,
    reorderLevel: 50,
    requiresPrescription: false,
    category: "Hygiene",
    description: "Kills 99.99% of germs while keeping hands soft.",
    usage: "Apply small amount and rub on hands until dry.",
    sideEffects: "Skin dryness.",
    storage: "Keep away from fire or flame.",
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "7",
    name: "First Aid Kit Professional",
    strength: "100 Pieces",
    manufacturer: "Johnson & Johnson",
    price: 24.99,
    stock: 40,
    reorderLevel: 8,
    requiresPrescription: false,
    category: "First Aid",
    description: "Complete kit for cuts, scrapes, and minor injuries.",
    usage: "Apply as needed for minor wounds.",
    sideEffects: "None.",
    storage: "Keep in a dry, accessible place.",
    image: "https://images.unsplash.com/photo-1599806112334-d01d17564103?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "8",
    name: "Face Masks - 50 Pack",
    strength: "3-Layer Protection",
    manufacturer: "MedSupply",
    price: 14.50,
    stock: 100,
    reorderLevel: 20,
    requiresPrescription: false,
    category: "Hygiene",
    description: "Disposable masks with elastic ear loops.",
    usage: "Cover nose and mouth.",
    sideEffects: "None.",
    storage: "Store in a clean, dry place.",
    image: "https://images.unsplash.com/photo-1550133730-695473e544be?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "9",
    name: "Digital Thermometer",
    strength: "LCD Display",
    manufacturer: "Braun",
    price: 29.99,
    stock: 25,
    reorderLevel: 5,
    requiresPrescription: false,
    category: "Wellness",
    description: "Accurate and fast temp readings for all ages.",
    usage: "Oral or underarm use.",
    sideEffects: "None.",
    storage: "Keep in protective case.",
    image: "https://images.unsplash.com/photo-1584622781464-111162447959?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "10",
    name: "Throat Lozenges",
    strength: "Honey & Lemon",
    manufacturer: "Strepsils",
    price: 8.99,
    stock: 150,
    reorderLevel: 30,
    requiresPrescription: false,
    category: "Wellness",
    description: "Dual action formula for sore throat relief.",
    usage: "Dissolve one lozenge slowly in the mouth every 3 hours.",
    sideEffects: "None.",
    storage: "Store below 25°C.",
    image: "https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&q=80&w=400"
  }
];

export const MOCK_ORDERS = [
  {
    id: "ORD-1001",
    studentId: "S123",
    studentName: "John Doe",
    items: [{ medicineId: "1", quantity: 2, price: 5.99, name: "Paracetamol" }],
    total: 14.48,
    status: OrderStatus.DISPATCHED,
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    address: "Dorm A, Room 302",
    paymentMethod: "Campus Card"
  },
  {
    id: "ORD-1002",
    studentId: "S123",
    studentName: "John Doe",
    items: [{ medicineId: "3", quantity: 1, price: 15.99, name: "Daily Multivitamin" }],
    total: 18.49,
    status: OrderStatus.PENDING,
    date: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    address: "Dorm A, Room 302",
    paymentMethod: "Credit Card"
  },
  {
    id: "ORD-1003",
    studentId: "S123",
    studentName: "John Doe",
    items: [{ medicineId: "7", quantity: 1, price: 24.99, name: "First Aid Kit" }],
    total: 27.49,
    status: OrderStatus.DELIVERED,
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    address: "Dorm A, Room 302",
    paymentMethod: "Campus Card"
  }
];

export const MOCK_PRESCRIPTIONS = [
  {
    id: "PR-501",
    studentId: "S123",
    studentName: "John Doe",
    imageUrl: "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&q=80&w=800",
    status: PrescriptionStatus.APPROVED,
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    notes: "Requires verified student ID for pick-up."
  },
  {
    id: "PR-502",
    studentId: "S124",
    studentName: "Jane Smith",
    imageUrl: "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&q=80&w=800",
    status: PrescriptionStatus.PENDING,
    date: new Date().toISOString(),
    notes: "New prescription for antibiotics."
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
