// config/database.js
import mongoose from 'mongoose';
import dns from 'dns';
import { logger } from '../utils/logger.js';

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  const options = {
    serverSelectionTimeoutMS: 30000
  };

  if (uri?.startsWith('mongodb+srv://')) {
    // Force reliable DNS resolvers for Atlas SRV lookups on networks with broken local DNS.
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  }

  try {
    await mongoose.connect(uri, options);
    logger.info('✅ Database connected');
  } catch (error) {
    const isSrvDnsError = uri?.startsWith('mongodb+srv://') && /querySrv\s+ECONNREFUSED/i.test(error.message);

    if (isSrvDnsError) {
      logger.warn('MongoDB SRV DNS lookup failed with current resolver order. Retrying with public DNS resolvers...');
      try {
        dns.setServers(['8.8.8.8', '1.1.1.1']);
        await mongoose.connect(uri, options);
        logger.info('✅ Database connected (after DNS fallback)');
        return;
      } catch (retryError) {
        logger.error(`❌ MongoDB Connection Error (after DNS fallback): ${retryError.message}`);
        process.exit(1);
      }
    }

    logger.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
