/**
 * Database configuration settings
 */
const dbConfig = {
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/campushealth',
  
  collections: {
    users: 'users',
    appointments: 'appointments',
    prescriptions: 'prescriptions',
    orders: 'orders',
    medicines: 'medicines',
    notifications: 'notifications',
    events: 'events',
    faqs: 'faqs',
    feedbacks: 'feedbacks',
    resources: 'resources',
    moodLogs: 'moodlogs',
    auditLogs: 'auditlogs',
    pharmacies: 'pharmacies',
    conversations: 'conversations',
    reports: 'reports',
    settings: 'settings'
  },
  
  seedData: {
    admin: {
      name: 'System Admin',
      email: process.env.ADMIN_EMAIL || 'admin@campushealth.edu',
      password: process.env.ADMIN_PASSWORD || 'Admin@123',
      role: 'admin',
      isActive: true,
      isVerified: true
    }
  }
};

export default dbConfig;