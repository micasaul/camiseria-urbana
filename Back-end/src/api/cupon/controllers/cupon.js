'use strict';

/**
 * cupon controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController(/** @type {any} */ ('api::cupon.cupon'), ({ strapi }) => ({
  async crearConUsuarios(ctx) {
    const body = ctx.request?.body?.data ?? ctx.request?.body ?? {};
    const nombre = (body.nombre ?? '').trim();
    const descuento = body.descuento != null ? Number(body.descuento) : null;
    const fechaInicio = body.fechaInicio ?? null;
    const fechaFin = body.fechaFin ?? null;

    if (!nombre) {
      return ctx.badRequest('nombre es requerido');
    }
    if (descuento == null || Number.isNaN(descuento) || descuento < 0) {
      return ctx.badRequest('descuento es requerido y debe ser un número >= 0');
    }
    if (!fechaInicio || !fechaFin) {
      return ctx.badRequest('fechaInicio y fechaFin son requeridos');
    }

    try {
      const result = await strapi
        .service('api::cupon.cupon')
        .crearCuponYAsignarATodosLosUsuarios({
          nombre,
          descuento: Math.round(descuento),
          fechaInicio,
          fechaFin,
        });
      ctx.body = result;
    } catch (error) {
      ctx.throw(400, error?.message ?? 'Error al crear el cupón');
    }
  },
}));
