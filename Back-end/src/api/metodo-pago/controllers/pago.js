import client from "../../../../config/mercadopago.js";
import { Preference, Payment } from "mercadopago";
import numeroUtils from "../../../utils/numero.js";

const { aNumero } = numeroUtils;

const obtenerReservaId = (data = {}) =>
  data.reservaId || data.external_reference || data.externalReference;

const actualizarReservaConfirmada = async (reservaId) => {
  if (!reservaId) return null;

  let crearVenta = false;
  const reservaActualizada = await strapi.db.transaction(async ({ trx }) => {
    const reservas = await strapi.entityService.findMany(
      /** @type {any} */ ("api::reserva.reserva"),
      /** @type {any} */ ({
        filters: { documentId: String(reservaId) },
        limit: 1,
        transaction: trx,
      })
    );
    const reserva = reservas[0];

    if (!reserva) {
      return null;
    }

    if (reserva.estado === "CONFIRMADA" || reserva.estado === "CANCELADA") {
      return reserva;
    }

    crearVenta = true;
    return await strapi.entityService.update(
      /** @type {any} */ ("api::reserva.reserva"),
      reserva.id,
      /** @type {any} */ ({
        data: { estado: "CONFIRMADA" },
        transaction: trx,
      })
    );
  });

  if (reservaActualizada && reservaActualizada.estado === "CONFIRMADA") {
    await strapi.service("api::venta.venta").createFromReserva(reservaId);
  }

  return reservaActualizada;
};

const cancelarReservaConDevolucion = async (reservaId) => {
  if (!reservaId) return null;

  return await strapi.db.transaction(async ({ trx }) => {
    const reservas = await strapi.entityService.findMany(
      /** @type {any} */ ("api::reserva.reserva"),
      /** @type {any} */ ({
        filters: { documentId: String(reservaId) },
        limit: 1,
        populate: {
          detalle_reservas: {
            populate: {
              variacion: true,
            },
          },
        },
        transaction: trx,
      })
    );
    const reserva = reservas[0];

    if (!reserva) {
      return null;
    }

    if (reserva.estado === "CONFIRMADA" || reserva.estado === "CANCELADA") {
      return reserva;
    }

    await strapi.entityService.update(
      /** @type {any} */ ("api::reserva.reserva"),
      reserva.id,
      /** @type {any} */ ({
        data: { estado: "CANCELADA" },
        transaction: trx,
      })
    );

    const reservaEntity = /** @type {any} */ (reserva);
    const detalleReservas = /** @type {any[]} */ (
      reservaEntity.detalle_reservas || []
    );

    for (const detalle of detalleReservas) {
      const variacionId = detalle?.variacion?.id;
      const cantidad = aNumero(detalle?.cantidad);

      if (!variacionId || cantidad <= 0) {
        continue;
      }

      const variacionActual = await strapi.entityService.findOne(
        /** @type {any} */ ("api::variacion.variacion"),
        variacionId,
        /** @type {any} */ ({ transaction: trx })
      );

      if (!variacionActual) {
        continue;
      }

      await strapi.entityService.update(
        /** @type {any} */ ("api::variacion.variacion"),
        variacionId,
        /** @type {any} */ ({
          data: {
            stock: aNumero(variacionActual.stock) + cantidad,
          },
          transaction: trx,
        })
      );
    }

    return reserva;
  });
};

const obtenerPago = async (pagoId) => {
  if (!pagoId) return null;
  const payment = new Payment(client);
  return await payment.get({ id: pagoId });
};

export default {
  async createPreference(ctx) {
    try {
      const { reservaId } = ctx.request.body;

      if (!reservaId) {
        ctx.throw(400, "reservaId requerido");
      }

      const reserva = await strapi.db.transaction(async ({ trx }) => {
        const reservas = await strapi.entityService.findMany(
          /** @type {any} */ ("api::reserva.reserva"),
          /** @type {any} */ ({
            filters: { documentId: String(reservaId) },
            limit: 1,
            populate: {
              detalle_reservas: {
                populate: {
                  variacion: {
                    populate: {
                      producto: true,
                    },
                  },
                },
              },
            },
            transaction: trx,
          })
        );
        const encontrada = reservas[0];

        if (!encontrada) {
          ctx.throw(404, "Reserva no encontrada");
        }

        if (encontrada.estado === "CONFIRMADA") {
          ctx.throw(400, "Reserva ya confirmada");
        }

        if (encontrada.estado === "CANCELADA") {
          ctx.throw(400, "Reserva cancelada");
        }

        if (encontrada.estado !== "CONGELADA") {
          await strapi.entityService.update(
            /** @type {any} */ ("api::reserva.reserva"),
            encontrada.id,
            /** @type {any} */ ({
              data: { estado: "CONGELADA" },
              transaction: trx,
            })
          );
        }

        return encontrada;
      });

      if (!reserva) {
        ctx.throw(404, "Reserva no encontrada");
      }

      const reservaEntity = /** @type {any} */ (reserva);
      const detalleReservas = /** @type {any[]} */ (
        reservaEntity.detalle_reservas || []
      );

      if (!detalleReservas.length) {
        ctx.throw(400, "Reserva sin items");
      }

      const mpItems = detalleReservas.map((detalle) => {
        const variacion = detalle?.variacion;
        const producto = variacion?.producto;
        const nombre = producto?.nombre || "Producto";
        const cantidad = aNumero(detalle?.cantidad);
        const precio = aNumero(detalle?.precioUnitario);

        if (!cantidad || !precio) {
          ctx.throw(400, "Item incompleto");
        }

        return {
          id: String(variacion?.id || detalle?.id || "item"),
          title: nombre,
          quantity: Number(cantidad),
          unit_price: Number(precio),
        };
      });

      const preference = new Preference(client);

      const response = await preference.create({
        body: {
          items: mpItems,
          external_reference: String(reservaId),
          metadata: { reservaId },
          notification_url: `${process.env.BACKEND_URL}/api/pagos/webhook`,
          back_urls: {
            success: `http://localhost:5173/payment/success?reservaId=${reservaId}`,
            pending: `http://localhost:5173/payment/pending?reservaId=${reservaId}`,
            failure: `http://localhost:5173/payment/failure?reservaId=${reservaId}`,
          },
        //   auto_return: "approved",
        },
      });

      ctx.body = {
        init_point: response.init_point,
      };
    } catch (error) {
      console.error(error);
      ctx.throw(500, "Error creando preferencia de pago");
    }
  },

  async webhook(ctx) {
    const payload = ctx.request.body || {};
    const reservaId = obtenerReservaId(payload);

    try {
      if (!payload.data?.id) {
        ctx.send({ received: true });
        return;
      }

      const pago = await obtenerPago(payload.data.id);
      const reservaPagoId = obtenerReservaId(pago) || reservaId;
      const pagoEstado = pago?.status;

      if (pagoEstado === "approved") {
        await actualizarReservaConfirmada(reservaPagoId);
      } else if (pagoEstado === "rejected" || pagoEstado === "failure") {
        await cancelarReservaConDevolucion(reservaPagoId);
      }
    } catch (error) {
      console.error("Error procesando webhook Mercado Pago:", error);
    }

    ctx.send({ received: true });
  },
  async retorno(ctx) {
    const { status, reservaId, external_reference: externalReference } =
      ctx.request.query || {};
    const idReserva = reservaId || externalReference;

    if (status === "approved") {
      await actualizarReservaConfirmada(idReserva);
    } else if (status === "failure" || status === "rejected") {
      await cancelarReservaConDevolucion(idReserva);
    }

    ctx.send({ received: true });
  },
};
