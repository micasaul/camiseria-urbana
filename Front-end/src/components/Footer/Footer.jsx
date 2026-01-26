import { Link } from "react-router-dom"
import { useState } from "react"
import "./Footer.css"
import LinkButton from "../buttons/link-btn/LinkButton.jsx"
import BlueButton from "../buttons/blue-btn/BlueButton.jsx"
import LogoGithub from "../../assets/logo-github.png"

export default function Footer() {
  const [email, setEmail] = useState("")
  const [estado, setEstado] = useState({ tipo: "", mensaje: "" })
  const [enviando, setEnviando] = useState(false)
  const BACKEND_URL = import.meta.env.BACKEND_URL

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
          <a
            href="https://github.com/micasaul/camiseria-urbana"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub Camisería Urbana"
          >
            <img src={LogoGithub} alt="" className="footer-icon-img" />
          </a>
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
