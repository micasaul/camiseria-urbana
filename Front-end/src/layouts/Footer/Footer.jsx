import { Link } from "react-router-dom"
import "./Footer.css"
import LinkButton from "../../components/buttons/link-btn/LinkButton.jsx"
import BlueButton from "../../components/buttons/blue-btn/BlueButton.jsx"

export default function Footer() {
  return (
    <footer className="footer">

      {/* IZQUIERDA */}
      <div className="footer-left">
        <h3 className="footer-title">SUSCRIBITE</h3>

        <div className="footer-newsletter">
          <input
            type="email"
            placeholder="Enter your email address"
            className="footer-input"
          />

          <BlueButton width="220px" height="36px" fontSize="15px">
            Enviar
          </BlueButton>
        </div>

        <div className="footer-icons">
          {/* redes → después se linkean si querés */}
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path fill="currentColor" fillRule="evenodd"
              d="M3 8a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8Z"/>
          </svg>

          <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd"
              d="M12.006 2a9.847 9.847 0 0 0-6.484 2.44A10.32 10.32 0 0 0 2.129 10.61a10.48 10.48 0 0 0 1.317 6.955 10.045 10.045 0 0 0 5.4 4.418"/>
          </svg>
        </div>
      </div>

      {/* DERECHA */}
      <div className="footer-right">
        <p>
          <strong>ATENCIÓN AL CLIENTE</strong><br />
          camiseriaurbana@gmail.com
        </p>

        <Link to="/faq">
          <LinkButton>
            <strong>PREGUNTAS FRECUENTES</strong>
          </LinkButton>
        </Link>

        <Link to="/sobre-nosotros">
          <LinkButton>
            <strong>SOBRE NOSOTROS</strong>
          </LinkButton>
        </Link>
      </div>

    </footer>
  )
}
