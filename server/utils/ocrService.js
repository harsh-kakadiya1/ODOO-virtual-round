const { GoogleGenerativeAI } = require('@google/generative-ai');
const geminiConfig = require('../config/gemini');

class OCRService {
  constructor() {
    this.apiKey = geminiConfig.apiKey;
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is required');
    }
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-flash-latest'
    });
  }

  /**
   * Extract text and structured data from receipt images
   * @param {Buffer} imageBuffer - Image buffer
   * @param {string} mimeType - MIME type of the image
   * @returns {Promise<Object>} Extracted data
   */
  async extractReceiptData(imageBuffer, mimeType) {
    try {
      const prompt = `
        Analyze this receipt image and extract the following information in JSON format:
        {
          "merchant": "store/restaurant name",
          "date": "YYYY-MM-DD format",
          "total": "total amount as number",
          "currency": "currency code (USD, EUR, etc.)",
          "items": [
            {
              "description": "item description",
              "amount": "item amount as number"
            }
          ],
          "tax": "tax amount as number",
          "subtotal": "subtotal amount as number",
          "rawText": "all text found in the receipt"
        }

        Rules:
        - If any field cannot be determined, use null
        - Extract dates in YYYY-MM-DD format
        - Amounts should be numbers only (no currency symbols)
        - Be as accurate as possible with the text extraction
        - Include all visible text in rawText field
        - If multiple items are listed, include them all in the items array
      `;

      const imagePart = {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: mimeType
        }
      };

      const result = await Promise.race([
        this.model.generateContent([prompt, imagePart]),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('OCR processing timeout')), 45000)
        )
      ]);
      const response = await result.response;
      const text = response.text();

      // Try to parse JSON from the response
      let extractedData;
      try {
        // Extract JSON from the response (sometimes it's wrapped in markdown)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          extractedData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.error('Error parsing OCR response:', parseError);
        // Fallback: return raw text
        extractedData = {
          rawText: text,
          merchant: null,
          date: null,
          total: null,
          currency: null,
          items: [],
          tax: null,
          subtotal: null
        };
      }

      return {
        success: true,
        data: extractedData,
        rawResponse: text
      };

    } catch (error) {
      console.error('OCR Service Error:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Simple text extraction from images
   * @param {Buffer} imageBuffer - Image buffer
   * @param {string} mimeType - MIME type of the image
   * @returns {Promise<string>} Extracted text
   */
  async extractText(imageBuffer, mimeType) {
    try {
      const prompt = "Extract all text from this image. Return only the text content, no additional formatting or explanation.";

      const imagePart = {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: mimeType
        }
      };

      const result = await Promise.race([
        this.model.generateContent([prompt, imagePart]),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('OCR processing timeout')), 45000)
        )
      ]);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        text: text.trim()
      };

    } catch (error) {
      console.error('Text Extraction Error:', error);
      return {
        success: false,
        error: error.message,
        text: null
      };
    }
  }

  /**
   * Validate if the service is properly configured
   * @returns {boolean}
   */
  isConfigured() {
    return !!this.apiKey;
  }
}

module.exports = new OCRService();
