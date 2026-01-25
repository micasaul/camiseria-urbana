import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import BlueButton from "../../components/buttons/blue-btn/BlueButton.jsx";

const BACKEND_URL = import.meta.env.BACKEND_URL ?? "http://localhost:1337";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const ventaId = searchParams.get("ventaId");
  const [venta, setVenta] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("PaymentSuccess montado, ventaId:", ventaId);
    console.log("URL actual:", window.location.href);
    
    if (!ventaId) {
      setLoading(false);
      return;
    }

    const consultarVenta = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/ventas/${ventaId}`);
        if (response.ok) {
          const data = await response.json();
          setVenta(data.data);
        }
      } catch (err) {
        console.error("Error consultando venta:", err);
      } finally {
        setLoading(false);
      }
    };

    consultarVenta();
  }, [ventaId]);

  return (
    <section className="sobre-nosotros">
      {/* Franja superior */}
      <div className="franja" />

      {/* Contenido */}
      <div className="container py-16 px-6">
        <h2 className="mb-6" style={{
          fontFamily: 'Alexandria, sans-serif',
          fontWeight: 600,
          color: '#1B2A41',
          fontSize: '2.5rem',
          textTransform: 'uppercase'
        }}>
          ¡GRACIAS POR TU COMPRA!
        </h2>

        <p style={{
          fontFamily: 'Alexandria, sans-serif',
          fontWeight: 300,
          color: '#555555',
          fontSize: '1rem',
          lineHeight: 1.6,
          marginBottom: '2rem'
        }}>
          Esperamos que disfrutes tu nueva camisa tanto como nosotros disfrutamos cuidar cada detalle para ofrecerte lo mejor.
        </p>

        {loading && ventaId && (
          <p style={{
            fontFamily: 'Alexandria, sans-serif',
            fontWeight: 300,
            color: '#555555',
            fontSize: '0.9rem',
            marginBottom: '1rem'
          }}>
            Cargando información de tu orden...
          </p>
        )}

        {!loading && venta && (
          <div style={{
            fontFamily: 'Alexandria, sans-serif',
            fontWeight: 300,
            color: '#555555',
            fontSize: '0.9rem',
            marginBottom: '2rem',
            padding: '1rem',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px'
          }}>
            {venta.nroSeguimiento && (
              <p style={{ marginBottom: '0.5rem' }}>
                <strong>Número de seguimiento:</strong> {venta.nroSeguimiento}
              </p>
            )}
            {ventaId && (
              <p style={{ marginBottom: '0.5rem' }}>
                <strong>Orden:</strong> {ventaId}
              </p>
            )}
            {venta.estado && (
              <p style={{ marginBottom: '0.5rem' }}>
                <strong>Estado:</strong> {venta.estado}
              </p>
            )}
          </div>
        )}

        <Link to="/catalogo">
          <BlueButton>Ver más productos</BlueButton>
        </Link>
      </div>

      {/* Franja inferior */}
      <div className="franja" />
    </section>
  );
};

export default PaymentSuccess;
