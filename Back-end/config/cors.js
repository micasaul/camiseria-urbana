module.exports = {
  enabled: true,
  origin: [
    'http://localhost:1337',
    'http://localhost:3000',
    'http://localhost:3001',
    'https://www.google.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
  headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
  keepHeadersOnError: true,
  credentials: true,
};