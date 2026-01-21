

// porfa no modificar, no termine jasjja

import { useState, useEffect } from 'react';
import BlueButton from './Buttons/BlueButton';
import { getProductos } from '../../api/productos';

export default function Destacados() {
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    async function fetchProductos() {
      const data = await getProductos();
      setProductos(data);
    }
    fetchProductos();
  }, []);

  return (
    <section className="bg-[#EFF5E6] py-16">
      <h2 className="text-[#1B2A41] font-bold text-3xl text-center uppercase mb-12">
        PRODUCTOS DESTACADOS
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl mx-auto px-4">
        {productos.map(prod => (
          <div key={prod.id} className="bg-white rounded-3xl overflow-hidden shadow">
            <img
              src={`http://localhost:1337${prod.imagen}`}
              alt={prod.nombre}
              className="w-full h-64 object-cover"
            />
            <div className="p-4">
              <h3 className="font-bold text-lg">{prod.nombre}</h3>
              <p className="text-gray-600 mt-1">${prod.precio}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-12">
        <BlueButton texto="Ver más productos" ruta="/catalogo" />
      </div>
    </section>
  );
}
