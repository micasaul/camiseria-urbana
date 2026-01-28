const normalizarEntidad = (item) => item?.attributes ?? item ?? {};

const obtenerDetalleVentas = (venta) => {
  const attrs = normalizarEntidad(venta);
  const raw = attrs?.detalle_ventas?.data ?? attrs?.detalle_ventas ?? [];
  return Array.isArray(raw) ? raw : [];
};

const obtenerCliente = (venta) => {
  const attrs = normalizarEntidad(venta);
  const usuario = attrs?.users_permissions_user?.data ?? attrs?.users_permissions_user ?? null;
  const userAttrs = normalizarEntidad(usuario);
  return {
    id: usuario?.id ?? userAttrs?.id ?? userAttrs?.documentId ?? null,
    label: userAttrs?.email ?? userAttrs?.username ?? 'Invitado',
  };
};

const obtenerProductoDesdeDetalle = (detalle) => {
  const attrs = normalizarEntidad(detalle);
  const variacion = attrs?.variacion?.data ?? attrs?.variacion ?? null;
  const variacionAttrs = normalizarEntidad(variacion);
  const producto = variacionAttrs?.producto?.data ?? variacionAttrs?.producto ?? null;
  const productoAttrs = normalizarEntidad(producto);
  const documentId = producto?.documentId ?? productoAttrs?.documentId ?? null;
  const id = producto?.id ?? productoAttrs?.id ?? null;
  return {
    documentId,
    id,
    nombre: productoAttrs?.nombre ?? 'Producto',
  };
};

export const calcularTopProductos = (ventas) => {
  const acumulado = new Map();
  const ventasValidas = (ventas ?? []).filter((venta) => {
    const attrs = normalizarEntidad(venta);
    const estado = attrs?.estado ?? '';
    return estado !== 'pendiente' && estado !== '';
  });

  ventasValidas.forEach((venta) => {
    const detalles = obtenerDetalleVentas(venta);
    detalles.forEach((detalle) => {
      const attrs = normalizarEntidad(detalle);
      const cantidad = Number(attrs?.cantidad ?? 0);
      const producto = obtenerProductoDesdeDetalle(detalle);
      
      const clave = producto.documentId ?? producto.id ?? producto.nombre;
      if (!clave) return;
      
      const prev = acumulado.get(clave) || { nombre: producto.nombre, cantidad: 0 };
      acumulado.set(clave, {
        nombre: prev.nombre,
        cantidad: prev.cantidad + cantidad,
      });
    });
  });

  return Array.from(acumulado.values())
    .sort((a, b) => b.cantidad - a.cantidad);
};

export const calcularTopClientes = (ventas) => {
  const acumulado = new Map();
  (ventas ?? []).forEach((venta) => {
    const attrs = normalizarEntidad(venta);
    const total = Number(attrs?.total ?? 0);
    const cliente = obtenerCliente(venta);
    const clave = cliente.id ?? cliente.label;
    if (!clave) return;
    const prev = acumulado.get(clave) || { cliente: cliente.label, total: 0 };
    acumulado.set(clave, {
      cliente: prev.cliente,
      total: prev.total + total,
    });
  });

  return Array.from(acumulado.values())
    .sort((a, b) => b.total - a.total);
};
