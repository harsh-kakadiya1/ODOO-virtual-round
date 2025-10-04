const express = require('express');
const multer = require('multer');
const router = express.Router();
const ocrService = require('../utils/ocrService');
const { auth } = require('../middleware/auth');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and PDFs
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image files and PDFs are allowed'), false);
    }
  }
});

/**
 * POST /api/ocr/extract-receipt
 * Extract structured data from receipt images
 */
router.post('/extract-receipt', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    if (!ocrService.isConfigured()) {
      return res.status(500).json({
        success: false,
        message: 'OCR service is not properly configured'
      });
    }

    const result = await ocrService.extractReceiptData(req.file.buffer, req.file.mimetype);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        message: 'Receipt data extracted successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to extract receipt data',
        error: result.error
      });
    }

  } catch (error) {
    console.error('OCR Route Error:', error);
    
    // Handle timeout errors specifically
    if (error.message && error.message.includes('timeout')) {
      return res.status(408).json({
        success: false,
        message: 'OCR processing timed out. Please try again with a smaller image or check your internet connection.',
        error: 'Processing timeout'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

/**
 * POST /api/ocr/extract-text
 * Extract plain text from images
 */
router.post('/extract-text', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    if (!ocrService.isConfigured()) {
      return res.status(500).json({
        success: false,
        message: 'OCR service is not properly configured'
      });
    }

    const result = await ocrService.extractText(req.file.buffer, req.file.mimetype);
    
    if (result.success) {
      res.json({
        success: true,
        text: result.text,
        message: 'Text extracted successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to extract text',
        error: result.error
      });
    }

  } catch (error) {
    console.error('OCR Route Error:', error);
    
    // Handle timeout errors specifically
    if (error.message && error.message.includes('timeout')) {
      return res.status(408).json({
        success: false,
        message: 'OCR processing timed out. Please try again with a smaller image or check your internet connection.',
        error: 'Processing timeout'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

/**
 * GET /api/ocr/status
 * Check if OCR service is configured and available
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    configured: ocrService.isConfigured(),
    message: ocrService.isConfigured() ? 'OCR service is ready' : 'OCR service is not configured'
  });
});

module.exports = router;
