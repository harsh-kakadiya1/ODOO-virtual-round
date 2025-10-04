const express = require('express');
const axios = require('axios');
const currencyConverter = require('../utils/currencyConverter');

const router = express.Router();

// GET /api/currency/countries
router.get('/countries', async (req, res) => {
  try {
    const response = await axios.get('https://restcountries.com/v3.1/all?fields=name,currencies,cca2');
    const list = response.data.map(item => {
      const code = item.cca2 || null;
      const name = item.name?.common || '';
      const currencies = item.currencies ? Object.keys(item.currencies) : [];
      return {
        code,
        name,
        currency: currencies[0] || null
      };
    }).filter(c => c.code);

    // dedupe by code
    const map = new Map();
    list.forEach(c => map.set(c.code, c));

    res.json(Array.from(map.values()).sort((a,b) => a.name.localeCompare(b.name)));
  } catch (error) {
    console.error('Error fetching countries:', error.message || error);
    res.status(500).json({ message: 'Failed to fetch countries' });
  }
});

// GET /api/currency/rates/:base
router.get('/rates/:base', async (req, res) => {
  try {
    const base = (req.params.base || 'USD').toUpperCase();
    const rates = await currencyConverter.getSupportedCurrencies ? await currencyConverter.getSupportedCurrencies() : [];
    // Actually fetch rates using the converter's base URL via axios
    const url = `${currencyConverter.baseUrl}/${base}`;
    const response = await axios.get(url);
    res.json({ base, rates: response.data.rates });
  } catch (error) {
    console.error('Error fetching rates:', error.message || error);
    res.status(500).json({ message: 'Failed to fetch rates' });
  }
});

// GET /api/currency/convert?amount=...&from=...&to=...
router.get('/convert', async (req, res) => {
  try {
    const amount = parseFloat(req.query.amount || '0');
    const from = (req.query.from || 'USD').toUpperCase();
    const to = (req.query.to || 'USD').toUpperCase();

    const result = await currencyConverter.convertAmount(amount, from, to);
    res.json(result);
  } catch (error) {
    console.error('Error converting currency:', error.message || error);
    res.status(500).json({ message: 'Conversion failed' });
  }
});

module.exports = router;
