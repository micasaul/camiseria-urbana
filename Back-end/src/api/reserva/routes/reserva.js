'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/reservas/from-carrito',
      handler: 'reserva.fromCarrito',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/reservas/:id/congelar',
      handler: 'reserva.congelar',
      config: {
        auth: false,
      },
    },
  ],
};
