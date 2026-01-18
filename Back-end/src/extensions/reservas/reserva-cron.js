'use strict';

const { aNumero } = require('../../utils/numero');

const cancelarReservasVencidas = async () => {
  const now = new Date();
  const pageSize = 100;
  let page = 1;

  while (true) {
    const reservas = await strapi.entityService.findMany(
      /** @type {any} */ ('api::reserva.reserva'),
      /** @type {any} */ ({
        filters: {
          estado: 'ACTIVA',
          venceEn: { $lt: now },
        },
        populate: {
          detalle_reservas: {
            populate: {
              variacion: true,
            },
          },
        },
        status: 'published',
        pagination: { page, pageSize },
      })
    );

    const reservasList = /** @type {any[]} */ (reservas || []);

    if (!reservasList.length) {
      break;
    }

    for (const reserva of reservasList) {
      await strapi.db.transaction(async ({ trx }) => {
        const reservaActual = await strapi.entityService.findOne(
          /** @type {any} */ ('api::reserva.reserva'),
          reserva.id,
          /** @type {any} */ ({ transaction: trx })
        );

        if (!reservaActual || reservaActual.estado !== 'ACTIVA') {
          return;
        }

        const reservaEntity = /** @type {any} */ (reserva);
        const detalleReservas = /** @type {any[]} */ (
          reservaEntity.detalle_reservas || []
        );

        await strapi.entityService.update(
          /** @type {any} */ ('api::reserva.reserva'),
          reserva.id,
          /** @type {any} */ ({
            data: { estado: 'CANCELADA' },
            transaction: trx,
          })
        );

        for (const detalle of detalleReservas) {
          const variacionId = detalle?.variacion?.id;
          const cantidad = aNumero(detalle?.cantidad);

          if (!variacionId || cantidad <= 0) {
            continue;
          }

          const variacionActual = await strapi.entityService.findOne(
            /** @type {any} */ ('api::variacion.variacion'),
            variacionId,
            /** @type {any} */ ({ transaction: trx })
          );

          if (!variacionActual) {
            continue;
          }

          const stockActual = aNumero(variacionActual.stock);

          await strapi.entityService.update(
            /** @type {any} */ ('api::variacion.variacion'),
            variacionId,
            /** @type {any} */ ({
              data: {
                stock: stockActual + cantidad,
              },
              transaction: trx,
            })
          );
        }
      });
    }

    if (reservasList.length < pageSize) {
      break;
    }

    page += 1;
  }
};

module.exports = {
  cancelarReservasVencidas,
};
