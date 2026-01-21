import { Link } from "react-router-dom"
import { useState } from "react"
import "./Footer.css"
import LinkButton from "../buttons/link-btn/LinkButton.jsx"
import BlueButton from "../buttons/blue-btn/BlueButton.jsx"

export default function Footer() {
  const [email, setEmail] = useState("")
  const [estado, setEstado] = useState({ tipo: "", mensaje: "" })
  const [enviando, setEnviando] = useState(false)
  const BACKEND_URL = import.meta.env.BACKEND_URL ?? "http://localhost:1337"

  const manejarSuscripcion = async (event) => {
    event.preventDefault()
    const emailLimpio = email.trim().toLowerCase()

    if (!emailLimpio) {
      setEstado({ tipo: "error", mensaje: "Ingresá un email válido." })
      return
    }

    try {
      setEnviando(true)
      setEstado({ tipo: "", mensaje: "" })
      const respuesta = await fetch(`${BACKEND_URL}/api/newsletters/suscribir`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailLimpio }),
      })
      const data = await respuesta.json().catch(() => ({}))

      if (!respuesta.ok) {
        const mensaje = data?.error?.message ?? "No se pudo suscribir el email."
        setEstado({ tipo: "error", mensaje })
        return
      }

      setEstado({
        tipo: "ok",
        mensaje: data?.yaSuscripto
          ? "Ese email ya estaba suscripto."
          : "¡Listo! Te vamos a avisar con las promos.",
      })
      setEmail("")
    } catch {
      setEstado({ tipo: "error", mensaje: "Ocurrió un error. Intentá de nuevo." })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <footer className="footer">

      {/* IZQUIERDA */}
      <div className="footer-left">
        <h3 className="footer-title">SUSCRIBITE</h3>

        <form className="footer-newsletter" onSubmit={manejarSuscripcion}>
          <input
            type="email"
            placeholder="Ingresá tu email"
            className="footer-input"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <BlueButton width="220px" height="36px" fontSize="15px" type="submit" disabled={enviando}>
            Enviar
          </BlueButton>
        </form>

        {estado.mensaje ? (
          <p className={`footer-newsletter-message ${estado.tipo}`}>
            {estado.mensaje}
          </p>
        ) : null}

        <div className="footer-icons">
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
