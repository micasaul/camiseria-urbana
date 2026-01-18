'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController(
  /** @type {any} */ ('api::reserva.reserva'),
  ({ strapi }) => ({
  async fromCarrito(ctx) {
    const { carritoId } = ctx.request.body || {};

    if (!carritoId) {
      return ctx.badRequest('carritoId requerido');
    }

    const reserva = await strapi
      .service('api::reserva.reserva')
      .crearDesdeCarrito(carritoId);

    ctx.body = reserva;
  },
  async congelar(ctx) {
    const { id } = ctx.params || {};

    if (!id) {
      return ctx.badRequest('id requerido');
    }

    const reservas = await strapi.entityService.findMany(
      /** @type {any} */ ('api::reserva.reserva'),
      /** @type {any} */ ({
        filters: { documentId: id },
        limit: 1,
      })
    );
    const reserva = reservas[0];

    if (!reserva) {
      return ctx.notFound('Reserva no encontrada');
    }

    if (reserva.estado !== 'ACTIVA') {
      return ctx.badRequest('Solo se puede congelar una reserva ACTIVA');
    }

    const reservaActualizada = await strapi.entityService.update(
      /** @type {any} */ ('api::reserva.reserva'),
      reserva.id,
      {
        data: { estado: 'CONGELADA' },
      }
    );

    ctx.body = reservaActualizada;
  },
  })
);
