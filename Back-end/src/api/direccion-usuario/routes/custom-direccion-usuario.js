'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/direcciones-usuarios/crear',
      handler: 'direccion-usuario.crearDireccionUsuario',
      config: {
        auth: false, // Verificamos el token manualmente en el controlador
      },
    },
  ],
};
