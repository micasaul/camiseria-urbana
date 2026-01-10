'use strict';

const isActive = (promo) => {
  if (!promo) return false;
  const now = new Date();
  const start = promo.fechaInicio ? new Date(promo.fechaInicio) : null;
  const end = promo.fechaFin ? new Date(promo.fechaFin) : null;
  if (!start || !end) return false;
  return start <= now && now <= end;
};

const notifySubscribers = async (promo) => {
  const emailService = strapi.plugins?.email?.services?.email;
  if (!emailService) return;

  const newsletters = await strapi.entityService.findMany(
    'api::newsletter.newsletter',
    {
      filters: { activo: true },
      populate: ['users_permissions_user'],
    }
  );

  if (!newsletters.length) return;

  for (const n of newsletters) {
    const user = n.users_permissions_user;
    if (!user?.email) continue;

    await emailService.send({
      to: user.email,
      subject: `${promo.nombre} - Camisería Urbana`,
      text: `La promo "${promo.nombre}" está activa hasta el ${promo.fechaFin}.`,
    });
  }
};

module.exports = {
  async afterCreate(event) {
    const promo = event.result;
    if (isActive(promo)) {
      await notifySubscribers(promo);
    }
  },

  async beforeUpdate(event) {
    const { where } = event.params || {};
    if (!where?.id) return;

    const previous = await strapi.entityService.findOne(
      'api::promo.promo',
      where.id
    );

    event.state = event.state || {};
    event.state.wasActive = isActive(previous);
  },

  async afterUpdate(event) {
    const promo = event.result;
    const wasActive = event.state?.wasActive;
    const isNowActive = isActive(promo);

    if (isNowActive && !wasActive) {
      await notifySubscribers(promo);
    }
  },
};

