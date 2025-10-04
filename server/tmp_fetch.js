const http = require('http');
http.get('http://localhost:5000/api/currency/convert?amount=100&from=USD&to=EUR', res => {
  console.log('status', res.statusCode);
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => console.log('body', d));
}).on('error', e => console.error('err', e));
