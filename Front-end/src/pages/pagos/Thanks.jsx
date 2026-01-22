import { Link } from "react-router-dom";
import BlueButton from "../../components/buttons/blue-btn/BlueButton.jsx";

export default function GraciasCompra() {
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

        <Link to="/catalogo">
          <BlueButton>Ver más productos</BlueButton>
        </Link>
      </div>

      {/* Franja inferior */}
      <div className="franja" />
    </section>
  )
}
