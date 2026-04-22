import { hash } from 'bcryptjs';

function safeSeedLog(message) {
  try {
    if (process?.stdout?.writable) {
      process.stdout.write(`${message}\n`);
    }
  } catch {
    // Ignore logging pipe errors so seeding cannot crash the server.
  }
}

function createDateOffset(days, hour = 9, minute = 0) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function createDateOnlyOffset(days) {
  const date = createDateOffset(days);
  date.setHours(0, 0, 0, 0);
  return date;
}

function uniqueUsersByEmail(users = []) {
  const seen = new Set();

  return users.filter((user) => {
    const email = String(user?.email || '').trim().toLowerCase();
    if (!email || seen.has(email)) return false;
    seen.add(email);
    return true;
  });
}

const defaultCounselorAccount = {
  name: 'Dr. Ava Thompson',
  email: 'counselor@gmail.com',
  password: 'counselor123',
  role: 'counselor',
  specialty: 'Student Wellness Counselor',
  experience: 7,
  bio: 'Supports students with stress, anxiety, burnout, grief, and academic-life balance through confidential counseling.',
  education: ['MSc Counseling Psychology - UCLA', 'Licensed Campus Wellness Counselor'],
  isActive: true,
  isVerified: true
};

const configuredCounselorAccount = {
  ...defaultCounselorAccount,
  email: process.env.COUNSELOR_EMAIL || defaultCounselorAccount.email,
  password: process.env.COUNSELOR_PASSWORD || defaultCounselorAccount.password
};

const defaultStudentAccount = {
  name: 'John Doe',
  email: 'john.doe@student.edu',
  password: 'student123',
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
};

const configuredStudentAccount = {
  ...defaultStudentAccount,
  email: process.env.STUDENT_EMAIL || defaultStudentAccount.email,
  password: process.env.STUDENT_PASSWORD || defaultStudentAccount.password
};

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
    configuredStudentAccount,
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

  pharmacies: [
    {
      name: 'Campus Central Pharmacy',
      address: 'Student Union, Level 1',
      location: {
        type: 'Point',
        coordinates: [79.8612, 6.9271],
        lat: 6.9271,
        lng: 79.8612
      },
      phone: '+94 11 234 5678',
      email: 'pharmacy.central@campushealth.edu',
      openingHours: {
        monday: { open: '08:00', close: '20:00' },
        tuesday: { open: '08:00', close: '20:00' },
        wednesday: { open: '08:00', close: '20:00' },
        thursday: { open: '08:00', close: '20:00' },
        friday: { open: '08:00', close: '20:00' },
        saturday: { open: '09:00', close: '18:00' },
        sunday: { open: '10:00', close: '16:00' }
      },
      queueLength: 3,
      estimatedWaitTime: 10,
      isOpen: true,
      services: ['Prescription', 'OTC', 'Health Check']
    },
    {
      name: 'North Residence Pharmacy',
      address: 'North Residential Complex, Block B',
      location: {
        type: 'Point',
        coordinates: [79.8688, 6.9314],
        lat: 6.9314,
        lng: 79.8688
      },
      phone: '+94 11 987 6543',
      email: 'pharmacy.north@campushealth.edu',
      openingHours: {
        monday: { open: '09:00', close: '19:00' },
        tuesday: { open: '09:00', close: '19:00' },
        wednesday: { open: '09:00', close: '19:00' },
        thursday: { open: '09:00', close: '19:00' },
        friday: { open: '09:00', close: '19:00' },
        saturday: { open: '10:00', close: '17:00' },
        sunday: { open: '10:00', close: '15:00' }
      },
      queueLength: 12,
      estimatedWaitTime: 28,
      isOpen: true,
      services: ['Prescription', 'OTC', 'Consultation']
    }
  ],

  // Default Counselor
  counselor: defaultCounselorAccount,

  counselors: uniqueUsersByEmail([
    configuredCounselorAccount,
    defaultCounselorAccount,
    {
      name: 'Dr. Maya Patel',
      email: 'maya.patel@campushealth.edu',
      password: 'counselor123',
      role: 'counselor',
      specialty: 'Anxiety & Stress Support',
      experience: 9,
      bio: 'Helps students manage anxiety, overthinking, panic patterns, and everyday academic stress with practical coping plans.',
      education: ['MA Clinical Mental Health Counseling - Boston University', 'Certified CBT Practitioner'],
      isActive: true,
      isVerified: true
    },
    {
      name: 'Jordan Reyes',
      email: 'jordan.reyes@campushealth.edu',
      password: 'counselor123',
      role: 'counselor',
      specialty: 'Burnout & Academic Balance',
      experience: 6,
      bio: 'Works with students facing exhaustion, motivation loss, procrastination, and study-life imbalance during demanding semesters.',
      education: ['MS Counseling - University of Michigan', 'Campus Resilience Facilitator'],
      isActive: true,
      isVerified: true
    },
    {
      name: 'Dr. Lena Brooks',
      email: 'lena.brooks@campushealth.edu',
      password: 'counselor123',
      role: 'counselor',
      specialty: 'Sleep & Emotional Regulation',
      experience: 8,
      bio: 'Focuses on sleep disruption, emotional regulation, grounding skills, and healthier routines for students under pressure.',
      education: ['PsyD Counseling Psychology - NYU', 'Mindfulness-Based Stress Reduction Facilitator'],
      isActive: true,
      isVerified: true
    },
    {
      name: 'Samira Khan',
      email: 'samira.khan@campushealth.edu',
      password: 'counselor123',
      role: 'counselor',
      specialty: 'Peer Relationship & Transition Support',
      experience: 5,
      bio: 'Supports students adjusting to campus life, friendship stress, loneliness, homesickness, and major life transitions.',
      education: ['MEd Counseling - University of Toronto', 'Student Transition Support Specialist'],
      isActive: true,
      isVerified: true
    }
  ]),
  
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

  // Default mental health resources for counseling and suggestions flows
  resources: [
    {
      title: 'Sleep Recovery Tips During Exam Week',
      description: 'Practical steps to improve sleep quality when deadlines and revision start stacking up.',
      type: 'Article',
      category: 'Mental Health',
      subCategory: 'Sleep',
      content: 'Build a short wind-down routine, avoid caffeine late in the day, and stop intense studying at least thirty minutes before bed. A consistent bedtime and a lower-light environment can improve rest even during high-pressure weeks.',
      author: 'Campus Wellness Team',
      readTime: '6 min',
      tags: ['sleep', 'exams', 'routine'],
      status: 'Published'
    },
    {
      title: 'How to Reset After a Bad Mental Health Day',
      description: 'A gentle article on recovering after a day that felt heavier than expected.',
      type: 'Article',
      category: 'Mental Health',
      subCategory: 'Emotional Recovery',
      content: 'Start by lowering pressure rather than trying to fix everything at once. Hydrate, eat something steady, reduce unnecessary noise, and choose one supportive action such as a shower, short walk, or message to someone safe.',
      author: 'Campus Wellness Team',
      readTime: '5 min',
      tags: ['recovery', 'reset', 'self-support'],
      status: 'Published'
    },
    {
      title: 'Spotting Early Signs of Burnout on Campus',
      description: 'Learn the common warning signs of academic burnout before they become harder to manage.',
      type: 'Article',
      category: 'Mental Health',
      subCategory: 'Burnout',
      content: 'Burnout often builds slowly through irritability, exhaustion, poor concentration, numbness, and a sense that even easy tasks feel expensive. Noticing the pattern early makes rest, boundaries, and support easier to use effectively.',
      author: 'Campus Wellness Team',
      readTime: '7 min',
      tags: ['burnout', 'awareness', 'campus life'],
      status: 'Published'
    },
    {
      title: 'When Overthinking Starts Running the Day',
      description: 'A quick read on interrupting spirals before they take over your routine.',
      type: 'Article',
      category: 'Mental Health',
      subCategory: 'Anxiety Support',
      content: 'Overthinking often sounds productive but leaves you stuck, tense, and tired. Shift from replaying every possibility to naming what is known, what is not known, and the smallest useful next step you can actually take.',
      author: 'Campus Wellness Team',
      readTime: '4 min',
      tags: ['overthinking', 'anxiety', 'focus'],
      status: 'Published'
    },
    {
      title: 'Rebuilding Motivation After Falling Behind',
      description: 'A realistic article for students trying to restart after missed tasks or low-energy weeks.',
      type: 'Article',
      category: 'Mental Health',
      subCategory: 'Motivation',
      content: 'Motivation usually returns after movement, not before it. Shrink tasks, lower perfection, and rebuild trust with yourself through a few small completions instead of one dramatic recovery plan.',
      author: 'Campus Wellness Team',
      readTime: '6 min',
      tags: ['motivation', 'procrastination', 'restart'],
      status: 'Published'
    },
    {
      title: 'Protecting Energy During Busy Social Weeks',
      description: 'A short article on keeping your energy steady when campus life gets crowded.',
      type: 'Article',
      category: 'Mental Health',
      subCategory: 'Boundaries',
      content: 'Not every invitation deserves an automatic yes. Protecting energy can look like shorter hangouts, earlier exits, or a recovery evening with no extra demands after a packed social stretch.',
      author: 'Campus Wellness Team',
      readTime: '5 min',
      tags: ['energy', 'boundaries', 'social pressure'],
      status: 'Published'
    },
    {
      title: 'Five-Minute Reset for Stressful Days',
      description: 'A short guided routine students can use between classes to reduce stress and reset focus.',
      type: 'Guide',
      category: 'Mental Health',
      subCategory: 'Stress Management',
      content: 'Pause, unclench your jaw, breathe in for four counts, hold for four, and release for six. Repeat this cycle five times, then write down the next single task you can realistically complete in the next fifteen minutes.',
      author: 'Campus Wellness Team',
      readTime: '5 min',
      tags: ['stress', 'breathing', 'focus'],
      status: 'Published'
    },
    {
      title: 'A Simple Grounding Guide for Panic Moments',
      description: 'Step-by-step grounding prompts for moments when anxiety rises fast.',
      type: 'Guide',
      category: 'Mental Health',
      subCategory: 'Anxiety Support',
      content: 'Plant both feet, name five things you see, four things you feel, three things you hear, two things you smell, and one thing you can taste. Then slow your breath and take one safe action such as sitting down or texting support.',
      author: 'Campus Wellness Team',
      readTime: '4 min',
      tags: ['grounding', 'panic', 'anxiety'],
      status: 'Published'
    },
    {
      title: 'Managing Exam Stress Without Burning Out',
      description: 'A practical counselor guide that helps students recognize overload early and reset their study routine before burnout builds up.',
      type: 'Guide',
      category: 'Mental Health',
      subCategory: 'Burnout',
      content: 'Break revision into smaller blocks, plan meals and rest before deadlines peak, and choose two daily priorities instead of carrying ten half-finished tasks. Add one recovery habit that stays even on your busiest days.',
      author: 'Campus Wellness Team',
      readTime: '7 min',
      tags: ['exam stress', 'burnout', 'planning'],
      status: 'Published'
    },
    {
      title: 'The Study-Day Recovery Plan',
      description: 'A guide for recovering your attention after hours of heavy coursework.',
      type: 'Guide',
      category: 'Mental Health',
      subCategory: 'Focus',
      content: 'Use a reset loop of water, movement, light food, and no-screen rest before returning to difficult work. Protect the quality of the next hour instead of forcing one more low-energy block.',
      author: 'Campus Wellness Team',
      readTime: '5 min',
      tags: ['focus', 'recovery', 'study routine'],
      status: 'Published'
    },
    {
      title: 'A Gentle Night Routine for Better Sleep',
      description: 'A student-friendly guide for winding down when your brain still feels switched on.',
      type: 'Guide',
      category: 'Mental Health',
      subCategory: 'Sleep',
      content: 'Dim lights, lower stimulation, stop academic work, and choose three repeatable cues that tell your body the day is closing: a warm drink, light stretching, and a written plan for tomorrow.',
      author: 'Campus Wellness Team',
      readTime: '5 min',
      tags: ['sleep', 'night routine', 'calm'],
      status: 'Published'
    },
    {
      title: 'Getting Through a Low-Energy Morning',
      description: 'A guide that helps students restart the day without demanding too much too quickly.',
      type: 'Guide',
      category: 'Mental Health',
      subCategory: 'Energy Management',
      content: 'Reduce the first hour to basics: water, sunlight, simple food, and one easy win. When energy is low, the goal is not peak productivity. The goal is stable momentum.',
      author: 'Campus Wellness Team',
      readTime: '4 min',
      tags: ['energy', 'morning', 'momentum'],
      status: 'Published'
    },
    {
      title: 'Guided Breathing for Anxiety Relief',
      description: 'A counselor-recommended video resource for grounding during anxious moments.',
      type: 'Video',
      category: 'Mental Health',
      subCategory: 'Anxiety Support',
      content: 'Use this guided breathing video whenever you feel overwhelmed, restless, or mentally overloaded. Pair it with a short walk or hydration break afterward for better recovery.',
      videoUrl: 'https://www.youtube.com/results?search_query=guided+breathing+for+anxiety+relief+for+students',
      author: 'Campus Wellness Team',
      duration: '8 min',
      tags: ['anxiety', 'video', 'breathing'],
      status: 'Published'
    },
    {
      title: 'Desk Stretch Flow for Study Breaks',
      description: 'A short video routine for loosening tension after long sitting sessions.',
      type: 'Video',
      category: 'Mental Health',
      subCategory: 'Stress Management',
      content: 'This video guides students through easy shoulder, neck, wrist, and back stretches that can be done beside a desk. It works well during revision breaks or after long classes.',
      videoUrl: 'https://www.youtube.com/results?search_query=desk+stretch+flow+for+study+breaks+students',
      author: 'Campus Wellness Team',
      duration: '7 min',
      tags: ['stretching', 'study breaks', 'tension'],
      status: 'Published'
    },
    {
      title: 'Morning Calm Routine Before Class',
      description: 'A grounding video for starting the day with steadier energy and less rush.',
      type: 'Video',
      category: 'Mental Health',
      subCategory: 'Morning Routine',
      content: 'Use this quick morning video to slow your breathing, settle your attention, and start the day without carrying immediate stress into the first class or task.',
      videoUrl: 'https://www.youtube.com/results?search_query=morning+calm+routine+before+class+guided+mindfulness',
      author: 'Campus Wellness Team',
      duration: '6 min',
      tags: ['morning', 'calm', 'video'],
      status: 'Published'
    },
    {
      title: 'Body Scan for Sleep Recovery',
      description: 'A gentle wind-down video designed for students who struggle to settle before bed.',
      type: 'Video',
      category: 'Mental Health',
      subCategory: 'Sleep',
      content: 'This body-scan video helps release physical tension from the day and gives your attention something steady to follow while preparing for sleep.',
      videoUrl: 'https://www.youtube.com/results?search_query=body+scan+for+sleep+recovery+guided+meditation',
      author: 'Campus Wellness Team',
      duration: '10 min',
      tags: ['sleep', 'body scan', 'recovery'],
      status: 'Published'
    },
    {
      title: 'Quick Reset After a Tough Conversation',
      description: 'A short video for decompressing after emotionally heavy social moments.',
      type: 'Video',
      category: 'Mental Health',
      subCategory: 'Emotional Recovery',
      content: 'When a conversation leaves you activated or drained, this video helps you regulate first before deciding what to say or do next.',
      videoUrl: 'https://www.youtube.com/results?search_query=quick+reset+after+a+tough+conversation+emotional+recovery',
      author: 'Campus Wellness Team',
      duration: '5 min',
      tags: ['recovery', 'relationships', 'regulation'],
      status: 'Published'
    },
    {
      title: 'Focus Reboot Between Study Blocks',
      description: 'A practical video to help students re-enter work after distraction or mental fatigue.',
      type: 'Video',
      category: 'Mental Health',
      subCategory: 'Focus',
      content: 'This reset video combines breathing, posture, and a short planning prompt so you can restart a study block without carrying scattered energy forward.',
      videoUrl: 'https://www.youtube.com/results?search_query=focus+reboot+between+study+blocks+students',
      author: 'Campus Wellness Team',
      duration: '6 min',
      tags: ['focus', 'reset', 'study'],
      status: 'Published'
    },
    {
      title: 'Burnout Warning Signs Checklist',
      description: 'An easy reference sheet that helps students spot early burnout patterns before they escalate.',
      type: 'Infographic',
      category: 'Mental Health',
      subCategory: 'Burnout',
      content: 'Burnout often appears as ongoing exhaustion, reduced concentration, irritability, and withdrawal from usual routines. If several signs persist for more than two weeks, consider booking counseling support and reducing nonessential commitments.',
      author: 'Campus Wellness Team',
      tags: ['burnout', 'checklist', 'self-awareness'],
      status: 'Published'
    },
    {
      title: 'Anxiety First-Aid Steps',
      description: 'A visual quick-guide for what to do when anxious thoughts start escalating.',
      type: 'Infographic',
      category: 'Mental Health',
      subCategory: 'Anxiety Support',
      content: 'This visual breaks anxiety response into simple actions: pause, breathe, ground, reduce stimulation, and choose one safe next step. It is designed for fast reference during high-stress moments.',
      author: 'Campus Wellness Team',
      tags: ['anxiety', 'first aid', 'visual guide'],
      status: 'Published'
    },
    {
      title: 'Healthy Study Break Formula',
      description: 'A visual reference for building breaks that actually restore attention.',
      type: 'Infographic',
      category: 'Mental Health',
      subCategory: 'Focus',
      content: 'The best breaks include movement, hydration, eye rest, and a mental reset. This infographic shows quick combinations students can use between classes, revision blocks, or online lectures.',
      author: 'Campus Wellness Team',
      tags: ['study breaks', 'focus', 'visual'],
      status: 'Published'
    },
    {
      title: 'Sleep Hygiene Essentials for Students',
      description: 'A compact visual on the most effective habits for protecting sleep.',
      type: 'Infographic',
      category: 'Mental Health',
      subCategory: 'Sleep',
      content: 'This infographic highlights the biggest sleep disruptors on campus, including inconsistent bedtimes, late caffeine, light exposure, and exam-night cramming.',
      author: 'Campus Wellness Team',
      tags: ['sleep', 'hygiene', 'habits'],
      status: 'Published'
    },
    {
      title: 'Mood Tracking Pattern Map',
      description: 'A visual guide to understanding how mood, sleep, stress, and routine connect.',
      type: 'Infographic',
      category: 'Mental Health',
      subCategory: 'Self-Awareness',
      content: 'This visual map helps students connect repeated low mood, tension, exhaustion, and social withdrawal with routines that may be making recovery harder.',
      author: 'Campus Wellness Team',
      tags: ['mood tracking', 'patterns', 'self-awareness'],
      status: 'Published'
    },
    {
      title: 'Boundary Scripts for Busy Weeks',
      description: 'A visual mini-sheet of short phrases students can use to protect time and energy.',
      type: 'Infographic',
      category: 'Mental Health',
      subCategory: 'Boundaries',
      content: 'Includes short, respectful phrases for saying no, delaying commitments, or asking for more space during demanding academic stretches.',
      author: 'Campus Wellness Team',
      tags: ['boundaries', 'communication', 'visual guide'],
      status: 'Published'
    },
    {
      title: 'The Quiet Reset Podcast',
      description: 'A calm audio episode for students who need a gentle mental reset after intense days.',
      type: 'Podcast',
      category: 'Mental Health',
      subCategory: 'Emotional Recovery',
      content: 'This episode walks through low-pressure recovery habits, including how to slow your evening, lower internal pressure, and regain steadier energy after difficult academic or social days.',
      author: 'Campus Wellness Team',
      duration: '14 min',
      tags: ['podcast', 'recovery', 'calm'],
      status: 'Published'
    },
    {
      title: 'Campus Anxiety Conversations',
      description: 'A podcast episode about handling anxious thoughts during deadlines and uncertainty.',
      type: 'Podcast',
      category: 'Mental Health',
      subCategory: 'Anxiety Support',
      content: 'The episode explores how students can notice anxiety earlier, build a fast calming routine, and avoid turning every uncertain moment into a full spiral.',
      author: 'Campus Wellness Team',
      duration: '18 min',
      tags: ['podcast', 'anxiety', 'deadlines'],
      status: 'Published'
    },
    {
      title: 'Sleep Talk for Busy Students',
      description: 'An audio discussion on realistic sleep recovery when schedules are crowded.',
      type: 'Podcast',
      category: 'Mental Health',
      subCategory: 'Sleep',
      content: 'Covers late-night study habits, racing thoughts, and how to build a repeatable wind-down even when your timetable is far from perfect.',
      author: 'Campus Wellness Team',
      duration: '16 min',
      tags: ['podcast', 'sleep', 'routine'],
      status: 'Published'
    },
    {
      title: 'Study Pressure Without Self-Blame',
      description: 'A supportive podcast episode on working through stress without turning it into shame.',
      type: 'Podcast',
      category: 'Mental Health',
      subCategory: 'Stress Management',
      content: 'This conversation focuses on replacing harsh self-talk with practical adjustment, helping students respond to pressure with support instead of punishment.',
      author: 'Campus Wellness Team',
      duration: '20 min',
      tags: ['podcast', 'stress', 'self-talk'],
      status: 'Published'
    },
    {
      title: 'Rebuilding Focus After Overload',
      description: 'An audio episode on getting attention back after mentally exhausting weeks.',
      type: 'Podcast',
      category: 'Mental Health',
      subCategory: 'Focus',
      content: 'The episode shares ways to reduce overstimulation, reset expectations, and rebuild concentration without expecting instant high performance from a tired brain.',
      author: 'Campus Wellness Team',
      duration: '15 min',
      tags: ['podcast', 'focus', 'overload'],
      status: 'Published'
    },
    {
      title: 'Friendship Stress and Emotional Boundaries',
      description: 'A podcast episode about navigating relationship pressure while protecting your own capacity.',
      type: 'Podcast',
      category: 'Mental Health',
      subCategory: 'Boundaries',
      content: 'This episode helps students think through guilt, people-pleasing, and how to stay kind without overextending yourself when energy is already low.',
      author: 'Campus Wellness Team',
      duration: '17 min',
      tags: ['podcast', 'boundaries', 'friendship'],
      status: 'Published'
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
  ],

  availabilityTemplates: {
    doctor: [
      {
        title: 'Primary Clinic Hours',
        recurringDays: [1, 3, 5],
        startTime: '09:00 AM',
        endTime: '01:00 PM',
        slotDuration: 30,
        consultationTypes: ['Video Call', 'In-Person'],
        breaks: [{ startTime: '11:00 AM', endTime: '11:30 AM', label: 'Mid-morning break' }],
        notes: 'General consultation hours',
        status: 'Active'
      },
      {
        title: 'Follow-up Clinic',
        recurringDays: [2, 4],
        startTime: '02:00 PM',
        endTime: '05:00 PM',
        slotDuration: 30,
        consultationTypes: ['Video Call', 'In-Person'],
        breaks: [],
        notes: 'Follow-up and review visits',
        status: 'Active'
      }
    ],
    counselor: [
      {
        title: 'Wellness Sessions',
        recurringDays: [1, 2, 4],
        startTime: '10:00 AM',
        endTime: '04:00 PM',
        slotDuration: 50,
        consultationTypes: ['Video Call', 'Chat', 'In-Person'],
        breaks: [{ startTime: '01:00 PM', endTime: '01:45 PM', label: 'Reset break' }],
        notes: 'Confidential counseling availability',
        status: 'Active'
      },
      {
        title: 'Unavailable Wellness Retreat',
        date: createDateOnlyOffset(4),
        recurringDays: [],
        isUnavailable: true,
        notes: 'Unavailable for training day',
        status: 'Active'
      }
    ]
  }
};

function applyRoleSpecificUserFields(targetUser, templateUser) {
  if (templateUser.role === 'student') {
    targetUser.studentId = templateUser.studentId;
    targetUser.phone = templateUser.phone;
    targetUser.address = templateUser.address;
    targetUser.bloodType = templateUser.bloodType;
    targetUser.allergies = templateUser.allergies;
    targetUser.medicalHistory = templateUser.medicalHistory;
  }

  if (['doctor', 'counselor'].includes(templateUser.role)) {
    targetUser.specialty = templateUser.specialty;
    targetUser.experience = templateUser.experience;
    targetUser.bio = templateUser.bio;
    targetUser.education = templateUser.education;
  }
}

function buildCounselorDemoSlots(counselorUser) {
  if (!counselorUser) return [];

  return [
    {
      providerId: counselorUser._id,
      role: 'counselor',
      title: 'Demo Video Counseling Slot',
      date: createDateOnlyOffset(1),
      recurringDays: [],
      startTime: '09:00 AM',
      endTime: '09:50 AM',
      slotDuration: 50,
      consultationTypes: ['Video Call'],
      breaks: [],
      isUnavailable: false,
      notes: 'Demo slot for student testing - video counseling session.',
      status: 'Active'
    },
    {
      providerId: counselorUser._id,
      role: 'counselor',
      title: 'Demo Chat Counseling Slot',
      date: createDateOnlyOffset(1),
      recurringDays: [],
      startTime: '11:00 AM',
      endTime: '11:50 AM',
      slotDuration: 50,
      consultationTypes: ['Chat'],
      breaks: [],
      isUnavailable: false,
      notes: 'Demo slot for student testing - live chat counseling session.',
      status: 'Active'
    },
    {
      providerId: counselorUser._id,
      role: 'counselor',
      title: 'Demo In-Person Counseling Slot',
      date: createDateOnlyOffset(1),
      recurringDays: [],
      startTime: '02:00 PM',
      endTime: '02:50 PM',
      slotDuration: 50,
      consultationTypes: ['In-Person'],
      breaks: [],
      isUnavailable: false,
      notes: 'Demo slot for student testing - on-campus counseling session.',
      status: 'Active'
    }
  ];
}

async function syncDemoUser(User, templateUser, label) {
  const userLookupConditions = [{ email: templateUser.email }];

  if (templateUser.role === 'student' && templateUser.studentId) {
    userLookupConditions.push({ studentId: templateUser.studentId });
  }

  const existingUser = await User.findOne({
    $or: userLookupConditions
  });

  if (!existingUser) {
    await User.create(templateUser);
    safeSeedLog(`${label} created`);
    return;
  }

  existingUser.name = templateUser.name;
  existingUser.email = templateUser.email;
  existingUser.password = templateUser.password;
  existingUser.role = templateUser.role;
  existingUser.isActive = true;
  existingUser.isVerified = true;

  applyRoleSpecificUserFields(existingUser, templateUser);

  await existingUser.save();
  safeSeedLog(`${label} synced`);
}

const ensureCoreAccessUsers = async ({ User }) => {
  await syncDemoUser(User, seedData.admin, 'Admin user');

  for (const doctor of seedData.doctors) {
    await syncDemoUser(User, doctor, `Doctor ${doctor.name}`);
  }

  for (const student of seedData.students) {
    await syncDemoUser(User, student, `Student ${student.name}`);
  }

  await syncDemoUser(User, seedData.pharmacist, 'Pharmacist');

  for (const counselor of seedData.counselors) {
    await syncDemoUser(User, counselor, `Counselor ${counselor.name}`);
  }
};

/**
 * Seed the database with initial data
 * @param {Object} models - Mongoose models
 */
const seedDatabase = async (models) => {
  const {
    User,
    Medicine,
    Pharmacy,
    FAQ,
    Settings,
    Order,
    Prescription,
    Resource,
    Availability,
    Appointment,
    CounselingSession,
    MoodLog
  } = models;
  
  try {
    await ensureCoreAccessUsers({ User });

    const seededAdmin = await User.findOne({ email: seedData.admin.email });
    
    // Seed medicines
    for (const medicine of seedData.medicines) {
      if (!await Medicine.findOne({ name: medicine.name })) {
        await Medicine.create(medicine);
        safeSeedLog(`Medicine ${medicine.name} created`);
      }
    }

    if (Pharmacy) {
      for (const pharmacy of seedData.pharmacies) {
        const existingPharmacy = await Pharmacy.findOne({ name: pharmacy.name });
        if (!existingPharmacy) {
          await Pharmacy.create(pharmacy);
          safeSeedLog(`Pharmacy ${pharmacy.name} created`);
        } else {
          await Pharmacy.findByIdAndUpdate(existingPharmacy._id, pharmacy, { runValidators: true });
          safeSeedLog(`Pharmacy ${pharmacy.name} synced`);
        }
      }
    }

    if (Resource && seededAdmin) {
      for (const resource of seedData.resources) {
        const existingResource = await Resource.findOne({ title: resource.title });
        const resourcePayload = {
          ...resource,
          createdBy: existingResource?.createdBy || seededAdmin._id,
          publishedAt: existingResource?.publishedAt || new Date()
        };

        if (!existingResource) {
          await Resource.create({
            ...resourcePayload
          });
          safeSeedLog(`Resource ${resource.title} created`);
        } else {
          await Resource.findByIdAndUpdate(existingResource._id, resourcePayload, {
            runValidators: true
          });
          safeSeedLog(`Resource ${resource.title} synced`);
        }
      }
    }

    const allDoctors = await User.find({ role: 'doctor' }).sort({ createdAt: 1 });
    const allCounselors = await User.find({ role: 'counselor' }).sort({ createdAt: 1 });
    const seededCounselor = await User.findOne({ email: seedData.counselor.email });

    if (Availability) {
      for (const doctorUser of allDoctors) {
        for (const template of seedData.availabilityTemplates.doctor) {
          const existingEntry = await Availability.findOne({
            providerId: doctorUser._id,
            title: template.title
          });

          if (!existingEntry) {
            await Availability.create({
              providerId: doctorUser._id,
              role: 'doctor',
              ...template
            });
            safeSeedLog(`Availability ${template.title} created for ${doctorUser.name}`);
          }
        }
      }

      for (const counselorUser of allCounselors) {
        for (const template of seedData.availabilityTemplates.counselor) {
          const existingEntry = await Availability.findOne({
            providerId: counselorUser._id,
            title: template.title
          });

          if (!existingEntry) {
            await Availability.create({
              providerId: counselorUser._id,
              role: 'counselor',
              ...template
            });
            safeSeedLog(`Availability ${template.title} created for ${counselorUser.name}`);
          }
        }
      }

      if (seededCounselor) {
        for (const demoSlot of buildCounselorDemoSlots(seededCounselor)) {
          const existingDemoSlot = await Availability.findOne({
            providerId: demoSlot.providerId,
            role: demoSlot.role,
            title: demoSlot.title,
            date: demoSlot.date,
            startTime: demoSlot.startTime,
            isUnavailable: false
          });

          if (!existingDemoSlot) {
            await Availability.create(demoSlot);
            safeSeedLog(`Counselor demo slot ${demoSlot.title} created for ${seededCounselor.name}`);
          }
        }
      }
    }

    // Seed sample prescriptions and orders for John Doe
    const student = await User.findOne({ email: 'john.doe@student.edu' });
    const doctor = await User.findOne({ role: 'doctor' });
    const secondStudent = await User.findOne({ email: 'jane.smith@student.edu' });
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
        safeSeedLog('Sample prescription created for John Doe');
      }

      if (secondStudent && !await Prescription.findOne({
        studentId: secondStudent._id,
        notes: 'Demo pharmacy prescription for pharmacist review.'
      })) {
        await Prescription.create({
          studentId: secondStudent._id,
          studentName: secondStudent.name,
          doctorId: doctor._id,
          doctorName: doctor.name,
          status: 'Pending',
          medicines: [
            {
              name: meds[1]?.name || meds[0].name,
              dosage: meds[1]?.strength || meds[0].strength || '250mg',
              duration: '7 days',
              frequency: 'Twice daily',
              instructions: 'Demo prescription for pharmacy verification testing.'
            }
          ],
          notes: 'Demo pharmacy prescription for pharmacist review.'
        });
        safeSeedLog('Demo pharmacy prescription created for Jane Smith');
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
        safeSeedLog('Sample orders created for John Doe');
      }
    }

    if (Appointment && student && doctor) {
      const sampleAppointments = [
        {
          studentId: student._id,
          doctorId: doctor._id,
          doctorName: doctor.name,
          doctorSpecialty: doctor.specialty || 'General Physician',
          studentName: student.name,
          date: createDateOnlyOffset(1),
          time: '09:00 AM',
          type: 'Video Call',
          status: 'Confirmed',
          symptoms: 'Recurring headaches during exam revision.',
          notes: 'Would like advice on stress-related headaches.',
          meetingLink: 'https://campushealth.local/consultation/demo-upcoming',
          reminderSent: false
        },
        {
          studentId: student._id,
          doctorId: doctor._id,
          doctorName: doctor.name,
          doctorSpecialty: doctor.specialty || 'General Physician',
          studentName: student.name,
          date: createDateOnlyOffset(-3),
          time: '10:30 AM',
          type: 'In-Person',
          status: 'Completed',
          symptoms: 'Seasonal allergy follow-up.',
          consultationNotes: 'Discussed allergy trigger tracking and hydration.',
          diagnosis: 'Seasonal allergies',
          followUpDate: createDateOnlyOffset(14),
          followUpReason: 'Review symptom improvement',
          reminderSent: true
        }
      ];

      for (const appointment of sampleAppointments) {
        const exists = await Appointment.findOne({
          studentId: appointment.studentId,
          doctorId: appointment.doctorId,
          date: appointment.date,
          time: appointment.time
        });

        if (!exists) {
          await Appointment.create(appointment);
          safeSeedLog(`Sample appointment ${appointment.time} created for ${student.name}`);
        }
      }

      if (secondStudent) {
        const queueAppointment = await Appointment.findOne({
          studentId: secondStudent._id,
          doctorId: doctor._id,
          date: createDateOnlyOffset(1),
          time: '09:30 AM'
        });

        if (!queueAppointment) {
          await Appointment.create({
            studentId: secondStudent._id,
            doctorId: doctor._id,
            doctorName: doctor.name,
            doctorSpecialty: doctor.specialty || 'General Physician',
            studentName: secondStudent.name,
            date: createDateOnlyOffset(1),
            time: '09:30 AM',
            type: 'In-Person',
            status: 'Confirmed',
            symptoms: 'General wellness review',
            reminderSent: false
          });
          safeSeedLog(`Queue sample appointment created for ${secondStudent.name}`);
        }
      }
    }

    if (CounselingSession && student && seededCounselor) {
      const sampleSessions = [
        {
          studentId: student._id,
          counselorId: seededCounselor._id,
          studentName: student.name,
          counselorName: seededCounselor.name,
          counselorSpecialty: seededCounselor.specialty || 'Counselor',
          date: createDateOnlyOffset(2),
          time: '10:00 AM',
          type: 'Video Call',
          urgency: 'Medium',
          reason: 'Managing stress and burnout during coursework.',
          status: 'Confirmed',
          meetingLink: 'https://campushealth.local/counseling/demo-session-upcoming'
        },
        {
          studentId: student._id,
          counselorId: seededCounselor._id,
          studentName: student.name,
          counselorName: seededCounselor.name,
          counselorSpecialty: seededCounselor.specialty || 'Counselor',
          date: createDateOnlyOffset(-5),
          time: '02:00 PM',
          type: 'Chat',
          urgency: 'High',
          reason: 'Needed support balancing academics and sleep.',
          status: 'Completed',
          sharedSummary: 'Reviewed grounding strategies and a calmer evening routine.',
          actionPlan: 'Use a nightly phone cutoff and breathing exercise.',
          followUpRecommended: true,
          followUpDate: createDateOnlyOffset(7)
        }
      ];

      for (const session of sampleSessions) {
        const exists = await CounselingSession.findOne({
          studentId: session.studentId,
          counselorId: session.counselorId,
          date: session.date,
          time: session.time
        });

        if (!exists) {
          await CounselingSession.create(session);
          safeSeedLog(`Sample counseling session ${session.time} created for ${student.name}`);
        }
      }
    }

    if (MoodLog && student) {
      const sampleMoodLogs = [
        { mood: 'Stressed', moodScore: 4, notes: 'Heavy assignment week and poor sleep.', date: createDateOffset(-6, 21, 0) },
        { mood: 'Okay', moodScore: 6, notes: 'Felt more balanced after a walk and study plan.', date: createDateOffset(-4, 20, 30) },
        { mood: 'Tired', moodScore: 5, notes: 'Long lab day but handled it better than expected.', date: createDateOffset(-2, 22, 0) },
        { mood: 'Great', moodScore: 8, notes: 'Had a productive day and connected with friends.', date: createDateOffset(-1, 19, 45) }
      ];

      for (const moodEntry of sampleMoodLogs) {
        const exists = await MoodLog.findOne({
          userId: student._id,
          date: moodEntry.date
        });

        if (!exists) {
          await MoodLog.create({
            userId: student._id,
            ...moodEntry
          });
          safeSeedLog(`Sample mood log ${moodEntry.mood} created for ${student.name}`);
        }
      }
    }
    
    // Seed FAQs and Settings
    for (const faq of seedData.faqs) {
      if (!await FAQ.findOne({ question: faq.question })) await FAQ.create(faq);
    }
    for (const setting of seedData.settings) {
      if (!await Settings.findOne({ key: setting.key })) await Settings.create(setting);
    }
    
    safeSeedLog('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

export default { seedData, seedDatabase, ensureCoreAccessUsers };
