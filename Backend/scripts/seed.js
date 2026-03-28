import connectDB from '../config/database.js';
import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import mongoUriUtils from '../utils/mongoUri.js';
import User from '../models/User.js';
import Medicine from '../models/Medicine.js';
import FAQ from '../models/FAQ.js';
import Settings from '../models/Settings.js';
import Order from '../models/Order.js';
import Prescription from '../models/Prescription.js';
import seedData from '../config/seedData.js';

const { normalizeMongoUri, resolveMongoUriFromEnv } = mongoUriUtils;
const { seedDatabase } = seedData;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '../.env') });

// Database connection
const runSeed = async () => {
  try {
    await connectDB();
    await seedDatabase({ User, Medicine, FAQ, Settings, Order, Prescription });
    console.log('✅ Database seeded (default users and demo data ready)');
    
    console.log('Seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

connectDB();
