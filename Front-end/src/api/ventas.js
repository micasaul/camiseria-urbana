const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const getAuthHeaders = () => {
  const token = window.localStorage.getItem('strapiToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function getVentas(page = 1, pageSize = 10) {
  const res = await fetch(
    `${BACKEND_URL}/api/ventas?pagination[page]=${page}&pagination[pageSize]=${pageSize}&sort=createdAt:desc&populate[0]=direccion&populate[1]=detalle_ventas&populate[2]=detalle_ventas.variacion&populate[3]=detalle_ventas.variacion.producto&populate[4]=detalle_ventas.combo&populate[5]=detalle_ventas.combo.imagen`,
    { headers: { ...getAuthHeaders() } }
  );
  if (!res.ok) {
    throw new Error('No se pudieron obtener las ventas.');
  }
  const data = await res.json();
  const items = data?.data ?? [];
  return {
    items: items.map((item) => {
      const attrs = item?.attributes ?? item;
      return {
        ...attrs,
        id: item?.id ?? attrs?.id,
        documentId: item?.documentId ?? attrs?.documentId ?? null
      };
    }),
    pagination: data?.meta?.pagination ?? { page: 1, pageSize, pageCount: 1, total: 0 }
  };
}

export async function getVentasDashboard() {
  const res = await fetch(
    `${BACKEND_URL}/api/ventas?populate[0]=users_permissions_user&populate[1]=detalle_ventas&populate[2]=detalle_ventas.variacion&populate[3]=detalle_ventas.variacion.producto&populate[4]=detalle_ventas.combo&populate[5]=detalle_ventas.combo.imagen`,
    { headers: { ...getAuthHeaders() } }
  );
  if (!res.ok) {
    throw new Error('No se pudieron obtener las ventas.');
  }
  const data = await res.json();
  return data?.data ?? [];
}

export async function getVentaPorId(id) {
  const res = await fetch(
    `${BACKEND_URL}/api/ventas/${id}?populate[0]=users_permissions_user&populate[1]=detalle_ventas&populate[2]=detalle_ventas.variacion&populate[3]=detalle_ventas.variacion.producto&populate[4]=detalle_ventas.variacion.producto.imagen&populate[5]=detalle_ventas.combo&populate[6]=detalle_ventas.combo.imagen`,
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
