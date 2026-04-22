import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '../.env') });

const [{ default: connectDB }, { default: User }, { default: Medicine }, { default: FAQ }, { default: Resource }, { default: Settings }, { default: Order }, { default: Prescription }, { default: Pharmacy }, { default: Availability }, { default: Appointment }, { default: CounselingSession }, { default: MoodLog }, { default: seedData }] = await Promise.all([
  import('../config/database.js'),
  import('../models/User.js'),
  import('../models/Medicine.js'),
  import('../models/FAQ.js'),
  import('../models/Resource.js'),
  import('../models/Settings.js'),
  import('../models/Order.js'),
  import('../models/Prescription.js'),
  import('../models/Pharmacy.js'),
  import('../models/Availability.js'),
  import('../models/Appointment.js'),
  import('../models/CounselingSession.js'),
  import('../models/MoodLog.js'),
  import('../config/seedData.js')
]);

const { seedDatabase } = seedData;

// Database connection
const runSeed = async () => {
  try {
    await connectDB();
    await seedDatabase({
      User,
      Medicine,
      FAQ,
      Resource,
      Settings,
      Order,
      Prescription,
      Pharmacy,
      Availability,
      Appointment,
      CounselingSession,
      MoodLog
    });
    console.log('✅ Database seeded (default users and demo data ready)');
    
    console.log('Seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

runSeed();
