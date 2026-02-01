'use strict';

const { actualizarPromosActivas } = require('../../../../extensions/promos/promo-cron');

module.exports = {
  async afterCreate() {
    try {
      await actualizarPromosActivas();
    } catch (err) {
      strapi.log?.error?.('PromoProducto lifecycle afterCreate error:', err);
    }
  },

  async afterUpdate() {
    try {
      await actualizarPromosActivas();
    } catch (err) {
      strapi.log?.error?.('PromoProducto lifecycle afterUpdate error:', err);
    }
  },
};
