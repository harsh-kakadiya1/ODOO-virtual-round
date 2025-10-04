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
      // Primary provider
      const response = await axios.get(`${this.baseUrl}/${fromCurrency}`);
      const rates = response.data.rates;
      const rate = rates && rates[toCurrency];

      if (rate) {
        this.cache.set(cacheKey, { rate, timestamp: Date.now() });
        return rate;
      }

      // Try fallback provider: exchangerate.host
      try {
        const fallbackUrl = `https://api.exchangerate.host/latest?base=${fromCurrency}`;
        const fb = await axios.get(fallbackUrl);
        const fbRate = fb.data?.rates?.[toCurrency];
        if (fbRate) {
          this.cache.set(cacheKey, { rate: fbRate, timestamp: Date.now() });
          return fbRate;
        }
      } catch (fbErr) {
        console.warn('Fallback rate provider failed:', fbErr.message || fbErr);
      }

      throw new Error(`Exchange rate not found for ${fromCurrency} to ${toCurrency}`);
    } catch (error) {
      console.error('Currency conversion error:', error.message || error);
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
