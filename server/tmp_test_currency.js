const converter = require('./utils/currencyConverter');

(async () => {
  try {
    console.log('Supported currencies sample:', await converter.getSupportedCurrencies());
    const conv = await converter.convertAmount(100, 'USD', 'EUR');
    console.log('Conversion result:', conv);
  } catch (e) {
    console.error('Error testing currency converter:', e);
  }
})();
