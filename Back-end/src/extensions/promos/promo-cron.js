'use strict';

const { estaPromoActiva } = require('../../utils/promo');

const actualizarPromosActivas = async () => {
  const pageSize = 100;
  let page = 1;
  let totalActualizados = 0;
  let totalActivados = 0;
  let totalDesactivados = 0;

  while (true) {
    const promoProductos = await strapi.entityService.findMany(
      'api::promo-producto.promo-producto',
      {
        publicationState: 'preview',
        populate: { promo: true },
        pagination: { page, pageSize },
      }
    );

    if (!promoProductos.length) {
      break;
    }

    await Promise.all(
      promoProductos.map(async (promoProducto) => {
        const promoProductoEntity = /** @type {any} */ (promoProducto);
        const promo = promoProductoEntity?.promo;
        
        const shouldBeActive = estaPromoActiva(promo);
        
        const now = new Date();
        const fechaFin = promo?.fechaFin ? new Date(promo.fechaFin) : null;
        const fechaPasada = fechaFin && now > fechaFin;
        
        const debeEstarActiva = shouldBeActive && !fechaPasada;
        
        if (promoProducto.activo !== debeEstarActiva) {
          await strapi.entityService.update(
            'api::promo-producto.promo-producto',
            promoProducto.id,
            { data: { activo: debeEstarActiva } }
          );
          totalActualizados++;
          if (debeEstarActiva) {
            totalActivados++;
          } else {
            totalDesactivados++;
          }
        }
      })
    );

    if (promoProductos.length < pageSize) {
      break;
    }

    page += 1;
  }

  if (totalActualizados > 0) {
    strapi.log.info(`[Cron Promos] Actualizadas ${totalActualizados} promos: ${totalActivados} activadas, ${totalDesactivados} desactivadas`);
  }
};

module.exports = {
  actualizarPromosActivas,
};
