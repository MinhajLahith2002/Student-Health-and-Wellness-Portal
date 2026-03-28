import { connect } from 'mongoose';
import { config } from 'dotenv';
import { join } from 'path';

import mongoUriUtils from '../utils/mongoUri.js';
import User from '../models/User.js';
import Medicine from '../models/Medicine.js';
import FAQ from '../models/FAQ.js';
import Settings from '../models/Settings.js';
import seedData from '../config/seedData.js';

const { normalizeMongoUri, resolveMongoUriFromEnv } = mongoUriUtils;
const { seedDatabase } = seedData;

// Load environment variables
config({ path: join(__dirname, '../../.env') });

// Database connection
const connectDB = async () => {
  try {
    const mongoUri = normalizeMongoUri(resolveMongoUriFromEnv());
    if (!mongoUri) {
      throw new Error('No MongoDB URI set (MONGODB_URI, MONGO_URI, or DATABASE_URL)');
    }
    await connect(mongoUri);
    console.log('MongoDB Connected');
    
    // Run seed
    await seedDatabase({ User, Medicine, FAQ, Settings });
    
    console.log('Seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

connectDB();
