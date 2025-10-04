import axios from 'axios';

const COUNTRIES_URL = 'https://restcountries.com/v3.1/all?fields=name,currencies,cca2';
const RATES_URL = (base) => `https://api.exchangerate-api.com/v4/latest/${base}`;

let countriesCache = null;
let ratesCache = {};

export const fetchCountries = async () => {
  if (countriesCache) return countriesCache;
  const res = await axios.get(COUNTRIES_URL);
  // Normalize to { code, name, currency }
  const list = res.data.map(item => {
    const code = item.cca2 || (item.name && item.name.common && item.name.common.slice(0,2).toUpperCase());
    const name = item.name?.common || '';
    const currencies = item.currencies ? Object.keys(item.currencies) : [];
    return {
      code,
      name,
      currency: currencies[0] || 'USD'
    };
  }).filter(Boolean);
  // dedupe by code
  const map = new Map();
  list.forEach(c => { if (c.code) map.set(c.code, c); });
  countriesCache = Array.from(map.values()).sort((a,b) => a.name.localeCompare(b.name));
  return countriesCache;
};

export const fetchRates = async (base = 'USD') => {
  if (ratesCache[base]) return ratesCache[base];
  const res = await axios.get(RATES_URL(base));
  ratesCache[base] = res.data.rates || {};
  return ratesCache[base];
};

// convert amount from base currency to targetCurrency using ratesCache (fetches if needed)
export const convertAmount = async (amount, baseCurrency, targetCurrency) => {
  if (!baseCurrency || !targetCurrency) return amount;
  const rates = await fetchRates(baseCurrency);
  const rate = rates[targetCurrency];
  if (!rate) return amount;
  return amount * rate;
};

export default {
  fetchCountries,
  fetchRates,
  convertAmount
};
