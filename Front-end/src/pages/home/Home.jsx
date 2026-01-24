import { Link } from "react-router-dom"
import Destacados from "../../components/cards/Destacados"
import BlueButton from "../../components/buttons/blue-btn/BlueButton"
import "./Home.css"
import heroImg from "../../assets/login-bg.png"

function Home() {
  return (
    <div className="home">

      {/* HERO */}
      <section
        className="home-hero"
        style={{ backgroundImage: `url(${heroImg})` }}
      >
        <div className="home-hero-overlay">
          <div className="home-hero-content">
            <h1>LO CLÁSICO NUNCA PASA DE MODA</h1>

            <p>
              Se reinventa, con nuevas texturas, colores y cortes que se adaptan a
              cada momento del día. Hechas para quienes valoran la comodidad sin
              dejar de lado el estilo.
            </p>

            <Link to="/catalogo">
              <BlueButton>
                Ver más
              </BlueButton>
            </Link>
          </div>
        </div>
      </section>

      {/* DESTACADOS */}
      <section className="home-destacados">
        <h2 className="home-section-title">
          PRODUCTOS DESTACADOS
        </h2>

        <Destacados />
      </section>

    </div>
  )
}

export default Home
