import { useState, useEffect } from "react";
import MercadoPagoButton from "../../components/buttons/mp-btn/MercadoPagoButton.jsx";
import { obtenerCarritoCompleto } from "../../api/carrito.js";
import { obtenerDescuentosActivos } from "../../api/promos.js";
import { parsearPrecio, aplicarDescuentos, calcularSubtotal } from "../../utils/carrito.js";
import { obtenerPrecioEnvio } from "../../utils/envio.js";
import "./Compra.css"

const BACKEND_URL = import.meta.env.BACKEND_URL ?? "http://localhost:1337";

export default function Compra() {
  const [loading, setLoading] = useState(true);
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
        const [items, descuentosMap] = await Promise.all([
          obtenerCarritoCompleto(),
          obtenerDescuentosActivos()
        ]);
        
        const productosConDescuento = aplicarDescuentos(items, descuentosMap);
        
        setProductos(productosConDescuento);
      } catch (error) {
        console.error("Error cargando carrito:", error);
        setProductos([]);
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

          <MercadoPagoButton
            productos={productos}
            subtotal={calcularSubtotal(productos)}
            envio={obtenerPrecioEnvio(usuario.provincia)}
            usuario={usuario}
            disabled={!usuario.provincia || !usuario.nombre || !usuario.telefono || !usuario.ciudad || !usuario.calle}
          />
        </aside>

        {/* Columna Derecha: Resumen de Compra */}
        <main className="compra-resumen">
          <h2>Resumen de Compra</h2>

          {productos.map((producto) => {
            return (
              <div key={producto.id ?? producto.documentId} className="compra-producto">
                <img src={producto.imageSrc} alt={producto.name} />
                <div className="compra-producto-info">
                  <h3>{producto.name}</h3>
                  <p>Talle: {producto.size}   -   Color: {producto.color}</p>
                  <p>Cantidad: {producto.quantity}</p>
                  {producto.hasDiscount ? (
                    <p style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span className="compra-precio-original">Precio: {producto.priceOriginal}</span>
                      <span className="compra-precio-final">Precio con descuento: {producto.priceFinal}</span>
                    </p>
                  ) : (
                    <p>Precio: {producto.priceFinal}</p>
                  )}
                </div>
              </div>
            );
          })}

          <div className="compra-total">
            <p>
              <span>Subtotal:</span>
              <span>${calcularSubtotal(productos).toFixed(2)}</span>
            </p>
            <p>
              <span>Envío:</span>
              <span>${obtenerPrecioEnvio(usuario.provincia).toFixed(2)}</span>
            </p>
            <p className="compra-total-final">
              <span>TOTAL:</span>
              <span>${(calcularSubtotal(productos) + obtenerPrecioEnvio(usuario.provincia)).toFixed(2)}</span>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
