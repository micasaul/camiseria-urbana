'use strict';

const { actualizarPromosActivas } = require('../../../../extensions/promos/promo-cron');

const getPromoAttrs = (raw) => {
  if (!raw) return null;
  const attrs = raw.attributes ?? raw;
  const nombre = attrs.nombre ?? raw.nombre;
  const fechaInicio = attrs.fechaInicio ?? raw.fechaInicio;
  const fechaFin = attrs.fechaFin ?? raw.fechaFin;
  if (!nombre || !fechaInicio || !fechaFin) return null;
  return { nombre, fechaInicio, fechaFin };
};

const isActive = (promoAttrs) => {
  if (!promoAttrs) return false;
  const now = new Date();
  const start = new Date(promoAttrs.fechaInicio);
  const end = new Date(promoAttrs.fechaFin);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;
  return start <= now && now <= end;
};

const notifySubscribers = async (promoAttrs) => {
  const emailService = strapi.plugins?.email?.services?.email;
  if (!emailService) {
    strapi.log?.warn?.('Promo lifecycle: email plugin no disponible');
    return;
  }

  const newsletters = await strapi.entityService.findMany(
    'api::newsletter.newsletter',
    {
      filters: { activo: true },
      publicationState: 'live',
    }
  );

  if (!newsletters?.length) {
    strapi.log?.info?.(`Promo lifecycle: 0 newsletters activos para "${promoAttrs.nombre}"`);
    return;
  }

  for (const n of newsletters) {
    const email = n.email;
    if (!email) continue;
    try {
      await emailService.send({
        to: email,
        subject: `${promoAttrs.nombre} - Camisería Urbana`,
        text: `¡Ahora está activa la promo "${promoAttrs.nombre}"!`,
      });
    } catch (err) {
      strapi.log?.error?.(`Promo lifecycle: error enviando mail a ${email}`, err);
    }
  }
  strapi.log?.info?.(`Promo lifecycle: enviados ${newsletters.length} mails para "${promoAttrs.nombre}"`);
};

module.exports = {
  async afterCreate(event) {
    try {
      const promoAttrs = getPromoAttrs(event.result);
      if (promoAttrs && isActive(promoAttrs)) {
        await notifySubscribers(promoAttrs);
      }
      await actualizarPromosActivas();
    } catch (err) {
      strapi.log?.error?.('Promo lifecycle afterCreate error:', err);
    }
  },

  async beforeUpdate(event) {
    const { where } = event.params || {};
    const id = where?.id ?? where?.documentId;
    if (id == null) return;

    try {
      const previous = where?.documentId
        ? (await strapi.entityService.findMany('api::promo.promo', /** @type {any} */ ({
            filters: { documentId: where.documentId },
            limit: 1,
          })))[0]
        : await strapi.entityService.findOne('api::promo.promo', id);

      event.state = event.state || {};
      event.state.wasActive = isActive(getPromoAttrs(previous));
    } catch (err) {
      strapi.log?.error?.('Promo lifecycle beforeUpdate error:', err);
    }
  },

  async afterUpdate(event) {
    try {
      const promoAttrs = getPromoAttrs(event.result);
      const wasActive = event.state?.wasActive ?? false;
      const isNowActive = isActive(promoAttrs);

      if (promoAttrs && isNowActive && !wasActive) {
        await notifySubscribers(promoAttrs);
      }
      await actualizarPromosActivas();
    } catch (err) {
      strapi.log?.error?.('Promo lifecycle afterUpdate error:', err);
    }
  },
};

