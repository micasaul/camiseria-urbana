const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const getAuthHeaders = () => {
  const token = window.localStorage.getItem('strapiToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function getMarcas() {
  const res = await fetch(`${BACKEND_URL}/api/marcas?pagination[pageSize]=100`);
  if (!res.ok) {
    throw new Error('No se pudieron obtener las marcas.');
  }
  const data = await res.json();
  const items = data?.data ?? [];
  return items
    .map((item) => ({
      id: item?.id ?? item?.documentId ?? '',
      documentId: item?.documentId ?? null,
      nombre: item?.attributes?.nombre ?? item?.nombre ?? ''
    }))
    .filter((item) => item.id);
}

export async function getMarcaById(marcaId) {
  if (!marcaId) return null;
  const res = await fetch(`${BACKEND_URL}/api/marcas/${marcaId}`);
  if (!res.ok) return null;
  const data = await res.json();
  const item = data?.data ?? data;
  const attrs = item?.attributes ?? item;
  return {
    id: item?.id ?? attrs?.id ?? null,
    documentId: item?.documentId ?? attrs?.documentId ?? null,
    nombre: attrs?.nombre ?? item?.nombre ?? ''
  };
}

export async function crearMarca(nombre) {
  const res = await fetch(`${BACKEND_URL}/api/marcas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ data: { nombre } })
  });

  if (!res.ok) {
    throw new Error('No se pudo crear la marca.');
  }

  return res.json();
}
