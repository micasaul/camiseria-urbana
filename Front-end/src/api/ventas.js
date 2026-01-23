const BACKEND_URL = import.meta.env.BACKEND_URL ?? 'http://localhost:1337';

const getAuthHeaders = () => {
  const token = window.localStorage.getItem('strapiToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function getVentas() {
  const res = await fetch(
    `${BACKEND_URL}/api/ventas?populate[0]=users_permissions_user&populate[1]=detalle_ventas`,
    { headers: { ...getAuthHeaders() } }
  );
  if (!res.ok) {
    throw new Error('No se pudieron obtener las ventas.');
  }
  const data = await res.json();
  const items = data?.data ?? [];
  return items.map((item) => {
    const attrs = item?.attributes ?? item;
    return {
      ...attrs,
      id: item?.id ?? attrs?.id,
      documentId: item?.documentId ?? attrs?.documentId ?? null
    };
  });
}

export async function getVentaPorId(id) {
  const res = await fetch(
    `${BACKEND_URL}/api/ventas/${id}?populate[0]=users_permissions_user&populate[1]=detalle_ventas&populate[2]=detalle_ventas.variacion&populate[3]=detalle_ventas.variacion.producto`,
    { headers: { ...getAuthHeaders() } }
  );
  if (!res.ok) {
    throw new Error('No se pudo obtener el detalle de la venta.');
  }
  return res.json();
}

export async function actualizarEstadoVenta(id, estado) {
  const res = await fetch(`${BACKEND_URL}/api/ventas/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ data: { estado } })
  });

  if (!res.ok) {
    throw new Error('No se pudo actualizar el estado.');
  }

  return res.json();
}
