const BACKEND_URL = "http://localhost:1337/api/pagos/create-preference";

const MercadoPagoButton = () => {
  const handleClick = async () => {
    try {
      const response = await fetch(BACKEND_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [
            {
              id: 1,
              nombre: "Producto test",
              precio: 2000,
              cantidad: 1,
            },
          ],
        }),
      });

      const data = await response.json();
      const redirectUrl = data.init_point || data.initPoint || data.url;

      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    } catch (error) {
      console.error("Error creando preferencia de pago:", error);
    }
  };

  return <button onClick={handleClick}>Pagar</button>;
};

export default MercadoPagoButton;
