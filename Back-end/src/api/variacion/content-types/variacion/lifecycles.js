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

    if (!isStockRestored(previousStock, newStock)) return;

    const variacionId = event.result.id;
    const variacion =
      event.state?.previousVariacion ||
      (await strapi.entityService.findOne('api::variacion.variacion', variacionId, {
        populate: ['producto'],
      }));

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
  },
};

