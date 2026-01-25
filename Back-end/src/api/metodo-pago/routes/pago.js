export default {
    routes: [
      {
        method: "POST",
        path: "/pagos/create-preference",
        handler: "pago.createPreference",
        config: { auth: false },
      },
      {
        method: "POST",
        path: "/pagos/webhook",
        handler: "pago.webhook",
        config: { auth: false },
      },
    ],
  };
  