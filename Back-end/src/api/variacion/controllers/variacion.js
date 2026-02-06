'use strict';

/**
 * variacion controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::variacion.variacion', ({ strapi }) => ({
  async update(ctx) {
    const documentId = ctx.params?.documentId ?? ctx.params?.id;
    if (!documentId) {
      return ctx.badRequest('Falta documentId de la variación.');
    }

    const body = ctx.request?.body?.data ?? ctx.request?.body ?? {};

    strapi.log.info?.('[variacion] PUT update (Sync Draft+Publish)', { documentId, body });

    try {
      const draftDoc = await strapi.documents('api::variacion.variacion').update({
        documentId: String(documentId),
        data: body,
      });

      const publishedDoc = await strapi.documents('api::variacion.variacion').publish({
        documentId: String(documentId),
      });

      ctx.body = { data: publishedDoc };
      
    } catch (error) {
      strapi.log.error('[variacion] Error updating:', error);
      return ctx.internalServerError('Error actualizando la variación');
    }
  },
}));