const BACKEND_URL = import.meta.env.BACKEND_URL ?? 'http://localhost:1337';

export async function getProductoEnums() {
  const res = await fetch(`${BACKEND_URL}/api/productos/enums`);
  if (!res.ok) {
    throw new Error('No se pudieron obtener los enums.');
  }
  const data = await res.json();
  return data?.data ?? {};
}
