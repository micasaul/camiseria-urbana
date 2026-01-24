'use strict';

module.exports = {
  async afterCreate(event) {
    const { result } = event || {};
    const userDocumentId = result?.documentId;

    if (!userDocumentId) {
      return;
    }

    const existentes = await strapi.entityService.findMany(
      /** @type {any} */ ('api::carrito.carrito'),
      /** @type {any} */ ({
        filters: {
          users_permissions_user: { documentId: userDocumentId },
        },
        fields: ['id'],
        limit: 1,
      })
    );

    if (existentes?.length) {
      return;
    }

    await strapi.entityService.create(
      /** @type {any} */ ('api::carrito.carrito'),
      /** @type {any} */ ({
        data: {
          fecha: new Date().toISOString(),
          users_permissions_user: { connect: [{ documentId: userDocumentId }] },
        },
        status: 'published',
      })
    );
  },
};
