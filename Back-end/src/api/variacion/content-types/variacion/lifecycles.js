'use strict';

const productoTieneStock = (variaciones = []) => {
  return variaciones.some((variacion) => Number(variacion?.stock ?? 0) > 0);
};

const eliminarDetallesCarrito = async (variacionIds) => {
  if (!variacionIds.length) return;

  const pageSize = 100;
  let page = 1;

  while (true) {
    const detalles = await strapi.entityService.findMany(
      'api::detalle-carrito.detalle-carrito',
      {
        filters: { variacion: { id: { $in: variacionIds } } },
        pagination: { page, pageSize },
      }
    );

    if (!detalles.length) break;

    await Promise.all(
      detalles.map((detalle) =>
        strapi.entityService.delete('api::detalle-carrito.detalle-carrito', detalle.id)
      )
    );

    if (detalles.length < pageSize) break;
    page += 1;
  }
};

const limpiarCarritosSiProductoSinStock = async (productoId) => {
  if (!productoId) return;

  const producto = /** @type {any} */ (await strapi.entityService.findOne(
    'api::producto.producto',
    productoId,
    { populate: { variacions: true } }
  ));

  const variaciones = producto?.variacions ?? [];
  if (productoTieneStock(variaciones)) return;

  const variacionIds = variaciones.map((variacion) => variacion.id).filter(Boolean);
  await eliminarDetallesCarrito(variacionIds);
};

module.exports = {
  async beforeUpdate(event) {
    const { where } = event.params || {};
    if (!where?.id) return;

    const previous = await strapi.entityService.findOne(
      'api::variacion.variacion',
      where.id,
      { populate: ['producto'] }
    );

    event.state = event.state || {};
    event.state.previousStock = previous?.stock ?? null;
    event.state.previousVariacion = previous;
  },

  async afterUpdate(event) {
    try {
      const variacionId = event.result?.id;
      if (!variacionId) return;

      const variacion = event.state?.previousVariacion || 
        (await strapi.entityService.findOne(
          'api::variacion.variacion',
          variacionId,
          { populate: ['producto'] }
        ));

      let productoId = variacion?.producto?.id ?? variacion?.producto;
      if (!productoId) {
        const variacionCompleta = /** @type {any} */ (await strapi.entityService.findOne(
          'api::variacion.variacion',
          variacionId,
          { populate: ['producto'] }
        ));
        productoId = variacionCompleta?.producto?.id ?? variacionCompleta?.producto;
      }
      await limpiarCarritosSiProductoSinStock(productoId);
    } catch (error) {
      strapi.log?.error?.('Error al limpiar carritos sin stock', error);
    }
  },
};

