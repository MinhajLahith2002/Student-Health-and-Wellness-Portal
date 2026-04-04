import multer from 'multer';
import { tmpdir } from 'os';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isVercel = Boolean(process.env.VERCEL);

export const UPLOAD_ROOT = isVercel
  ? path.join(tmpdir(), 'student-health-uploads')
  : path.join(__dirname, '..', 'uploads');

const resolveUploadDirectory = (folderName) => path.join(UPLOAD_ROOT, folderName);

// Ensure upload directories exist
const createUploadDirectories = () => {
  const dirs = [
    UPLOAD_ROOT,
    resolveUploadDirectory('prescriptions'),
    resolveUploadDirectory('medicines'),
    resolveUploadDirectory('resources'),
    resolveUploadDirectory('events'),
    resolveUploadDirectory('profile-images'),
    resolveUploadDirectory('general')
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
    let folderName = 'general';
    
    if (req.originalUrl.includes('prescription')) {
      folderName = 'prescriptions';
    } else if (req.originalUrl.includes('medicine')) {
      folderName = 'medicines';
    } else if (req.originalUrl.includes('resource')) {
      folderName = 'resources';
    } else if (req.originalUrl.includes('event')) {
      folderName = 'events';
    } else if (req.originalUrl.includes('profile')) {
      folderName = 'profile-images';
    }

    cb(null, resolveUploadDirectory(folderName));
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
