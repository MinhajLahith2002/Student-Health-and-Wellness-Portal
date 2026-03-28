import validator from 'express-validator';

const { body, param, query, validationResult } = validator;

// Validation result handler
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const extractedErrors = errors.array().map(err => ({
    field: err.path,
    message: err.msg
  }));

  return res.status(400).json({
    success: false,
    errors: extractedErrors
  });
};

// User validation rules
const userValidationRules = () => [
  body('name')
    .notEmpty().withMessage('Name is required')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .optional()
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['student', 'doctor', 'pharmacist', 'admin']).withMessage('Invalid role'),
  body('phone')
    .optional()
    .matches(/^[0-9]{10}$/).withMessage('Please provide a valid 10-digit phone number'),
  body('bloodType')
    .optional()
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Invalid blood type')
];

// Login validation rules
const loginValidationRules = () => [
  body('email')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
];

// Password change validation
const passwordChangeValidationRules = () => [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
];

// Appointment validation rules
const appointmentValidationRules = () => [
  body('doctorId').notEmpty().withMessage('Doctor ID is required').isMongoId().withMessage('Invalid doctor ID'),
  body('date').isISO8601().withMessage('Invalid date format'),
  body('time').notEmpty().withMessage('Time is required'),
  body('type').isIn(['Video Call', 'In-Person']).withMessage('Invalid appointment type'),
  body('symptoms').optional().isString().trim(),
  body('notes').optional().isString().trim().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters')
];

// Prescription validation rules
const prescriptionValidationRules = () => [
  body('medicines').isArray({ min: 1 }).withMessage('At least one medicine is required'),
  body('medicines.*.name').notEmpty().withMessage('Medicine name is required'),
  body('medicines.*.dosage').notEmpty().withMessage('Dosage is required'),
  body('medicines.*.duration').notEmpty().withMessage('Duration is required'),
  body('medicines.*.instructions').notEmpty().withMessage('Instructions are required'),
  body('notes').optional().isString().trim().isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters')
];

// Order validation rules
const orderValidationRules = () => [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.medicineId').notEmpty().withMessage('Medicine ID is required').isMongoId().withMessage('Invalid medicine ID'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('address').notEmpty().withMessage('Delivery address is required'),
  body('paymentMethod').isIn(['Campus Card', 'Credit Card', 'Debit Card', 'Cash on Delivery']).withMessage('Invalid payment method'),
  body('specialInstructions').optional().isString().trim().isLength({ max: 500 }).withMessage('Instructions cannot exceed 500 characters')
];

// Medicine validation rules
const medicineValidationRules = () => [
  body('name').notEmpty().withMessage('Medicine name is required').trim(),
  body('strength').notEmpty().withMessage('Strength is required'),
  body('manufacturer').notEmpty().withMessage('Manufacturer is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('reorderLevel').isInt({ min: 0 }).withMessage('Reorder level must be a non-negative integer'),
  body('category').isIn(['Pain Relief', 'Antibiotics', 'Allergy', 'Cold & Flu', 'Vitamins', 'First Aid', 'Personal Care', 'Wellness']).withMessage('Invalid category'),
  body('description').notEmpty().withMessage('Description is required'),
  body('usage').notEmpty().withMessage('Usage instructions are required')
];

// Feedback validation rules
const feedbackValidationRules = () => [
  body('module').isIn(['Appointments', 'Mental Health', 'Pharmacy', 'General', 'Doctor', 'Counselor']).withMessage('Invalid module'),
  body('item').notEmpty().withMessage('Item is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').notEmpty().withMessage('Comment is required').isLength({ max: 1000 }).withMessage('Comment cannot exceed 1000 characters'),
  body('isAnonymous').optional().isBoolean().withMessage('isAnonymous must be a boolean')
];

// FAQ validation rules
const faqValidationRules = () => [
  body('question').notEmpty().withMessage('Question is required').trim(),
  body('answer').notEmpty().withMessage('Answer is required'),
  body('category').isIn(['General', 'Security', 'Pharmacy', 'Emergency', 'Appointments', 'Mental Health', 'Payments']).withMessage('Invalid category'),
  body('order').optional().isInt({ min: 0 }).withMessage('Order must be a non-negative integer')
];

// Event validation rules
const eventValidationRules = () => [
  body('title').notEmpty().withMessage('Event title is required').trim(),
  body('description').notEmpty().withMessage('Event description is required'),
  body('date').isISO8601().withMessage('Invalid date format'),
  body('time').notEmpty().withMessage('Event time is required'),
  body('location').notEmpty().withMessage('Event location is required'),
  body('target').isIn(['All Students', 'All Users', 'All Staff', 'Specific Groups']).withMessage('Invalid target audience'),
  body('capacity').optional().isInt({ min: 0 }).withMessage('Capacity must be a non-negative integer'),
  body('color').optional().isIn(['blue', 'purple', 'emerald', 'amber', 'rose']).withMessage('Invalid color')
];

// Resource validation rules
const resourceValidationRules = () => [
  body('title').notEmpty().withMessage('Resource title is required').trim(),
  body('description').notEmpty().withMessage('Resource description is required'),
  body('type').isIn(['Article', 'Video', 'Infographic', 'Podcast', 'Guide']).withMessage('Invalid resource type'),
  body('category').isIn(['Mental Health', 'Nutrition', 'General Health', 'Safety', 'Fitness', 'Wellness']).withMessage('Invalid category'),
  body('content').notEmpty().withMessage('Resource content is required'),
  body('author').notEmpty().withMessage('Author is required'),
  body('status').optional().isIn(['Draft', 'Published', 'Archived']).withMessage('Invalid status')
];

// Mood log validation rules
const moodLogValidationRules = () => [
  body('mood').isIn(['Great', 'Okay', 'Down', 'Stressed', 'Tired', 'Anxious', 'Happy', 'Sad', 'Energetic']).withMessage('Invalid mood value'),
  body('moodScore').optional().isInt({ min: 1, max: 10 }).withMessage('Mood score must be between 1 and 10'),
  body('notes').optional().isString().trim().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
  body('factors').optional().isArray().withMessage('Factors must be an array')
];

// ID param validation
const idParamValidation = () => [
  param('id').isMongoId().withMessage('Invalid ID format')
];

// Pagination query validation
const paginationValidation = () => [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

export default {
  validate,
  userValidationRules,
  loginValidationRules,
  passwordChangeValidationRules,
  appointmentValidationRules,
  prescriptionValidationRules,
  orderValidationRules,
  medicineValidationRules,
  feedbackValidationRules,
  faqValidationRules,
  eventValidationRules,
  resourceValidationRules,
  moodLogValidationRules,
  idParamValidation,
  paginationValidation
};
