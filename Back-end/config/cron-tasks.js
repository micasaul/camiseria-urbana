module.exports = {
  promosYNewsletter: {
    task: async () => {
      const promoCron = require("../src/extensions/promos/promo-cron");
      const newsletterCron = require("../src/extensions/newsletters/newsletter-cron");

      await promoCron.actualizarPromosActivas();
      await newsletterCron.enviarNewsletterPromos();
    },
    options: {
      // Ejecutar a las 00:00 todos los dias
      rule: "0 0 * * *",
    },
  },
};
