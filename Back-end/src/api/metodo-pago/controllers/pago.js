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
            notification_url: `https://bombastic-malaysia-unmitigatedly.ngrok-free.dev/api/pagos/webhook`,
            back_urls: {
              success: `https://camiseria-urbana.vercel.app/pago/success?ventaId=${ventaId}`,
              pending: `https://camiseria-urbana.vercel.app/pago/pending?ventaId=${ventaId}`,
              failure: `https://camiseria-urbana.vercel.app/pago/failure?ventaId=${ventaId}`,
            },
            auto_return: "approved",
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
                    producto: {
                      populate: {
                        imagen: true,
                      },
                    },
                  },
                },
                combo: {
                  populate: {
                    imagen: true,
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
              const backendUrl = strapi.config.get('server.url');
              const detalleVentas = /** @type {any[]} */ (ventaEntity.detalle_ventas || []);
              
              let productosHtml = '';
              let subtotal = 0;
              
              for (const detalle of detalleVentas) {
                const cantidad = Number(detalle?.cantidad ?? 0);
                const precioUnitario = Number(detalle?.precioUnitario ?? 0);
                const subtotalItem = Number(detalle?.subtotal ?? 0);
                subtotal += subtotalItem;
                
                let nombre = 'Producto';
                let imagenUrl = '';
                
                if (detalle?.variacion?.producto) {
                  const producto = detalle.variacion.producto;
                  nombre = producto.nombre || 'Producto';
                  const imagen = producto.imagen;
                  if (imagen) {
                    if (typeof imagen === 'string') {
                      imagenUrl = imagen.startsWith('http') ? imagen : `${backendUrl}${imagen}`;
                    } else if (imagen?.url) {
                      imagenUrl = imagen.url.startsWith('http') ? imagen.url : `${backendUrl}${imagen.url}`;
                    } else if (imagen?.data?.attributes?.url) {
                      const url = imagen.data.attributes.url;
                      imagenUrl = url.startsWith('http') ? url : `${backendUrl}${url}`;
                    }
                  }
                } else if (detalle?.combo) {
                  const combo = detalle.combo;
                  nombre = combo.nombre || 'Combo';
                  const imagen = combo.imagen;
                  if (imagen) {
                    if (typeof imagen === 'string') {
                      imagenUrl = imagen.startsWith('http') ? imagen : `${backendUrl}${imagen}`;
                    } else if (imagen?.url) {
                      imagenUrl = imagen.url.startsWith('http') ? imagen.url : `${backendUrl}${imagen.url}`;
                    } else if (imagen?.data?.attributes?.url) {
                      const url = imagen.data.attributes.url;
                      imagenUrl = url.startsWith('http') ? url : `${backendUrl}${url}`;
                    }
                  }
                }
                
                productosHtml += `
                  <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px; vertical-align: middle;">
                      ${imagenUrl ? `<img src="${imagenUrl}" alt="${nombre}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px;" />` : ''}
                    </td>
                    <td style="padding: 12px; vertical-align: middle;">
                      <strong>${nombre}</strong>
                    </td>
                    <td style="padding: 12px; vertical-align: middle; text-align: center;">
                      ${cantidad}
                    </td>
                  </tr>
                `;
              }
              
              const envio = Number(ventaEntity.envio ?? 0);
              const total = Number(ventaEntity.total ?? 0);
              
              await strapi.plugins.email.services.email.send({
                to: usuario.email,
                subject: "Confirmación de compra - Camisería Urbana",
                text: `Hola ${usuario.email}, Agradecemos tu compra! Te va a llegar en unos días, te dejamos información para estar al día: Orden: ${ventaId}, Número de seguimiento: ${ventaEntity.nroSeguimiento}`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #172A3A;">Hola ${usuario.email},</h2>
                    <p>Agradecemos tu compra! Te va a llegar en unos días, te dejamos información para estar al día:</p>
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                      <p><strong>Orden:</strong> ${ventaId}</p>
                      <p><strong>Número de seguimiento:</strong> ${ventaEntity.nroSeguimiento}</p>
                    </div>
                    
                    <h3 style="color: #172A3A; margin-top: 30px; margin-bottom: 15px;">Productos comprados:</h3>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                      <thead>
                        <tr style="background-color: #f5f5f5; border-bottom: 2px solid #e5e7eb;">
                          <th style="padding: 12px; text-align: left;">Imagen</th>
                          <th style="padding: 12px; text-align: left;">Producto</th>
                          <th style="padding: 12px; text-align: center;">Cantidad</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${productosHtml}
                      </tbody>
                    </table>
                    
                    <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
                      <p style="margin: 8px 0;"><strong>Subtotal:</strong> $${subtotal.toFixed(2)}</p>
                      <p style="margin: 8px 0;"><strong>Envío:</strong> $${envio.toFixed(2)}</p>
                      <p style="margin: 8px 0; font-size: 18px; font-weight: bold; color: #172A3A;"><strong>Total:</strong> $${total.toFixed(2)}</p>
                    </div>
                    
                    <p style="margin-top: 30px;">Gracias por confiar en nosotros.</p>
                    <p>Camisería Urbana.</p>
                  </div>
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
