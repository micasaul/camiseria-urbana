import { Link } from "react-router-dom";
import BlueButton from "../../components/buttons/blue-btn/BlueButton.jsx";
import ErrorImage from "../../assets/cerdo-elegante.png"; // pon la imagen aquí

export default function Error() {
  return (
    <section className="error-page">

      {/* Franja superior */}
      <div className="franja-decorativa" />

      {/* Contenedor principal (franja blanca) */}
      <div className="error-container">
        <div className="error-text">
          <h2 className="error-title">Ups, hubo un error</h2>
          <p className="error-subtitle">Pero chill, no fue tu culpa, mejor...</p>
          <Link to="/">
            <BlueButton>Volver a la página principal</BlueButton>
          </Link>
        </div>
        <div className="error-image">
          <img src={ErrorImage} alt="Cerdo elegante" />
        </div>
      </div>

      {/* Franja inferior */}
      <div className="franja-decorativa" />

    </section>
  );
}
