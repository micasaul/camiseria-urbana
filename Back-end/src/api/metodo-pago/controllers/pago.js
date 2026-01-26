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

        if (encontrada.estado !== "pendiente") {
          ctx.throw(400, "Venta no está en estado pendiente");
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
            notification_url: `${process.env.VITE_BACKEND_URL}/api/pagos/webhook`,
            back_urls: {
              success: `${process.env.FRONTEND_URL}/pago/success?ventaId=${ventaId}`,
              pending: `${process.env.FRONTEND_URL}/pago/pending?ventaId=${ventaId}`,
              failure: `${process.env.FRONTEND_URL}/pago/failure?ventaId=${ventaId}`,
            },
          },
        });

        if (response.id) {
          await strapi.entityService.update(
            /** @type {any} */ ("api::venta.venta"),
            encontrada.id,
            {
              data: {
                preference_id: String(response.id),
              },
            }
          );
        }

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
    
    try {
      if (payload.type !== "payment") {
        ctx.send({ received: true });
        return;
      }

      if (!payload.data?.id) {
        ctx.send({ received: true });
        return;
      }

      const paymentId = payload.data.id;
      
      const pago = await obtenerPago(paymentId);
      
      if (!pago) {
        strapi.log.warn(`No se pudo obtener el pago ${paymentId} desde Mercado Pago`);
        ctx.send({ received: true });
        return;
      }

      const ventaId = pago.external_reference || obtenerVentaId(payload);
      
      if (!ventaId) {
        strapi.log.warn(`No se encontró ventaId en el pago ${paymentId}`);
        ctx.send({ received: true });
        return;
      }

      const ventas = await strapi.entityService.findMany(
        /** @type {any} */ ("api::venta.venta"),
        /** @type {any} */ ({
          filters: { documentId: String(ventaId) },
          limit: 1,
          populate: {
            users_permissions_user: true,
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
      
      const venta = ventas[0];
      
      if (!venta) {
        strapi.log.warn(`Venta ${ventaId} no encontrada para el pago ${paymentId}`);
        ctx.send({ received: true });
        return;
      }

      const ventaEntity = /** @type {any} */ (venta);
      const pagoEstado = pago.status;

      await strapi.entityService.update(
        /** @type {any} */ ("api::venta.venta"),
        venta.id,
        {
          data: {
            payment_id: String(paymentId),
          },
        }
      );

      if (ventaEntity.estado === "pendiente") {
        if (pagoEstado === "approved") {
          await strapi.service("api::venta.venta").confirmarPago(ventaId);
          
          const usuario = ventaEntity.users_permissions_user;
          if (usuario?.email) {
            try {
              await strapi.plugins.email.services.email.send({
                to: usuario.email,
                subject: "Confirmación de compra - Camisería Urbana",
                text: `Hola ${usuario.email}, Agradecemos tu compra! Te va a llegar en unos días, te dejamos información para estar al día: Orden: ${ventaId}, Número de seguimiento: ${ventaEntity.nroSeguimiento}`,
                html: `
                  <h2>Hola ${usuario.email},</h2>
                  <p>Agradecemos tu compra! Te va a llegar en unos días, te dejamos información para estar al día:</p>
                  <p><strong>Orden:</strong> ${ventaId}</p>
                  <p><strong>Número de seguimiento:</strong> ${ventaEntity.nroSeguimiento}</p>
                  <p>Gracias por confiar en nosotros.</p>
                `,
              });
            } catch (emailError) {
              strapi.log.error(`Error enviando email de confirmación:`, emailError);
            }
          }
        } else if (pagoEstado === "rejected" || pagoEstado === "cancelled" || pagoEstado === "refunded" || pagoEstado === "charged_back" || pagoEstado === "expired") {
          await strapi.service("api::venta.venta").cancelarVenta(ventaId);
        }
      } else {
        strapi.log.info(`Venta ${ventaId} ya fue procesada, estado actual: ${ventaEntity.estado}`);
      }
    } catch (error) {
      strapi.log.error("Error procesando webhook Mercado Pago:", error);
    }

    ctx.send({ received: true });
  },
};
