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

function urlFromMedia(media) {
  if (!media) return null;
  if (typeof media === 'string' && media.trim()) return media;
  if (typeof media !== 'object') return null;
  const url =
    media?.url ??
    media?.attributes?.url ??
    media?.data?.attributes?.url ??
    media?.data?.url;
  if (url && typeof url === 'string') return url.startsWith('/') ? url : `/${url}`;
  if (media?.data) return urlFromMedia(media.data);
  return null;
}

function enriquecerVentasConImagenUrl(ventas) {
  const list = Array.isArray(ventas) ? ventas : [];
  for (const venta of list) {
    const detalles = venta?.detalle_ventas ?? [];
    for (const detalle of detalles) {
      const variacion = detalle?.variacion;
      if (variacion) {
        const path = urlFromMedia(variacion?.imagen);
        if (path) variacion.imagenUrl = path;
      }
      const combo = detalle?.combo_variacion?.combo;
      if (combo) {
        const path = urlFromMedia(combo?.imagen);
        if (path) combo.imagenUrl = path;
      }
    }
  }
  return ventas;
}

module.exports = createCoreController('api::venta.venta', ({ strapi }) => ({
  async find(ctx) {
    const page = Number(ctx.query?.pagination?.page) || 1;
    const pageSize = Number(ctx.query?.pagination?.pageSize) || 10;
    const queryFilters = ctx.query?.filters || {};

    const isFilterByUser = Boolean(
      queryFilters?.users_permissions_user ||
      queryFilters?.users_permissions_user?.documentId ||
      queryFilters?.users_permissions_user?.id
    );

    const filters = { ...queryFilters };
    if (!isFilterByUser) {
      filters.estado = { $ne: 'pendiente' };
    }

    const { results, pagination } = await strapi.entityService.findPage(
      'api::venta.venta',
      {
        page,
        pageSize,
        sort: { createdAt: 'desc' },
        publicationState: 'live',
        filters,
        populate: {
          users_permissions_user: true,
          direccion: true,
          detalle_ventas: {
            populate: {
              variacion: {
                populate: { producto: true, imagen: true },
              },
              combo_variacion: {
                populate: {
                  combo: {
                    populate: { imagen: true },
                  },
                },
              },
            },
          },
        },
      }
    );

    const deduped = dedupeByDocumentId(results);
    enriquecerVentasConImagenUrl(deduped);
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
              populate: { producto: true, imagen: true },
            },
            combo_variacion: {
              populate: {
                combo: {
                  populate: { imagen: true },
                },
              },
            },
          },
        },
      },
    });
    const venta = ventas[0];
    if (!venta) {
      return ctx.notFound('Venta no encontrada');
    }

    await strapi.service('api::venta.venta').enriquecerDetalleVentasConImagenFallback(venta.detalle_ventas);
    ctx.body = { data: venta };
  },
  async fromCarrito(ctx) {
    const { carritoId, envio, subtotal, usuario, direccionId } = ctx.request.body || {};

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
          direccionId: direccionId || null,
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
