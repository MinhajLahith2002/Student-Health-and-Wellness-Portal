import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure upload directories exist
const createUploadDirectories = () => {
  const dirs = [
    'uploads/prescriptions',
    'uploads/medicines',
    'uploads/resources',
    'uploads/events',
    'uploads/profile-images'
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadDirectories();

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'uploads/';
    
    if (req.originalUrl.includes('prescription')) {
      folder += 'prescriptions';
    } else if (req.originalUrl.includes('medicine')) {
      folder += 'medicines';
    } else if (req.originalUrl.includes('resource')) {
      folder += 'resources';
    } else if (req.originalUrl.includes('event')) {
      folder += 'events';
    } else if (req.originalUrl.includes('profile')) {
      folder += 'profile-images';
    } else {
      folder += 'general';
    }
    
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('Only images and PDF files are allowed'), false);
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

// Single file upload
const uploadSingle = (fieldName) => upload.single(fieldName);

// Multiple files upload
const uploadMultiple = (fieldName, maxCount = 5) => upload.array(fieldName, maxCount);

// Upload fields
const uploadFields = (fields) => upload.fields(fields);

export default {
  upload,
  uploadSingle,
  uploadMultiple,
  uploadFields
};
