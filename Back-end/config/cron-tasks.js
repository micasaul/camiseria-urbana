module.exports = {
  newsletterPromos: {
    task: async () => {
      const cron = require("../src/extensions/newsletters/newsletter-cron");
      await cron.enviarNewsletterPromos();
    },
    options: {
      // Ejecutar una vez al día (8 AM)
      rule: "0 8 * * *", 
    },
  },
};
