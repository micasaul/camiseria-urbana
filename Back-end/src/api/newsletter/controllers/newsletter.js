'use strict';

/**
 * newsletter controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = createCoreController('api::newsletter.newsletter', ({ strapi }) => ({
  async suscribir(ctx) {
    const emailEntrada = ctx?.request?.body?.email ?? '';
    const email = String(emailEntrada).trim().toLowerCase();

    if (!email) {
      return ctx.badRequest('El email es obligatorio.');
    }

    if (!EMAIL_REGEX.test(email)) {
      return ctx.badRequest('El email no es válido.');
    }

    const existentes = await strapi.entityService.findMany('api::newsletter.newsletter', {
      filters: { email },
      publicationState: 'preview',
      pagination: { limit: 1 },
    });

    const ahora = new Date().toISOString();
    const usuarioId = ctx?.state?.user?.id;

    const emailService = strapi.plugins?.["email"]?.services?.email;

    if (existentes.length > 0) {
      const existente = existentes[0];

      if (!existente.activo || !existente.publishedAt) {
        await strapi.entityService.update('api::newsletter.newsletter', existente.id, {
          data: {
            activo: true,
            publishedAt: existente.publishedAt ?? ahora,
          },
        });
      }

      if (emailService) {
        await emailService.send({
          to: email,
          subject: 'Suscripción activa - Camisería Urbana',
          text: 'Tu suscripción ya está activa. ¡Gracias por acompañarnos!',
        });
      }

      ctx.body = { ok: true, yaSuscripto: true };
      return;
    }

    const data = {
      email,
      activo: true,
      fechaSuscripcion: ahora,
      publishedAt: ahora,
    };

    if (usuarioId) {
      data.users_permissions_user = usuarioId;
    }

    await strapi.entityService.create('api::newsletter.newsletter', { data });

    if (emailService) {
      await emailService.send({
        to: email,
        subject: 'Suscripción activa - Camisería Urbana',
        text: 'Tu suscripción está activa. ¡Gracias por suscribirte!',
      });
    }

    ctx.body = { ok: true, yaSuscripto: false };
  },
}));
