module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/productos/enums',
      handler: 'producto.enums',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/productos',
      handler: 'producto.find',
      config: {
        auth: false,
      },
    },
  ],
};
