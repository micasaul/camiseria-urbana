
export async function getProductos() {
  try {
    const res = await fetch('http://localhost:1337/api/productos?populate=*');
    if (!res.ok) throw new Error('Error al obtener productos');

    const data = await res.json();
    return data.data.map(item => ({
      id: item.id,
      nombre: item.attributes.nombre,
      precio: item.attributes.precio,
      imagen: item.attributes.imagen?.data?.attributes?.url || '/assets/fallback.jpg'
    }));
  } catch (error) {
    console.error(error);
    return [];
  }
}


