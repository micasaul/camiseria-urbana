"use strict";

module.exports = {
  async enviarNewsletterPromos() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Promos que terminan mañana
    const promosQueTerminanManiana = await strapi.entityService.findMany(
      "api::promo.promo",
      {
        filters: {
          fechaFin: tomorrow.toISOString().slice(0, 10)
        }
      }
    );

    // Si no hay promos para avisar, no hacemos nada
    if (promosQueTerminanManiana.length === 0) return;

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

        if (!usr || !usr.email) continue;

        // Promos que terminan mañana
        for (const p of promosQueTerminanManiana) {
            await emailService.send({
                to: usr.email,
                subject: `${p.nombre} - Camisería Urbana`,
                text: `¡Último día! Mañana finaliza la promo "${p.nombre}".`,
            });
        }
    }
  }
};
