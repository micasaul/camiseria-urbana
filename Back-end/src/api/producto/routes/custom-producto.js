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
  ],
};
