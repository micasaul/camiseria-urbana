const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const getAuthHeaders = () => {
  const token = window.localStorage.getItem('strapiToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const MercadoPagoButton = ({ productos, envio, descuentoCupon, cuponId, usuario, direccionId, disabled }) => {
  const handleClick = async () => {
    if (disabled) return;
    
    let ventaId = null;
    
    try {
      const userRes = await fetch(`${BACKEND_URL}/api/users/me`, {
        headers: {
          ...getAuthHeaders()
        }
      });
      
      if (!userRes.ok) {
        throw new Error('No se pudo obtener el usuario.');
      }
      
      const userData = await userRes.json();
      const userDocumentId = userData.documentId;
      
      const carritoRes = await fetch(
        `${BACKEND_URL}/api/carritos?filters[users_permissions_user][documentId][$eq]=${userDocumentId}`,
        {
          headers: {
            ...getAuthHeaders()
          }
        }
      );
      
      if (!carritoRes.ok) {
        throw new Error('No se pudo obtener el carrito.');
      }
      
      const carritoData = await carritoRes.json();
      const carritos = carritoData?.data ?? [];
      
      if (carritos.length === 0) {
        throw new Error('No hay carrito disponible');
      }
      
      const carrito = carritos[0];
      const carritoDocumentId = carrito.documentId ?? carrito.id;
      
      const ventaRes = await fetch(`${BACKEND_URL}/api/ventas/fromCarrito`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          carritoId: carritoDocumentId,
          envio,
          descuentoCupon: descuentoCupon ?? 0,
          cuponId: cuponId || null,
          usuario: { nombre: usuario?.nombre, provincia: usuario?.provincia },
          direccionId: direccionId || null
        }),
      });

      if (!ventaRes.ok) {
        const errorText = await ventaRes.text();
        console.error('Error creando venta:', errorText);
        let mensaje = 'No se pudo crear la venta.';
        try {
          const errJson = JSON.parse(errorText);
          const msg = errJson?.error?.message ?? errJson?.message;
          if (msg) mensaje = msg;
        } catch (_) {}
        throw new Error(mensaje);
      }

      const ventaData = await ventaRes.json();
      const venta = ventaData?.venta ?? ventaData;
      ventaId = venta?.documentId ?? venta?.id;

      if (!ventaId) {
        throw new Error('No se pudo obtener el ID de la venta');
      }

      const response = await fetch(`${BACKEND_URL}/api/pagos/create-preference`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          ventaId: ventaId
        }),
      });

      if (!response.ok) {
        if (ventaId) {
          try {
            await fetch(`${BACKEND_URL}/api/ventas/revertir`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...getAuthHeaders()
              },
              body: JSON.stringify({
                ventaId: ventaId
              })
            });
          } catch (revertError) {
            console.error('Error revirtiendo venta:', revertError);
          }
        }
        
        const errorText = await response.text();
        console.error('Error creando preferencia:', errorText);
        throw new Error('No se pudo crear la preferencia de pago');
      }

      const data = await response.json();
      const redirectUrl = data.init_point || data.initPoint || data.url;

      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        if (ventaId) {
          try {
            await fetch(`${BACKEND_URL}/api/ventas/revertir`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...getAuthHeaders()
              },
              body: JSON.stringify({
                ventaId: ventaId
              })
            });
          } catch (revertError) {
            console.error('Error revirtiendo venta:', revertError);
          }
        }
        console.error('No se recibió URL de redirección:', data);
      }
    } catch (error) {
      console.error("Error creando preferencia de pago:", error);
      if (ventaId) {
        try {
          await fetch(`${BACKEND_URL}/api/ventas/revertir`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...getAuthHeaders()
            },
            body: JSON.stringify({
              ventaId: ventaId
            })
          });
        } catch (revertError) {
          console.error('Error revirtiendo venta:', revertError);
        }
      }
      const mensaje = error?.message || 'Error al procesar el pago. Por favor, intenta nuevamente.';
      alert(mensaje);
    }
  };

  return (
    <button 
      onClick={handleClick} 
      disabled={disabled}
      style={{
        width: '100%',
        height: '45px',
        backgroundColor: disabled ? '#ccc' : '#009ee3',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background-color 0.2s'
      }}
    >
      Continuar con Pago
    </button>
  );
};

export default MercadoPagoButton;
