import { Link } from "react-router-dom";
import BlueButton from "../../components/buttons/blue-btn/BlueButton.jsx";

export default function PaymentFailure() {
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
          PAGO CANCELADO
        </h2>

        <p style={{
          fontFamily: 'Alexandria, sans-serif',
          fontWeight: 300,
          color: '#555555',
          fontSize: '1rem',
          lineHeight: 1.6,
          marginBottom: '2rem'
        }}>
          El pago fue cancelado o rechazado. Puedes intentar nuevamente cuando estés listo.
        </p>

        <Link to="/catalogo">
          <BlueButton>Volver al catálogo</BlueButton>
        </Link>
      </div>

      {/* Franja inferior */}
      <div className="franja" />
    </section>
  );
}
