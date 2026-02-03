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

const pathFromMedia = (media) => {
  if (!media) return null;
  if (typeof media === 'string' && media.trim()) return media.startsWith('/') ? media : `/${media}`;
  const attrs = media?.attributes ?? media;
  const url = attrs?.url ?? media?.url ?? media?.data?.attributes?.url ?? media?.data?.url;
  if (!url || typeof url !== 'string') return null;
  return url.startsWith('/') ? url : `/${url}`;
};

const obtenerProductoDesdeDetalle = (detalle) => {
  const attrs = normalizarEntidad(detalle);
  const variacion = attrs?.variacion?.data ?? attrs?.variacion ?? null;
  const variacionAttrs = normalizarEntidad(variacion);
  const producto = variacionAttrs?.producto?.data ?? variacionAttrs?.producto ?? null;
  const productoAttrs = normalizarEntidad(producto);
  const documentId = producto?.documentId ?? productoAttrs?.documentId ?? null;
  const id = producto?.id ?? productoAttrs?.id ?? null;
  const imagenRaw = variacionAttrs?.imagen?.data ?? variacionAttrs?.imagen ?? null;
  const imagen = pathFromMedia(imagenRaw);
  return {
    documentId,
    id,
    nombre: productoAttrs?.nombre ?? 'Producto',
    imagen: imagen || null,
  };
};

const obtenerItemDesdeDetalle = (detalle) => {
  const attrs = normalizarEntidad(detalle);
  const variacion = attrs?.variacion?.data ?? attrs?.variacion ?? null;
  const comboVariacion = attrs?.combo_variacion?.data ?? attrs?.combo_variacion ?? null;
  const combo = comboVariacion ? (comboVariacion.combo?.data ?? comboVariacion.combo ?? null) : null;
  const comboAttrs = normalizarEntidad(combo);

  if (variacion) {
    const producto = obtenerProductoDesdeDetalle(detalle);
    const clave = producto.documentId ?? producto.id ?? producto.nombre;
    if (!clave) return null;
    return { key: `p-${clave}`, nombre: producto.nombre, imagen: producto.imagen };
  }
  if (combo && comboAttrs) {
    const nombre = comboAttrs?.nombre ?? 'Combo';
    const docId = combo?.documentId ?? comboAttrs?.documentId ?? combo?.id ?? comboAttrs?.id;
    if (!docId) return null;
    const imagenRaw = comboAttrs?.imagen?.data ?? comboAttrs?.imagen ?? null;
    const imagen = pathFromMedia(imagenRaw);
    return { key: `c-${docId}`, nombre, imagen: imagen || null };
  }
  return null;
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
      const item = obtenerItemDesdeDetalle(detalle);
      if (!item) return;

      const prev = acumulado.get(item.key) || { nombre: item.nombre, cantidad: 0, imagen: null };
      acumulado.set(item.key, {
        nombre: prev.nombre,
        cantidad: prev.cantidad + cantidad,
        imagen: prev.imagen || item.imagen,
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
