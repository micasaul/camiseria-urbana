import client from "../../../../config/mercadopago.js";
import { Preference } from "mercadopago";

export default {
  async createPreference(ctx) {
    try {
      const { items } = ctx.request.body;

      if (!items || !items.length) {
        ctx.throw(400, "No se enviaron items");
      }

      const mpItems = items.map((item) => {
        if (!item.nombre || !item.precio || !item.cantidad) {
          ctx.throw(400, "Item incompleto");
        }

        return {
          title: item.nombre,
          quantity: Number(item.cantidad),
          unit_price: Number(item.precio),
        };
      });

      const preference = new Preference(client);

      const response = await preference.create({
        body: {
          items: mpItems,
          back_urls: {
            success: "http://localhost:5173/payment/success",
            pending: "http://localhost:5173/payment/pending",
            failure: "http://localhost:5173/payment/failure",
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
    console.log("Webhook Mercado Pago:", ctx.request.body);
    ctx.send({ received: true });
  },
};
