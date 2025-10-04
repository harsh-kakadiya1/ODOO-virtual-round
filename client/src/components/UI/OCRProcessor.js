import React, { useState } from 'react';
import { Scan, Loader2, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';
import { ocrAPI } from '../../utils/api';

const OCRProcessor = ({ onDataExtracted, onError, className = '' }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [showRawText, setShowRawText] = useState(false);
  const [error, setError] = useState(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      const errorMsg = 'Please select a valid image file (JPEG, PNG, GIF, or WebP)';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      const errorMsg = 'File size must be less than 10MB';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setIsProcessing(true);
    setError(null);
    setExtractedData(null);

    try {
      const response = await ocrAPI.extractReceiptData(file);
      
      if (response.data.success) {
        const data = response.data.data;
        setExtractedData(data);
        onDataExtracted?.(data);
      } else {
        throw new Error(response.data.message || 'Failed to extract data');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to process image';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setExtractedData(null);
    // Reset file input
    const fileInput = document.getElementById('ocr-file-input');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const formatCurrency = (amount, currency = 'USD') => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* File Upload Section */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <div className="text-center">
          <Scan className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <div className="mb-4">
            <label htmlFor="ocr-file-input" className="cursor-pointer">
              <span className="text-sm text-blue-600 hover:text-blue-500 font-medium">
                {isProcessing ? 'Processing...' : 'Scan Receipt with AI'}
              </span>
              <input
                id="ocr-file-input"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleFileUpload}
                disabled={isProcessing}
              />
            </label>
          </div>
          <p className="text-xs text-gray-500">
            Upload a receipt image to automatically extract expense details
          </p>
        </div>
      </div>

      {/* Processing State */}
      {isProcessing && (
        <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600 mr-2" />
          <div className="text-sm text-blue-600">
            <div>Analyzing receipt with AI...</div>
            <div className="text-xs text-blue-500 mt-1">This may take up to 60 seconds for large images</div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-600 font-medium">Processing Failed</p>
              <p className="text-sm text-red-500 mt-1">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Success State - Extracted Data */}
      {extractedData && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start mb-3">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-green-600 font-medium">Receipt Data Extracted Successfully!</p>
              <p className="text-xs text-green-500 mt-1">
                Review the extracted information below and make any necessary corrections.
              </p>
            </div>
          </div>

          {/* Extracted Data Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {extractedData.merchant && (
              <div>
                <span className="font-medium text-gray-700">Merchant:</span>
                <p className="text-gray-900">{extractedData.merchant}</p>
              </div>
            )}
            
            {extractedData.date && (
              <div>
                <span className="font-medium text-gray-700">Date:</span>
                <p className="text-gray-900">{formatDate(extractedData.date)}</p>
              </div>
            )}
            
            {extractedData.total && (
              <div>
                <span className="font-medium text-gray-700">Total:</span>
                <p className="text-gray-900 font-semibold">
                  {formatCurrency(extractedData.total, extractedData.currency)}
                </p>
              </div>
            )}
            
            {extractedData.subtotal && (
              <div>
                <span className="font-medium text-gray-700">Subtotal:</span>
                <p className="text-gray-900">
                  {formatCurrency(extractedData.subtotal, extractedData.currency)}
                </p>
              </div>
            )}
            
            {extractedData.tax && (
              <div>
                <span className="font-medium text-gray-700">Tax:</span>
                <p className="text-gray-900">
                  {formatCurrency(extractedData.tax, extractedData.currency)}
                </p>
              </div>
            )}
          </div>

          {/* Items List */}
          {extractedData.items && extractedData.items.length > 0 && (
            <div className="mt-4">
              <span className="font-medium text-gray-700 text-sm">Items:</span>
              <div className="mt-2 space-y-1">
                {extractedData.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-700">{item.description}</span>
                    <span className="text-gray-900">
                      {formatCurrency(item.amount, extractedData.currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw Text Toggle */}
          {extractedData.rawText && (
            <div className="mt-4">
              <button
                onClick={() => setShowRawText(!showRawText)}
                className="flex items-center text-xs text-gray-500 hover:text-gray-700"
              >
                {showRawText ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                {showRawText ? 'Hide' : 'Show'} Raw Text
              </button>
              {showRawText && (
                <div className="mt-2 p-3 bg-gray-50 rounded text-xs text-gray-600 max-h-32 overflow-y-auto">
                  {extractedData.rawText}
                </div>
              )}
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            className="mt-3"
          >
            Scan Different Receipt
          </Button>
        </div>
      )}
    </div>
  );
};

export default OCRProcessor;
