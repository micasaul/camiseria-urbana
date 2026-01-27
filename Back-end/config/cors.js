module.exports = ({ env }) => ({
  enabled: true,
  origin: [
    env('VITE_BACKEND_URL'),
    env('FRONTEND_URL'),
    'https://www.google.com',
    'https://camiseria-urbana.vercel.app'
  ].filter(Boolean),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
  headers: ['Content-Type', 'Authorization', 'Origin', 'Accept', 'Cache-Control', 'Pragma'],
  keepHeadersOnError: true,
  credentials: true,
});