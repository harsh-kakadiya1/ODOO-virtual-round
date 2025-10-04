const axios = require('axios');

class CurrencyConverter {
  constructor() {
    this.baseUrl = 'https://api.exchangerate-api.com/v4/latest';
    this.cache = new Map();
    this.cacheExpiry = 60 * 60 * 1000; // 1 hour in milliseconds
  }

  async getExchangeRate(fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) {
      return 1;
    }

    const cacheKey = `${fromCurrency}_${toCurrency}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.rate;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/${fromCurrency}`);
      const rates = response.data.rates;
      const rate = rates[toCurrency];

      if (!rate) {
        throw new Error(`Exchange rate not found for ${fromCurrency} to ${toCurrency}`);
      }

      // Cache the result
      this.cache.set(cacheKey, {
        rate,
        timestamp: Date.now()
      });

      return rate;
    } catch (error) {
      console.error('Currency conversion error:', error.message);
      
      // Fallback to 1:1 ratio if API fails
      console.warn(`Using fallback rate of 1 for ${fromCurrency} to ${toCurrency}`);
      return 1;
    }
  }

  async convertAmount(amount, fromCurrency, toCurrency) {
    const rate = await this.getExchangeRate(fromCurrency, toCurrency);
    return {
      originalAmount: amount,
      convertedAmount: amount * rate,
      fromCurrency: fromCurrency.toUpperCase(),
      toCurrency: toCurrency.toUpperCase(),
      exchangeRate: rate,
      conversionDate: new Date()
    };
  }

  // Get list of supported currencies
  async getSupportedCurrencies() {
    try {
      const response = await axios.get(`${this.baseUrl}/USD`);
      return Object.keys(response.data.rates);
    } catch (error) {
      console.error('Error fetching supported currencies:', error.message);
      return ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR', 'JPY'];
    }
  }
}

module.exports = new CurrencyConverter();
