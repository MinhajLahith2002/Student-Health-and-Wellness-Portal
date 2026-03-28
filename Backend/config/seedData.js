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
  const { User, Medicine, FAQ, Settings } = models;
  
  try {
    // Check if admin exists and sync credentials
    const adminUser = await User.findOne({ email: seedData.admin.email });
    if (!adminUser) {
      await User.create(seedData.admin);
      console.log('Admin user created');
    } else {
      // Always update admin name and password to match current .env settings
      adminUser.name = seedData.admin.name;
      adminUser.password = seedData.admin.password;
      await adminUser.save();
      console.log('Admin user synced with latest credentials');
    }
    
    // Check if doctors exist and sync first doctor's credentials
    for (let i = 0; i < seedData.doctors.length; i++) {
      const doctor = seedData.doctors[i];
      const doctorUser = await User.findOne({ email: doctor.email });
      if (!doctorUser) {
        await User.create(doctor);
        console.log(`Doctor ${doctor.name} created`);
      } else if (i === 0) {
        // Only sync the first doctor with .env for simplicity
        doctorUser.password = doctor.password;
        await doctorUser.save();
        console.log('Default Doctor synced with latest credentials');
      }
    }
    
    // Check if students exist
    for (const student of seedData.students) {
      const studentExists = await User.findOne({ email: student.email });
      if (!studentExists) {
        await User.create(student);
        console.log(`Student ${student.name} created`);
      }
    }
    
    // Check if pharmacist exists and sync credentials
    const pharmacistUser = await User.findOne({ email: seedData.pharmacist.email });
    if (!pharmacistUser) {
      await User.create(seedData.pharmacist);
      console.log('Pharmacist created');
    } else {
      pharmacistUser.password = seedData.pharmacist.password;
      await pharmacistUser.save();
      console.log('Pharmacist synced with latest credentials');
    }
    
    // Seed medicines
    for (const medicine of seedData.medicines) {
      const medicineExists = await Medicine.findOne({ name: medicine.name });
      if (!medicineExists) {
        await Medicine.create(medicine);
        console.log(`Medicine ${medicine.name} created`);
      }
    }
    
    // Seed FAQs
    for (const faq of seedData.faqs) {
      const faqExists = await FAQ.findOne({ question: faq.question });
      if (!faqExists) {
        await FAQ.create(faq);
        console.log(`FAQ created: ${faq.question}`);
      }
    }
    
    // Seed settings
    for (const setting of seedData.settings) {
      const settingExists = await Settings.findOne({ key: setting.key });
      if (!settingExists) {
        await Settings.create(setting);
        console.log(`Setting created: ${setting.key}`);
      }
    }
    
    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

export default { seedData, seedDatabase };