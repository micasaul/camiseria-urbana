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

export async function getVentasUsuario(page = 1, pageSize = 100) {
  const token = window.localStorage.getItem('strapiToken');
  if (!token) {
    throw new Error('No hay token de sesión');
  }

  const userRes = await fetch(
    `${BACKEND_URL}/api/users/me?populate[0]=ventas&populate[1]=ventas.direccion&populate[2]=ventas.detalle_ventas&populate[3]=ventas.detalle_ventas.variacion&populate[4]=ventas.detalle_ventas.variacion.producto&populate[5]=ventas.detalle_ventas.combo&populate[6]=ventas.detalle_ventas.combo.imagen`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  
  if (!userRes.ok) {
    throw new Error('No se pudieron obtener las ventas del usuario.');
  }
  
  const userData = await userRes.json();
  const ventasRaw = userData?.ventas?.data ?? userData?.ventas ?? [];
  
  const items = ventasRaw
    .map((item) => {
      const attrs = item?.attributes ?? item;
      return {
        ...attrs,
        id: item?.id ?? attrs?.id,
        documentId: item?.documentId ?? attrs?.documentId ?? null
      };
    })
    .sort((a, b) => {
      const fechaA = a.fecha ? new Date(a.fecha).getTime() : 0;
      const fechaB = b.fecha ? new Date(b.fecha).getTime() : 0;
      return fechaB - fechaA; // Descendente
    });
  
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedItems = items.slice(startIndex, endIndex);
  const total = items.length;
  const pageCount = Math.ceil(total / pageSize);
  
  return {
    items: paginatedItems,
    pagination: { page, pageSize, pageCount, total }
  };
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
