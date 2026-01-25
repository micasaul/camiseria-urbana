'use strict';

/**
 * venta controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

function dedupeByDocumentId(items) {
  const seen = new Set();
  return items.filter((v) => {
    const docId = v.documentId ?? String(v.id);
    if (seen.has(docId)) return false;
    seen.add(docId);
    return true;
  });
}

module.exports = createCoreController('api::venta.venta', ({ strapi }) => ({
  async find(ctx) {
    const page = Number(ctx.query['pagination[page]']) || 1;
    const pageSize = Number(ctx.query['pagination[pageSize]']) || 10;

    const { results, pagination } = await strapi.entityService.findPage(
      'api::venta.venta',
      {
        page,
        pageSize,
        sort: { createdAt: 'desc' },
        publicationState: 'live',
        populate: { users_permissions_user: true },
      }
    );

    const deduped = dedupeByDocumentId(results);
    ctx.body = {
      data: deduped,
      meta: { pagination },
    };
  },
  async findOne(ctx) {
    const { id } = ctx.params;
    const ventas = await strapi.entityService.findMany('api::venta.venta', {
      filters: { documentId: String(id) },
      limit: 1,
      publicationState: 'live',
      populate: {
        users_permissions_user: true,
        detalle_ventas: {
          populate: {
            variacion: {
              populate: { producto: true },
            },
          },
        },
      },
    });
    const venta = ventas[0];
    if (!venta) {
      return ctx.notFound('Venta no encontrada');
    }
    ctx.body = { data: venta };
  },
  async fromCarrito(ctx) {
    const { carritoId, envio, subtotal, usuario } = ctx.request.body || {};

    if (!carritoId) {
      return ctx.badRequest('carritoId requerido');
    }

    try {
      const result = await strapi
        .service('api::venta.venta')
        .createFromCarrito(carritoId, {
          envio: envio ?? 0,
          subtotal,
          usuario: usuario ?? {},
        });

      ctx.body = result;
    } catch (error) {
      ctx.throw(400, error.message || 'Error creando venta desde carrito');
    }
  },
  async revertir(ctx) {
    const { ventaId } = ctx.request.body || {};

    if (!ventaId) {
      return ctx.badRequest('ventaId requerido');
    }

    try {
      const result = await strapi
        .service('api::venta.venta')
        .revertirVenta(ventaId);

      ctx.body = result;
    } catch (error) {
      ctx.throw(400, error.message || 'Error revirtiendo venta');
    }
  },
}));
