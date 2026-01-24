import { useState, useEffect } from "react";
import BlueButton from "../../components/buttons/blue-btn/BlueButton.jsx";
import "./Compra.css";

const BACKEND_URL = import.meta.env.BACKEND_URL ?? "http://localhost:1337";

export default function Compra() {
  const [loading, setLoading] = useState(true);
  const [carrito, setCarrito] = useState([]);
  const [productos, setProductos] = useState([]);
  const [usuario, setUsuario] = useState({
    nombre: "",
    telefono: "",
    provincia: "",
    ciudad: "",
    calle: ""
  });

  const provincias = [
    "Buenos Aires", "Catamarca", "Chaco", "Chubut", "Córdoba",
    "Corrientes", "Entre Ríos", "Formosa", "Jujuy", "La Pampa",
    "La Rioja", "Mendoza", "Misiones", "Neuquén", "Río Negro",
    "Salta", "San Juan", "San Luis", "Santa Cruz", "Santa Fe",
    "Santiago del Estero", "Tierra del Fuego", "Tucumán"
  ];

  useEffect(() => {
    async function fetchCarrito() {
      try {
        const res = await fetch(`${BACKEND_URL}/api/carritos?populate=productos.producto`);
        const data = await res.json();

        if (data.data?.length > 0) {
          const carritoData = data.data[0].attributes.productos;
          setCarrito(carritoData);

          const productosEnCarrito = carritoData.map((item) => item.producto);
          setProductos(productosEnCarrito);
        }
      } catch (error) {
        console.error("Error cargando carrito:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchCarrito();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUsuario((prev) => ({ ...prev, [name]: value }));
  };

  const calcularSubtotal = () => {
    return carrito.reduce((acc, item, i) => {
      const precio = item.producto?.precio ?? 0;
      return acc + precio * item.cantidad;
    }, 0);
  };

  if (loading) return <p className="compra-loading">Cargando carrito...</p>;
  if (productos.length === 0) return <p className="compra-empty">No hay productos en el carrito.</p>;

  return (
    <div className="compra-page">
      <div className="compra-container">
        {/* Columna Izquierda: Datos del Usuario */}
        <aside className="compra-usuario">
          <h2>Datos del Usuario</h2>

          <div className="compra-form-group">
            <label>Nombre Completo</label>
            <input
              type="text"
              name="nombre"
              value={usuario.nombre}
              onChange={handleChange}
              placeholder="Ingrese su nombre completo"
            />
          </div>

          <div className="compra-form-group">
            <label>Teléfono</label>
            <input
              type="text"
              name="telefono"
              value={usuario.telefono}
              onChange={handleChange}
              placeholder="Ingrese su teléfono"
            />
          </div>

          <div className="compra-form-group">
            <label>Provincia</label>
            <select name="provincia" value={usuario.provincia} onChange={handleChange}>
              <option value="">Seleccione una provincia</option>
              {provincias.map((prov) => (
                <option key={prov} value={prov}>{prov}</option>
              ))}
            </select>
          </div>

          <div className="compra-form-group">
            <label>Ciudad</label>
            <input
              type="text"
              name="ciudad"
              value={usuario.ciudad}
              onChange={handleChange}
              placeholder="Ingrese su ciudad"
            />
          </div>

          <div className="compra-form-group">
            <label>Calle y Número</label>
            <input
              type="text"
              name="calle"
              value={usuario.calle}
              onChange={handleChange}
              placeholder="Ingrese calle y número"
            />
          </div>

          <BlueButton width="100%" height="45px" onClick={(e) => e.preventDefault()}>
            Continuar con Pago
          </BlueButton>
        </aside>

        {/* Columna Derecha: Resumen de Compra */}
        <main className="compra-resumen">
          <h2>Resumen de Compra</h2>

          {productos.map((producto, index) => {
            const itemCarrito = carrito[index];
            const imagenUrl = producto.imagen?.startsWith("http")
              ? producto.imagen
              : `${BACKEND_URL}${producto.imagen || "/assets/fallback.jpg"}`;

            return (
              <div key={producto.id} className="compra-producto">
                <img src={imagenUrl} alt={producto.nombre} />
                <div className="compra-producto-info">
                  <h3>{producto.nombre}</h3>
                  <p>Talle: {itemCarrito?.talla}</p>
                  <p>Color: {itemCarrito?.color}</p>
                  <p>Cantidad: {itemCarrito?.cantidad}</p>
                  <p>Precio: ${producto.precio?.toFixed(2) || "0.00"}</p>
                </div>
              </div>
            );
          })}

          <div className="compra-total">
            <p>Subtotal: ${calcularSubtotal().toFixed(2)}</p>
            <p>Envío: ENVÍO</p>
            <p className="compra-total-final">TOTAL: ${calcularSubtotal().toFixed(2)}</p>
          </div>
        </main>
      </div>
    </div>
  );
}
