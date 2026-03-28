import { hash } from 'bcryptjs';

/**
 * Seed data for initial database population
 */
const seedData = {
  // Admin User
  admin: {
    name: 'System Administrator',
    email: process.env.ADMIN_EMAIL || 'admin@campushealth.edu',
    password: process.env.ADMIN_PASSWORD || 'Admin@123',
    role: 'admin',
    isActive: true,
    isVerified: true
  },
  
  // Sample Doctors
  doctors: [
    {
      name: 'Dr. Sarah Smith',
      email: process.env.DOCTOR_EMAIL || 'doctor@campushealth.edu',
      password: process.env.DOCTOR_PASSWORD || 'Doctor@123',
      role: 'doctor',
      specialty: 'General Physician',
      experience: 10,
      bio: 'Dr. Sarah Smith is a highly experienced general physician with a passion for student health and wellness.',
      education: ['MD - Harvard Medical School', 'Residency - Mayo Clinic'],
      isActive: true,
      isVerified: true
    },
    {
      name: 'Dr. Michael Chen',
      email: 'michael.chen@campushealth.edu',
      password: 'Doctor@123',
      role: 'doctor',
      specialty: 'Mental Health Counselor',
      experience: 8,
      bio: 'Dr. Michael Chen specializes in student anxiety, stress management, and academic performance counseling.',
      education: ['PhD in Psychology - Stanford University'],
      isActive: true,
      isVerified: true
    },
    {
      name: 'Dr. Emily Wilson',
      email: 'emily.wilson@campushealth.edu',
      password: 'Doctor@123',
      role: 'doctor',
      specialty: 'Dermatologist',
      experience: 6,
      bio: 'Dr. Emily Wilson provides comprehensive skin care treatments and consultations for students.',
      education: ['MD - Johns Hopkins University'],
      isActive: true,
      isVerified: true
    }
  ],
  
  // Sample Students
  students: [
    {
      name: 'John Doe',
      email: 'john.doe@student.edu',
      password: 'Student@123',
      role: 'student',
      studentId: 'STU001',
      phone: '1234567890',
      address: 'Dorm A, Room 302',
      bloodType: 'O+',
      allergies: ['Penicillin'],
      medicalHistory: [
        { condition: 'Seasonal Allergies', date: '2024-05-10', status: 'active' }
      ],
      isActive: true,
      isVerified: true
    },
    {
      name: 'Jane Smith',
      email: 'jane.smith@student.edu',
      password: 'Student@123',
      role: 'student',
      studentId: 'STU002',
      phone: '0987654321',
      address: 'Dorm B, Room 105',
      bloodType: 'A+',
      allergies: [],
      isActive: true,
      isVerified: true
    }
  ],
  
  // Sample Pharmacist
  pharmacist: {
    name: 'Dr. Robert Brown',
    email: process.env.PHARMACIST_EMAIL || 'robert.brown@campushealth.edu',
    password: process.env.PHARMACIST_PASSWORD || 'Pharmacist@123',
    role: 'pharmacist',
    isActive: true,
    isVerified: true
  },
  
  // Sample Medicines
  medicines: [
    {
      name: 'Paracetamol',
      strength: '500mg',
      manufacturer: 'GSK',
      price: 5.99,
      stock: 150,
      reorderLevel: 20,
      requiresPrescription: false,
      category: 'Pain Relief',
      description: 'Used to treat many conditions such as headache, muscle aches, arthritis, backache, toothaches, colds, and fevers.',
      usage: 'Take 1-2 tablets every 4-6 hours as needed.',
      sideEffects: 'Nausea, stomach pain, loss of appetite.',
      storage: 'Store at room temperature away from moisture and heat.',
      isActive: true
    },
    {
      name: 'Amoxicillin',
      strength: '250mg',
      manufacturer: 'Pfizer',
      price: 12.50,
      stock: 45,
      reorderLevel: 10,
      requiresPrescription: true,
      category: 'Antibiotics',
      description: 'A penicillin antibiotic that fights bacteria.',
      usage: 'Take as directed by your doctor, usually every 8 hours.',
      sideEffects: 'Diarrhea, nausea, skin rash.',
      storage: 'Store at room temperature or in the refrigerator.',
      isActive: true
    },
    {
      name: 'Cetirizine',
      strength: '10mg',
      manufacturer: 'Johnson & Johnson',
      price: 8.25,
      stock: 8,
      reorderLevel: 15,
      requiresPrescription: false,
      category: 'Allergy',
      description: 'An antihistamine that reduces the natural chemical histamine in the body.',
      usage: 'Take one tablet daily.',
      sideEffects: 'Drowsiness, dry mouth, sore throat.',
      storage: 'Store at room temperature.',
      isActive: true
    },
    {
      name: 'Ibuprofen',
      strength: '400mg',
      manufacturer: 'Advil',
      price: 7.45,
      stock: 200,
      reorderLevel: 30,
      requiresPrescription: false,
      category: 'Pain Relief',
      description: 'A nonsteroidal anti-inflammatory drug (NSAID).',
      usage: 'Take 1 tablet every 4 to 6 hours.',
      sideEffects: 'Upset stomach, mild heartburn, nausea.',
      storage: 'Store in a cool, dry place.',
      image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=400',
      isActive: true
    },
    {
      name: 'Daily Multivitamin',
      strength: '100% DV',
      manufacturer: 'Nature Made',
      price: 15.99,
      stock: 80,
      reorderLevel: 15,
      requiresPrescription: false,
      category: 'Vitamins',
      description: 'Complete multivitamin for daily health support.',
      usage: 'Take 1 tablet daily with a meal.',
      sideEffects: 'Mild stomach upset.',
      storage: 'Store in a cool, dry place.',
      image: 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&q=80&w=400',
      isActive: true
    },
    {
      name: 'Vitamin C 1000mg',
      strength: '1000mg',
      manufacturer: 'Centrum',
      price: 12.50,
      stock: 120,
      reorderLevel: 20,
      requiresPrescription: false,
      category: 'Vitamins',
      description: 'High-potency Vitamin C for immune support.',
      usage: 'Take 1 tablet per day.',
      sideEffects: 'None known.',
      storage: 'Store at room temperature.',
      image: 'https://images.unsplash.com/photo-1631549916768-4119cb8e0f72?auto=format&fit=crop&q=80&w=400',
      isActive: true
    },
    {
      name: 'Fish Oil Omega-3',
      strength: '1200mg',
      manufacturer: 'Nordic Naturals',
      price: 18.25,
      stock: 60,
      reorderLevel: 10,
      requiresPrescription: false,
      category: 'Vitamins',
      description: 'Supports heart, brain, and eye health.',
      usage: 'Take 2 capsules daily with food.',
      sideEffects: 'Fishy aftertaste.',
      storage: 'Keep in a cool, dark place.',
      image: 'https://images.unsplash.com/photo-1559839734-2b71f1e59816?auto=format&fit=crop&q=80&w=400',
      isActive: true
    },
    {
      name: 'Hand Sanitizer 500ml',
      strength: '70% Alcohol',
      manufacturer: 'Purell',
      price: 6.50,
      stock: 300,
      reorderLevel: 50,
      requiresPrescription: false,
      category: 'Hygiene',
      description: 'Kills 99.99% of germs while keeping hands soft.',
      usage: 'Apply small amount and rub on hands until dry.',
      sideEffects: 'Skin dryness.',
      storage: 'Keep away from fire or flame.',
      image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400',
      isActive: true
    },
    {
      name: 'First Aid Kit Professional',
      strength: '100 Pieces',
      manufacturer: 'Johnson & Johnson',
      price: 24.99,
      stock: 40,
      reorderLevel: 8,
      requiresPrescription: false,
      category: 'First Aid',
      description: 'Complete kit for cuts, scrapes, and minor injuries.',
      usage: 'Apply as needed for minor wounds.',
      sideEffects: 'None.',
      storage: 'Keep in a dry, accessible place.',
      image: 'https://images.unsplash.com/photo-1599806112334-d01d17564103?auto=format&fit=crop&q=80&w=400',
      isActive: true
    },
    {
      name: 'Face Masks - 50 Pack',
      strength: '3-Layer Protection',
      manufacturer: 'MedSupply',
      price: 14.50,
      stock: 100,
      reorderLevel: 20,
      requiresPrescription: false,
      category: 'Hygiene',
      description: 'Disposable masks with elastic ear loops.',
      usage: 'Cover nose and mouth.',
      sideEffects: 'None.',
      storage: 'Store in a clean, dry place.',
      image: 'https://images.unsplash.com/photo-1550133730-695473e544be?auto=format&fit=crop&q=80&w=400',
      isActive: true
    },
    {
      name: 'Digital Thermometer',
      strength: 'LCD Display',
      manufacturer: 'Braun',
      price: 29.99,
      stock: 25,
      reorderLevel: 5,
      requiresPrescription: false,
      category: 'Wellness',
      description: 'Accurate and fast temp readings for all ages.',
      usage: 'Oral or underarm use.',
      sideEffects: 'None.',
      storage: 'Keep in protective case.',
      image: 'https://images.unsplash.com/photo-1584622781464-111162447959?auto=format&fit=crop&q=80&w=400',
      isActive: true
    }
  ],
  
  // Sample FAQs
  faqs: [
    {
      question: 'How do I book an appointment?',
      answer: 'You can book an appointment by navigating to the Appointments section on your dashboard and selecting a doctor or counselor available at your preferred time.',
      category: 'General',
      order: 1,
      isActive: true
    },
    {
      question: 'Is my data private?',
      answer: 'Yes, CampusHealth uses industry-standard encryption and follows strict HIPAA-compliant protocols to ensure your medical and personal data is secure and private.',
      category: 'Security',
      order: 2,
      isActive: true
    },
    {
      question: 'How do I upload a prescription?',
      answer: 'Go to the Pharmacy section, click on Upload Prescription, and select the image or PDF file from your device. Our pharmacist will verify it within 24 hours.',
      category: 'Pharmacy',
      order: 3,
      isActive: true
    },
    {
      question: 'What should I do in an emergency?',
      answer: 'For immediate life-threatening emergencies, call campus security at 911 or visit the nearest emergency room. You can also use our First Aid guide for minor issues.',
      category: 'Emergency',
      order: 4,
      isActive: true
    }
  ],
  
  // Sample System Settings
  settings: [
    { key: 'platformName', value: 'CampusHealth', type: 'string' },
    { key: 'supportEmail', value: 'support@campushealth.edu', type: 'string' },
    { key: 'timezone', value: 'UTC-5', type: 'string' },
    { key: 'maintenanceMode', value: false, type: 'boolean' },
    { key: 'allowRegistration', value: true, type: 'boolean' },
    { key: 'requireEmailVerification', value: true, type: 'boolean' },
    { key: 'sessionTimeout', value: 30, type: 'number' },
    { key: 'maxAppointmentsPerDay', value: 5, type: 'number' },
    { key: 'prescriptionValidityDays', value: 30, type: 'number' },
    { key: 'freeDeliveryThreshold', value: 50, type: 'number' }
  ]
};

/**
 * Seed the database with initial data
 * @param {Object} models - Mongoose models
 */
const seedDatabase = async (models) => {
  const { User, Medicine, FAQ, Settings, Order, Prescription } = models;
  
  try {
    // Check if admin exists and sync credentials
    const adminUser = await User.findOne({ email: seedData.admin.email });
    if (!adminUser) {
      await User.create(seedData.admin);
      console.log('Admin user created');
    } else {
      adminUser.name = seedData.admin.name;
      adminUser.password = seedData.admin.password;
      await adminUser.save();
      console.log('Admin user synced');
    }
    
    // Seed doctors
    for (let i = 0; i < seedData.doctors.length; i++) {
      const doctor = seedData.doctors[i];
      if (!await User.findOne({ email: doctor.email })) {
        await User.create(doctor);
        console.log(`Doctor ${doctor.name} created`);
      }
    }
    
    // Seed students
    for (const student of seedData.students) {
      if (!await User.findOne({ email: student.email })) {
        await User.create(student);
        console.log(`Student ${student.name} created`);
      }
    }
    
    // Seed pharmacist
    if (!await User.findOne({ email: seedData.pharmacist.email })) {
      await User.create(seedData.pharmacist);
      console.log('Pharmacist created');
    }
    
    // Seed medicines
    for (const medicine of seedData.medicines) {
      if (!await Medicine.findOne({ name: medicine.name })) {
        await Medicine.create(medicine);
        console.log(`Medicine ${medicine.name} created`);
      }
    }

    // Seed sample prescriptions and orders for John Doe
    const student = await User.findOne({ email: 'john.doe@student.edu' });
    const doctor = await User.findOne({ role: 'doctor' });
    const meds = await Medicine.find({}).limit(3);

    if (student && doctor && meds.length > 0) {
      // Seed sample prescription if none exist for this student
      if (!await Prescription.findOne({ studentId: student._id })) {
        await Prescription.create({
          studentId: student._id,
          studentName: student.name,
          doctorId: doctor._id,
          doctorName: doctor.name,
          status: 'Approved',
          medicines: [
            { name: meds[0].name, dosage: '500mg', duration: '5 days', frequency: 'Twice daily', instructions: 'Take after meals' }
          ],
          notes: 'Standard prescription for seasonal allergy.'
        });
        console.log('Sample prescription created for John Doe');
      }

      // Seed sample orders if none exist
      if (!await Order.findOne({ studentId: student._id })) {
        // Ongoing order
        await Order.create({
          studentId: student._id,
          studentName: student.name,
          studentEmail: student.email,
          items: [{ medicineId: meds[0]._id, name: meds[0].name, price: meds[0].price, quantity: 1 }],
          subtotal: meds[0].price,
          total: meds[0].price + 2.50,
          status: 'Dispatched',
          paymentMethod: 'Campus Card',
          paymentStatus: 'Paid',
          address: student.address
        });

        // Past order
        await Order.create({
          studentId: student._id,
          studentName: student.name,
          studentEmail: student.email,
          items: [{ medicineId: meds[1]._id, name: meds[1].name, price: meds[1].price, quantity: 2 }],
          subtotal: meds[1].price * 2,
          total: (meds[1].price * 2) + 2.50,
          status: 'Delivered',
          paymentMethod: 'Credit Card',
          paymentStatus: 'Paid',
          address: student.address
        });
        console.log('Sample orders created for John Doe');
      }
    }
    
    // Seed FAQs and Settings
    for (const faq of seedData.faqs) {
      if (!await FAQ.findOne({ question: faq.question })) await FAQ.create(faq);
    }
    for (const setting of seedData.settings) {
      if (!await Settings.findOne({ key: setting.key })) await Settings.create(setting);
    }
    
    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

export default { seedData, seedDatabase };