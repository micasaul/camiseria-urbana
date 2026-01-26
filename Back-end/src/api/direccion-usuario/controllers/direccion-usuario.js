'use strict';

/**
 * direccion-usuario controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::direccion-usuario.direccion-usuario', ({ strapi }) => ({
  async crearDireccionUsuario(ctx) {
    try {
      const { calle, numero, cp, provincia } = ctx.request.body.data || ctx.request.body;
      
      // Verificamos el token manualmente
      const token = ctx.request.header.authorization?.replace('Bearer ', '');
      if (!token) {
        return ctx.unauthorized('Token de autenticación requerido');
      }

      // Verificamos y decodificamos el token
      const jwtService = strapi.plugin('users-permissions').service('jwt');
      let decodedToken;
      try {
        decodedToken = await jwtService.verify(token);
      } catch (error) {
        return ctx.unauthorized('Token inválido o expirado');
      }

      const usuarioId = decodedToken.id;
      if (!usuarioId) {
        return ctx.unauthorized('No se pudo obtener el ID del usuario del token');
      }

      if (!calle || !numero || !cp || !provincia) {
        return ctx.badRequest('Calle, número, código postal y provincia son obligatorios');
      }

      // Obtenemos el usuario con documentId
      const usuario = await strapi.entityService.findOne('plugin::users-permissions.user', usuarioId);
      const userDocumentId = usuario?.documentId;

      if (!userDocumentId) {
        return ctx.internalServerError('No se pudo obtener el documentId del usuario');
      }

      // Creamos la dirección usando entityService (evita problemas de permisos)
      const direccion = await strapi.entityService.create('api::direccion.direccion', {
        data: {
          calle,
          numero,
          cp,
          provincia,
        },
        status: 'published',
      });

      const direccionDocumentId = direccion?.documentId ?? direccion?.id;

      if (!direccionDocumentId) {
        return ctx.internalServerError('No se pudo obtener el ID de la dirección creada');
      }

      // Creamos la relación direccion-usuario usando entityService
      const direccionUsuario = await strapi.entityService.create('api::direccion-usuario.direccion-usuario', {
        data: {
          direccion: { connect: [{ documentId: direccionDocumentId }] },
          users_permissions_user: { connect: [{ documentId: userDocumentId }] },
        },
        status: 'published',
      });

      return ctx.send({
        data: direccionUsuario,
      });
    } catch (error) {
      strapi.log.error('Error al crear dirección-usuario:', error);
      return ctx.internalServerError('Error al crear la dirección');
    }
  },
}));
