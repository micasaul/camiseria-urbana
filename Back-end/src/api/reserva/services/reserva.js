'use strict';

const { createCoreService } = require('@strapi/strapi').factories;
const { errors } = require('@strapi/utils');
const pricingService = require('../../../services/pricing');
const { aNumero } = require('../../../utils/numero');

module.exports = createCoreService(
  /** @type {any} */ ('api::reserva.reserva'),
  ({ strapi }) => ({
    async crearDesdeCarrito(carritoId) {
      if (!carritoId) {
        throw new errors.ValidationError('carritoId requerido');
      }

      return await strapi.db.transaction(async ({ trx }) => {
        const carritos = await strapi.entityService.findMany(
          /** @type {any} */ ('api::carrito.carrito'),
          /** @type {any} */ ({
            filters: { documentId: String(carritoId) },
            limit: 1,
            populate: {
              detalle_carritos: {
                populate: {
                  variacion: true,
                },
              },
            },
            transaction: trx,
          })
        );
        const carrito = carritos[0];

        if (!carrito) {
          throw new errors.NotFoundError('Carrito no encontrado');
        }

        const venceEn = new Date(Date.now() + 15 * 60 * 1000);
        const carritoEntity = /** @type {any} */ (carrito);
        const detalleCarritos = carritoEntity.detalle_carritos || [];

        const itemsReserva = await Promise.all(
          detalleCarritos.map(async (detalle) => {
            const variacion = detalle?.variacion;
            const variacionId = variacion?.id;
            const cantidad = aNumero(detalle?.cantidad);

            if (!variacionId || cantidad <= 0) {
              return null;
            }

            const precio = await pricingService.getPrecioFinal(variacionId);
            const precioUnitario = aNumero(precio?.precioFinal);

            return {
              cantidad,
              precioUnitario,
              variacion: variacionId,
            };
          })
        );

        const itemsValidos = itemsReserva.filter(Boolean);

        const total = itemsValidos.reduce(
          (acc, item) => acc + item.precioUnitario * item.cantidad,
          0
        );

        const reserva = await strapi.entityService.create(
          /** @type {any} */ ('api::reserva.reserva'),
          /** @type {any} */ ({
            data: {
              estado: 'ACTIVA',
              venceEn,
              carrito: carrito.id,
              total,
            },
            status: 'published',
            transaction: trx,
          })
        );

        const items = await Promise.all(
          itemsValidos.map((item) =>
            strapi.entityService.create(
              /** @type {any} */ ('api::detalle-reserva.detalle-reserva'),
              /** @type {any} */ ({
                data: {
                  reserva: {
                    connect: [{ documentId: reserva.documentId }],
                  },
                  cantidad: item.cantidad,
                  precioUnitario: item.precioUnitario,
                  variacion: item.variacion,
                },
                status: 'published',
                transaction: trx,
              })
            )
          )
        );

        for (const item of itemsValidos) {
          const variacionActual = await strapi.entityService.findOne(
            /** @type {any} */ ('api::variacion.variacion'),
            item.variacion,
            /** @type {any} */ ({ transaction: trx })
          );

          if (!variacionActual || aNumero(variacionActual.stock) < item.cantidad) {
            throw new errors.ValidationError('Stock insuficiente');
          }

          await strapi.entityService.update(
            /** @type {any} */ ('api::variacion.variacion'),
            item.variacion,
            /** @type {any} */ ({
              data: {
                stock: aNumero(variacionActual.stock) - item.cantidad,
              },
              transaction: trx,
            })
          );
        }

        return { reserva, items };
      });
    },
  })
);
