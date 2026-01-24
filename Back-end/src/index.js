'use strict';

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap() {
    const promoCron = require('./extensions/promos/promo-cron');
    const newsletterCron = require('./extensions/newsletters/newsletter-cron');

    await promoCron.actualizarPromosActivas();
    await newsletterCron.enviarNewsletterPromos();

    const asegurarCarritosUsuarios = async () => {
      const usuarios = await strapi.entityService.findMany(
        /** @type {any} */ ('plugin::users-permissions.user'),
        /** @type {any} */ ({
          fields: ['documentId'],
          limit: 1000,
        })
      );

      if (!usuarios?.length) {
        return;
      }

      const carritos = await strapi.entityService.findMany(
        /** @type {any} */ ('api::carrito.carrito'),
        /** @type {any} */ ({
          fields: ['id'],
          populate: {
            users_permissions_user: {
              fields: ['documentId'],
            },
          },
          limit: 1000,
        })
      );

      const usuariosConCarrito = new Set();

      const carritosLista = Array.isArray(carritos)
        ? carritos
        : carritos
          ? [carritos]
          : [];

      for (const carrito of carritosLista) {
        const usuario = carrito?.users_permissions_user;
        if (Array.isArray(usuario)) {
          for (const u of usuario) {
            if (u?.documentId) {
              usuariosConCarrito.add(u.documentId);
            }
          }
        } else if (usuario?.documentId) {
          usuariosConCarrito.add(usuario.documentId);
        }
      }

      const usuariosLista = Array.isArray(usuarios)
        ? usuarios
        : usuarios
          ? [usuarios]
          : [];

      for (const usuario of usuariosLista) {
        const userDocumentId = usuario?.documentId;
        if (!userDocumentId || usuariosConCarrito.has(userDocumentId)) {
          continue;
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
      }
    };

    await asegurarCarritosUsuarios();
  },
};
