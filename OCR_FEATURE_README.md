# OCR Feature Implementation

## Overview
This document describes the OCR (Optical Character Recognition) feature implemented using Google's Gemini AI API for automatic receipt data extraction in the expense management system.

## Features Implemented

### 1. Backend OCR Service (`server/utils/ocrService.js`)
- **Receipt Data Extraction**: Extracts structured data from receipt images including:
  - Merchant name
  - Date
  - Total amount
  - Currency
  - Individual items
  - Tax and subtotal
  - Raw text content

- **Text Extraction**: Simple text extraction from images
- **Error Handling**: Comprehensive error handling and fallback mechanisms
- **Configuration**: Uses Gemini API key from configuration

### 2. API Endpoints (`server/routes/ocr.js`)
- `POST /api/ocr/extract-receipt` - Extract structured receipt data
- `POST /api/ocr/extract-text` - Extract plain text from images
- `GET /api/ocr/status` - Check OCR service status

### 3. Frontend Components
- **OCRProcessor Component** (`client/src/components/UI/OCRProcessor.js`):
  - File upload with drag-and-drop interface
  - Real-time processing feedback
  - Extracted data display with formatting
  - Error handling and retry functionality
  - Raw text toggle for debugging

- **ExpenseForm Integration** (`client/src/pages/Expenses/ExpenseForm.js`):
  - Toggle button to show/hide OCR scanner
  - Auto-fill form fields with extracted data
  - Seamless integration with existing form validation

### 4. API Integration (`client/src/utils/api.js`)
- OCR API functions for frontend-backend communication
- Proper error handling and response formatting

## Configuration

### Environment Setup
The Gemini API key is configured in `server/config/gemini.js`:
```javascript
module.exports = {
  apiKey: process.env.GEMINI_API_KEY || 'AIzaSyCUQXiq67R3NMDVH9bWNP4AUgUnjHoid-0'
};
```

### Dependencies Added
- **Server**: `@google/generative-ai` - Google's Gemini AI SDK
- **Client**: No additional dependencies (uses existing React components)

## Usage

### For Users
1. Navigate to the expense form
2. Click "Use AI Receipt Scanner" button
3. Upload a receipt image (JPEG, PNG, GIF, WebP)
4. Review the automatically extracted data
5. Make any necessary corrections
6. Submit the expense

### For Developers
1. **Test OCR Status**:
   ```bash
   curl -H "Authorization: Bearer <token>" http://localhost:5000/api/ocr/status
   ```

2. **Extract Receipt Data**:
   ```bash
   curl -X POST \
     -H "Authorization: Bearer <token>" \
     -F "image=@receipt.jpg" \
     http://localhost:5000/api/ocr/extract-receipt
   ```

## Supported File Types
- **Images**: JPEG, PNG, GIF, WebP
- **Size Limit**: 10MB per file
- **Processing**: Real-time with Gemini AI

## Error Handling
- File type validation
- File size validation
- API error handling with user-friendly messages
- Fallback to raw text extraction if structured parsing fails
- Retry functionality for failed operations

## Security
- Authentication required for all OCR endpoints
- File upload validation and sanitization
- Error messages don't expose sensitive information in production

## Performance
- Uses Gemini 1.5 Flash model for fast processing
- Optimized for receipt-specific data extraction
- Efficient file handling with memory storage

## Future Enhancements
- Support for PDF receipts
- Batch processing for multiple receipts
- Receipt validation and fraud detection
- Integration with expense categorization AI
- Multi-language receipt support

## Troubleshooting

### Common Issues
1. **"OCR service is not configured"**: Check if the Gemini API key is properly set
2. **"Failed to extract data"**: Ensure the image is clear and contains readable text
3. **"File too large"**: Reduce image size to under 10MB
4. **"Invalid file type"**: Use supported image formats only

### Debug Mode
Enable debug mode by setting `NODE_ENV=development` to see detailed error messages in the server logs.

## API Response Format

### Successful Receipt Extraction
```json
{
  "success": true,
  "data": {
    "merchant": "Coffee Shop",
    "date": "2024-01-15",
    "total": 12.50,
    "currency": "USD",
    "items": [
      {
        "description": "Coffee",
        "amount": 3.50
      }
    ],
    "tax": 1.00,
    "subtotal": 11.50,
    "rawText": "Coffee Shop\n123 Main St\nCoffee: $3.50\nTax: $1.00\nTotal: $12.50"
  },
  "message": "Receipt data extracted successfully"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Failed to extract receipt data",
  "error": "Detailed error message"
}
```

## Testing
The OCR feature has been tested with:
- Various receipt formats and layouts
- Different image qualities and sizes
- Error scenarios and edge cases
- Integration with the existing expense form

## Support
For issues or questions regarding the OCR feature, please check:
1. Server logs for detailed error messages
2. Network tab in browser dev tools for API responses
3. OCR service status endpoint for configuration issues
