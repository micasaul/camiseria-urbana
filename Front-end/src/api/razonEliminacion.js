const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const getAuthHeaders = () => {
  const token = window.localStorage.getItem('strapiToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * @param {{ razon: string, fecha: string, productoDocumentId: string }}
 * @returns {Promise<Object>}
 */
export async function crearRazonEliminacion({ razon, fecha, productoDocumentId }) {
  const res = await fetch(`${BACKEND_URL}/api/razon-eliminacions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      data: {
        razon: String(razon).trim(),
        fecha: fecha || new Date().toISOString().slice(0, 10),
        producto: productoDocumentId
          ? { connect: [{ documentId: String(productoDocumentId) }] }
          : undefined,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('crearRazonEliminacion error:', res.status, text);
    if (res.status === 403) {
    }
    throw new Error('No se pudo guardar la razón de eliminación.');
  }

  return res.json();
}
