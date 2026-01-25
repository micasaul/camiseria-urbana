import client from "../../../../config/mercadopago.js";
import { Preference, Payment } from "mercadopago";
import numeroUtils from "../../../utils/numero.js";

const { aNumero } = numeroUtils;

const obtenerVentaId = (data = {}) =>
  data.ventaId || data.external_reference || data.externalReference;

const obtenerPago = async (pagoId) => {
  if (!pagoId) return null;
  const payment = new Payment(client);
  return await payment.get({ id: pagoId });
};

export default {
  async createPreference(ctx) {
    try {
      const { ventaId } = ctx.request.body;

      if (!ventaId) {
        ctx.throw(400, "ventaId requerido");
      }

      const ventas = await strapi.entityService.findMany(
          /** @type {any} */ ("api::venta.venta"),
          /** @type {any} */ ({
            filters: { documentId: String(ventaId) },
            limit: 1,
            populate: {
              detalle_ventas: {
                populate: {
                  variacion: {
                    populate: {
                      producto: true,
                    },
                  },
                },
              },
            },
          })
        );
        const encontrada = ventas[0];

        if (!encontrada) {
          ctx.throw(404, "Venta no encontrada");
        }

        if (encontrada.estado !== "En proceso") {
          ctx.throw(400, "Venta no está en proceso");
        }

        const ventaEntity = /** @type {any} */ (encontrada);
        const detalleVentas = /** @type {any[]} */ (
          ventaEntity.detalle_ventas || []
        );

        if (!detalleVentas.length) {
          ctx.throw(400, "Venta sin items");
        }

        const mpItems = detalleVentas.map((detalle) => {
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

        // Agregar envío como item adicional si existe
        const envio = aNumero(ventaEntity.envio || 0);
        if (envio > 0) {
          mpItems.push({
            id: "envio",
            title: "Envío",
            quantity: 1,
            unit_price: Number(envio),
          });
        }

        const preference = new Preference(client);

        const response = await preference.create({
          body: {
            items: mpItems,
            external_reference: String(ventaId),
            metadata: { ventaId },
            notification_url: `${process.env.BACKEND_URL}/api/pagos/webhook`,
            back_urls: {
              success: `http://localhost:5173/payment/success?ventaId=${ventaId}`,
              pending: `http://localhost:5173/payment/pending?ventaId=${ventaId}`,
              failure: `http://localhost:5173/payment/failure?ventaId=${ventaId}`,
            },
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
    const ventaId = obtenerVentaId(payload);

    try {
      if (!payload.data?.id) {
        ctx.send({ received: true });
        return;
      }

      const pago = await obtenerPago(payload.data.id);
      const ventaPagoId = obtenerVentaId(pago) || ventaId;
      const pagoEstado = pago?.status;

      if (pagoEstado === "approved" && ventaPagoId) {
        // Actualizar venta a estado "Enviado" o "Entregado" según corresponda
        const ventas = await strapi.entityService.findMany(
          /** @type {any} */ ("api::venta.venta"),
          /** @type {any} */ ({
            filters: { documentId: String(ventaPagoId) },
            limit: 1,
          })
        );
        const venta = ventas[0];
        if (venta && venta.estado === "En proceso") {
          await strapi.entityService.update(
            /** @type {any} */ ("api::venta.venta"),
            venta.id,
            { data: { estado: "Enviado" } }
          );
        }
      } else if ((pagoEstado === "rejected" || pagoEstado === "failure") && ventaPagoId) {
        // Revertir venta si el pago falla
        await strapi.service("api::venta.venta").revertirVenta(ventaPagoId);
      }
    } catch (error) {
      console.error("Error procesando webhook Mercado Pago:", error);
    }

    ctx.send({ received: true });
  },
  async retorno(ctx) {
    const { status, ventaId, external_reference: externalReference } =
      ctx.request.query || {};
    const idVenta = ventaId || externalReference;

    if (status === "approved" && idVenta) {
      const ventas = await strapi.entityService.findMany(
        /** @type {any} */ ("api::venta.venta"),
        /** @type {any} */ ({
          filters: { documentId: String(idVenta) },
          limit: 1,
        })
      );
      const venta = ventas[0];
      if (venta && venta.estado === "En proceso") {
        await strapi.entityService.update(
          /** @type {any} */ ("api::venta.venta"),
          venta.id,
          { data: { estado: "Enviado" } }
        );
      }
    } else if ((status === "failure" || status === "rejected") && idVenta) {
      await strapi.service("api::venta.venta").revertirVenta(idVenta);
    }

    ctx.send({ received: true });
  },
};
