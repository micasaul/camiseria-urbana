'use strict';

const isStockRestored = (previousStock, newStock) => {
  if (previousStock === undefined || previousStock === null) return false;
  return Number(previousStock) === 0 && Number(newStock) > 0;
};

const notifyStockSubscribers = async (variacion, notifications) => {
  if (!notifications.length) return;

  const emailService = strapi.plugins?.email?.services?.email;
  if (!emailService) return;

  const producto = variacion?.producto;
  const variacionLabel = [variacion?.talle, variacion?.color].filter(Boolean).join(' ');
  const productoLabel = producto?.nombre ? ` del producto ${producto.nombre}` : '';

  for (const notif of notifications) {
    const user = notif.users_permissions_user;
    if (!user?.email) continue;

    await emailService.send({
      to: user.email,
      subject: 'Ya hay stock disponible',
      text: `La variante ${variacionLabel}${productoLabel} volvió a tener stock.`,
    });

    await strapi.entityService.update(
      'api::notificacion-stock.notificacion-stock',
      notif.id,
      { data: { enviado: true } }
    );
  }
};

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
    const newStock = event.result?.stock;
    const previousStock = event.state?.previousStock;
    const shouldNotify = isStockRestored(previousStock, newStock);

    const variacionId = event.result.id;
    const variacion = /** @type {any} */ (
      event.state?.previousVariacion ||
        (await strapi.entityService.findOne('api::variacion.variacion', variacionId, {
          populate: ['producto'],
        }))
    );

    if (shouldNotify) {
      const pendientes = await strapi.entityService.findMany(
        'api::notificacion-stock.notificacion-stock',
        {
          filters: {
            variacion: { id: variacionId },
            enviado: false,
          },
          populate: ['users_permissions_user'],
        }
      );

      await notifyStockSubscribers(variacion, pendientes);
    }

    try {
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

