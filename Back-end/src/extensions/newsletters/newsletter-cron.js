"use strict";

module.exports = {
  async enviarNewsletterPromos() {
    const hoy = new Date();
    const inicioHoy = new Date(hoy);
    inicioHoy.setHours(0, 0, 0, 0);
    const finHoy = new Date(hoy);
    finHoy.setHours(23, 59, 59, 999);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const inicioManiana = new Date(tomorrow);
    inicioManiana.setHours(0, 0, 0, 0);
    const finManiana = new Date(tomorrow);
    finManiana.setHours(23, 59, 59, 999);

    // Promos que empiezan hoy
    const promosQueEmpiezanHoy = await strapi.entityService.findMany(
      "api::promo.promo",
      {
        filters: {
          fechaInicio: {
            $gte: inicioHoy.toISOString(),
            $lte: finHoy.toISOString(),
          },
        },
      }
    );

    // Promos que empiezan mañana
    const promosQueEmpiezanManiana = await strapi.entityService.findMany(
      "api::promo.promo",
      {
        filters: {
          fechaInicio: {
            $gte: inicioManiana.toISOString(),
            $lte: finManiana.toISOString(),
          },
        },
      }
    );

    // Promos que terminan mañana
    const promosQueTerminanManiana = await strapi.entityService.findMany(
      "api::promo.promo",
      {
        filters: {
          fechaFin: {
            $gte: inicioManiana.toISOString(),
            $lte: finManiana.toISOString(),
          },
        },
      }
    );

    // Si no hay promos para avisar, no hacemos nada
    if (
      promosQueEmpiezanHoy.length === 0 &&
      promosQueEmpiezanManiana.length === 0 &&
      promosQueTerminanManiana.length === 0
    ) {
      return;
    }

    // Obtener usuarios suscriptos al newsletter (los activos)
    const newsletters = await strapi.entityService.findMany(
      "api::newsletter.newsletter",
      {
        filters: { activo: true },
        populate: ["users_permissions_user"]
      }
    );

    const emailService = strapi.plugins["email"].services.email;

    for (const n of newsletters) {
      const usr = n["users_permissions_user"];
      const destinatario = n.email || usr?.email;

      if (!destinatario) continue;

      for (const p of promosQueEmpiezanManiana) {
        await emailService.send({
          to: destinatario,
          subject: `${p.nombre} - Camisería Urbana`,
          text: `¡Mañana empieza la promo "${p.nombre}"!`,
        });
      }

      for (const p of promosQueEmpiezanHoy) {
        await emailService.send({
          to: destinatario,
          subject: `${p.nombre} - Camisería Urbana`,
          text: `¡Hoy empieza la promo "${p.nombre}"!`,
        });
      }

      for (const p of promosQueTerminanManiana) {
        await emailService.send({
          to: destinatario,
          subject: `${p.nombre} - Camisería Urbana`,
          text: `¡Último día! Mañana finaliza la promo "${p.nombre}".`,
        });
      }
    }
  }
};
