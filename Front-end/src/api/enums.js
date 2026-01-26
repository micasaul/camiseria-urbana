const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export async function getProductoEnums() {
  const res = await fetch(`${BACKEND_URL}/api/productos/enums`);
  if (!res.ok) {
    throw new Error('No se pudieron obtener los enums.');
  }
  const data = await res.json();
  return data?.data ?? {};
}
