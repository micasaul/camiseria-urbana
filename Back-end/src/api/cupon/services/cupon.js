'use strict';

/**
 * cupon service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService(/** @type {any} */ ('api::cupon.cupon'), ({ strapi }) => ({
  async crearCuponYAsignarATodosLosUsuarios(opts) {
    const { nombre, descuento, fechaInicio, fechaFin } = opts || {};
    if (!nombre || descuento == null) {
      throw new Error('nombre y descuento son requeridos');
    }

    const nombreTrim = String(nombre).trim();
    const existentes = await strapi.entityService.findMany(
      /** @type {any} */ ('api::cupon.cupon'),
      /** @type {any} */ ({ filters: { nombre: nombreTrim }, limit: 1 })
    );
    if (existentes && existentes.length > 0) {
      throw new Error('Ya existe un cupón con ese nombre.');
    }

    const cupon = await strapi.entityService.create(
      /** @type {any} */ ('api::cupon.cupon'),
      {
        data: {
          nombre: nombreTrim,
          descuento: Number(descuento),
          fechaInicio: fechaInicio,
          fechaFin: fechaFin,
        },
        status: 'published',
      }
    );

    const usuarios = await strapi.entityService.findMany(
      /** @type {any} */ ('plugin::users-permissions.user'),
      /** @type {any} */ ({ fields: ['id', 'documentId'], limit: 10000 })
    );

    const cuponId = cupon.id;
    const cuponDocumentId = cupon.documentId;
    const listaUsuarios = Array.isArray(usuarios) ? usuarios : [usuarios];

    for (const usuario of listaUsuarios) {
      const userConnect = usuario.documentId
        ? { connect: [{ documentId: usuario.documentId }] }
        : { connect: [{ id: usuario.id }] };
      await strapi.entityService.create(
        /** @type {any} */ ('api::cupon-usuario.cupon-usuario'),
        {
          data: {
            usado: false,
            cupon: { connect: [{ documentId: cuponDocumentId }] },
            users_permissions_user: userConnect,
          },
          status: 'published',
        }
      );
    }

    return {
      cupon: cuponDocumentId ? { ...cupon, documentId: cuponDocumentId } : cupon,
      cuponesUsuariosCreados: listaUsuarios.length,
    };
  },
}));
