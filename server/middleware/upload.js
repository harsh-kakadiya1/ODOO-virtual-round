const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Ensure uploads directory exists
const ensureUploadDir = async () => {
  const uploadDir = path.join(__dirname, '../uploads/receipts');
  try {
    await fs.access(uploadDir);
  } catch (error) {
    await fs.mkdir(uploadDir, { recursive: true });
  }
  return uploadDir;
};

// Configure storage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const uploadDir = await ensureUploadDir();
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = `receipt-${uniqueSuffix}${ext}`;
    cb(null, filename);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Check file type
  const allowedTypes = /jpeg|jpg|png|gif|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, GIF and PDF files are allowed'));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter
});

// Middleware for single file upload
const uploadReceipt = upload.single('receipt');

// Error handling middleware
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ message: 'Unexpected field name for file upload.' });
    }
  }
  
  if (err.message === 'Only JPEG, PNG, GIF and PDF files are allowed') {
    return res.status(400).json({ message: err.message });
  }
  
  next(err);
};

// Utility function to delete file
const deleteFile = async (filePath) => {
  try {
    if (filePath) {
      const fullPath = path.resolve(filePath);
      await fs.unlink(fullPath);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};

module.exports = {
  uploadReceipt,
  handleUploadError,
  deleteFile,
  ensureUploadDir
};