'use strict';

const { createCoreService } = require('@strapi/strapi').factories;
const { errors } = require('@strapi/utils');
const pricingService = require('../../../services/pricing');
const { aNumero } = require('../../../utils/numero');

module.exports = createCoreService(
  /** @type {any} */ ('api::venta.venta'),
  ({ strapi }) => ({
    async createFromReserva(reservaId) {
      if (!reservaId) {
        throw new errors.ValidationError('reservaId requerido');
      }

      return await strapi.db.transaction(async ({ trx }) => {
        const reservas = await strapi.entityService.findMany(
          /** @type {any} */ ('api::reserva.reserva'),
          /** @type {any} */ ({
            filters: { documentId: String(reservaId) },
            limit: 1,
            populate: {
              detalle_reservas: {
                populate: {
                  variacion: true,
                },
              },
              carrito: {
                populate: {
                  detalle_carritos: true,
                  users_permissions_user: true,
                },
              },
            },
            transaction: trx,
          })
        );
        const reserva = reservas[0];

        if (!reserva) {
          throw new errors.NotFoundError('Reserva no encontrada');
        }

        if (reserva.estado !== 'CONFIRMADA') {
          throw new errors.ValidationError('Reserva no confirmada');
        }

        const reservaEntity = /** @type {any} */ (reserva);
        const ventasExistentes = await strapi.entityService.findMany(
          /** @type {any} */ ('api::venta.venta'),
          /** @type {any} */ ({
            filters: { reserva: reserva.id },
            limit: 1,
            transaction: trx,
          })
        );

        if (ventasExistentes.length) {
          return { venta: ventasExistentes[0], items: [], carritoNuevo: null };
        }
        const detalleReservas = /** @type {any[]} */ (
          reservaEntity.detalle_reservas || []
        );

        const itemsVenta = await Promise.all(
          detalleReservas.map(async (detalle) => {
            const variacionId = detalle?.variacion?.id;
            const variacionDocumentId = detalle?.variacion?.documentId;
            const cantidad = aNumero(detalle?.cantidad);

            if (!variacionId || !variacionDocumentId || cantidad <= 0) {
              return null;
            }

            const precio = await pricingService.getPrecioFinal(variacionId);
            const precioUnitario = aNumero(precio?.precioFinal);
            const descuento = aNumero(precio?.descuento);
            const subtotal = precioUnitario * cantidad;

            return {
              variacion: variacionId,
              variacionDocumentId,
              cantidad,
              precioUnitario,
              descuento,
              subtotal,
            };
          })
        );

        const itemsValidos = itemsVenta.filter(Boolean);
        const total = itemsValidos.reduce(
          (acc, item) => acc + item.subtotal,
          0
        );

        const venta = await strapi.entityService.create(
          /** @type {any} */ ('api::venta.venta'),
          /** @type {any} */ ({
            data: {
              fecha: new Date(),
              estado: 'En proceso',
              total,
              nroSeguimiento: '',
              reserva: {
                connect: [{ documentId: reserva.documentId }],
              },
              users_permissions_user: reservaEntity?.carrito?.users_permissions_user?.id,
            },
            status: 'published',
            transaction: trx,
          })
        );

        const items = await Promise.all(
          itemsValidos.map((item) =>
            strapi.entityService.create(
              /** @type {any} */ ('api::detalle-venta.detalle-venta'),
              /** @type {any} */ ({
                data: {
                  venta: {
                    connect: [{ documentId: venta.documentId }],
                  },
                  variacion: {
                    connect: [{ documentId: item.variacionDocumentId }],
                  },
                  cantidad: item.cantidad,
                  precioUnitario: item.precioUnitario,
                  descuento: item.descuento,
                  subtotal: item.subtotal,
                },
                status: 'published',
                transaction: trx,
              })
            )
          )
        );

        const carritoId = reservaEntity?.carrito?.id;
        const detalleCarritos = /** @type {any[]} */ (
          reservaEntity?.carrito?.detalle_carritos || []
        );

        for (const detalle of detalleCarritos) {
          await strapi.entityService.delete(
            /** @type {any} */ ('api::detalle-carrito.detalle-carrito'),
            detalle.id,
            /** @type {any} */ ({ transaction: trx })
          );
        }

        const usuarioId = reservaEntity?.carrito?.users_permissions_user?.id;

        const carritoNuevo = await strapi.entityService.create(
          /** @type {any} */ ('api::carrito.carrito'),
          /** @type {any} */ ({
            data: {
              fecha: new Date(),
              users_permissions_user: usuarioId || null,
            },
            transaction: trx,
          })
        );

        return { venta, items, carritoNuevo };
      });
    },
  })
);
