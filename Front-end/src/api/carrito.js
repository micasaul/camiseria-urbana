const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const getAuthHeaders = () => {
  const token = window.localStorage.getItem('strapiToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * @returns {Promise<Object|null>}
 */
export async function obtenerCarritoUsuario() {
  try {
    const userRes = await fetch(`${BACKEND_URL}/api/users/me`, {
      headers: {
        ...getAuthHeaders()
      }
    });
    
    if (!userRes.ok) {
      throw new Error('No se pudo obtener el usuario.');
    }
    
    const userData = await userRes.json();
    const userDocumentId = userData?.documentId ?? userData?.id ?? userData?.attributes?.documentId ?? userData?.attributes?.id;
    
    if (!userDocumentId) {
      throw new Error('No se pudo obtener el identificador del usuario.');
    }
    
    const res = await fetch(
      `${BACKEND_URL}/api/carritos?filters[users_permissions_user][documentId][$eq]=${userDocumentId}&populate[0]=detalle_carritos`,
      {
        headers: {
          ...getAuthHeaders()
        }
      }
    );
    
    if (!res.ok) {
      throw new Error('No se pudo obtener el carrito.');
    }
    
    const data = await res.json();
    const carritos = data?.data ?? [];
    
    if (carritos.length === 0) {
      return await crearCarrito();
    }
    
    const carrito = carritos[0];
    const carritoAttrs = carrito?.attributes ?? carrito;
    return {
      id: carrito.id ?? carritoAttrs?.id,
      documentId: carrito.documentId ?? carritoAttrs?.documentId ?? carrito.id ?? carritoAttrs?.id
    };
  } catch (error) {
    console.error('Error al obtener carrito:', error);
    throw error;
  }
}

/**
 * @returns {Promise<Object>} 
 */
export async function crearCarrito() {
  try {
    const userRes = await fetch(`${BACKEND_URL}/api/users/me`, {
      headers: {
        ...getAuthHeaders()
      }
    });
    
    if (!userRes.ok) {
      throw new Error('No se pudo obtener el usuario.');
    }
    
    const userData = await userRes.json();
    const userDocumentId = userData?.documentId ?? userData?.id ?? userData?.attributes?.documentId ?? userData?.attributes?.id;
    
    if (!userDocumentId) {
      throw new Error('No se pudo obtener el identificador del usuario.');
    }
    
    const res = await fetch(`${BACKEND_URL}/api/carritos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({
        data: {
          fecha: new Date().toISOString(),
          users_permissions_user: { connect: [{ documentId: userDocumentId }] }
        }
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Error response:', errorText);
      throw new Error('No se pudo crear el carrito.');
    }

    const data = await res.json();
    const item = data.data ?? data;
    const attrs = item?.attributes ?? item;
    return {
      id: item.id ?? attrs?.id,
      documentId: item.documentId ?? attrs?.documentId ?? item.id ?? attrs?.id
    };
  } catch (error) {
    console.error('Error al crear carrito:', error);
    throw error;
  }
}

/**
 * @returns {Promise<Array>} 
 */
export async function obtenerCarritoCompleto() {
  try {
    const userRes = await fetch(`${BACKEND_URL}/api/users/me`, {
      headers: {
        ...getAuthHeaders()
      }
    });
    
    if (!userRes.ok) {
      throw new Error('No se pudo obtener el usuario.');
    }
    
    const userData = await userRes.json();
    const userDocumentId = userData?.documentId ?? userData?.id ?? userData?.attributes?.documentId ?? userData?.attributes?.id;
    
    if (!userDocumentId) {
      return [];
    }

    const res = await fetch(
      `${BACKEND_URL}/api/carritos?filters[users_permissions_user][documentId][$eq]=${userDocumentId}&populate[0]=detalle_carritos&populate[1]=detalle_carritos.variacion&populate[2]=detalle_carritos.variacion.imagen&populate[3]=detalle_carritos.variacion.producto&populate[4]=detalle_carritos.combo_variacion&populate[5]=detalle_carritos.combo_variacion.combo&populate[6]=detalle_carritos.combo_variacion.combo.imagen`,
      {
        headers: {
          ...getAuthHeaders()
        }
      }
    );
    
    if (!res.ok) {
      throw new Error('No se pudo obtener el carrito.');
    }
    
    const data = await res.json();
    const carritos = data?.data ?? [];
    
    if (carritos.length === 0) {
      return []
    }
    
    const carrito = carritos[0];
    const carritoAttrs = carrito?.attributes ?? carrito;
    const detalles = carritoAttrs?.detalle_carritos?.data ?? carritoAttrs?.detalle_carritos ?? [];

    const mapped = await Promise.all(detalles.map(async (detalle) => {
      const detalleAttrs = detalle?.attributes ?? detalle;
      const variacion = detalleAttrs?.variacion?.data ?? detalleAttrs?.variacion;
      const variacionAttrs = variacion?.attributes ?? variacion;
      const producto = variacionAttrs?.producto?.data ?? variacionAttrs?.producto;
      const productoAttrs = producto?.attributes ?? producto;
      const comboVariacion = detalleAttrs?.combo_variacion?.data ?? detalleAttrs?.combo_variacion;
      const combo = comboVariacion?.combo?.data ?? comboVariacion?.combo ?? detalleAttrs?.combo?.data ?? detalleAttrs?.combo;
      const comboAttrs = combo?.attributes ?? combo;

      const esCombo = !!(combo ?? comboVariacion);
      const item = esCombo ? comboAttrs : productoAttrs;
      const isProductoInactivo = !esCombo && productoAttrs?.inactivo === true;

      let imagenUrl = '/assets/fallback.jpg'
      if (esCombo && item?.imagen) {
        let url = null
        if (item.imagen?.data?.attributes?.url) {
          url = item.imagen.data.attributes.url
        } else if (item.imagen?.url) {
          url = item.imagen.url
        } else if (typeof item.imagen === 'string') {
          url = item.imagen
        }
        if (url) {
          imagenUrl = url.startsWith('http') ? url : `${BACKEND_URL}${url}`
        }
      } else if (!esCombo && variacionAttrs) {
        const imagenRaw = variacionAttrs?.imagen
        if (imagenRaw) {
          const data = imagenRaw?.data ?? imagenRaw
          const attrs = data?.attributes ?? data ?? {}
          const url = attrs?.url ?? data?.url ?? imagenRaw?.url
          if (url) {
            imagenUrl = url.startsWith('http') ? url : `${BACKEND_URL}${url}`
          }
        }
        if (imagenUrl === '/assets/fallback.jpg') {
          const variacionDocId = variacion?.documentId ?? variacionAttrs?.documentId ?? variacion?.id ?? variacionAttrs?.id
          if (variacionDocId) {
            try {
              const variacionRes = await fetch(`${BACKEND_URL}/api/variaciones/${variacionDocId}?populate=imagen`, {
                headers: { ...getAuthHeaders() }
              })
              if (variacionRes.ok) {
                const variacionData = await variacionRes.json()
                const variacionItem = variacionData?.data ?? variacionData
                const variacionItemAttrs = variacionItem?.attributes ?? variacionItem
                const imagenRaw2 = variacionItemAttrs?.imagen
                if (imagenRaw2) {
                  const data2 = imagenRaw2?.data ?? imagenRaw2
                  const attrs2 = data2?.attributes ?? data2 ?? {}
                  const url2 = attrs2?.url ?? data2?.url ?? imagenRaw2?.url
                  if (url2) {
                    imagenUrl = url2.startsWith('http') ? url2 : `${BACKEND_URL}${url2}`
                  }
                }
              }
            } catch (error) {
              console.error('Error obteniendo imagen de variación:', error)
            }
          }
        }
        if (imagenUrl === '/assets/fallback.jpg') {
          const productoDocId = producto?.documentId ?? productoAttrs?.documentId ?? producto?.id ?? productoAttrs?.id
          const color = variacionAttrs?.color ?? ''
          if (productoDocId) {
            try {
              const params = new URLSearchParams()
              params.append('filters[producto][documentId][$eq]', productoDocId)
              if (color) params.append('filters[color][$eq]', color)
              params.append('populate', 'imagen')
              params.append('pagination[pageSize]', '50')
              const otrasRes = await fetch(`${BACKEND_URL}/api/variaciones?${params.toString()}`, {
                headers: { ...getAuthHeaders() }
              })
              if (otrasRes.ok) {
                const otrasData = await otrasRes.json()
                const otras = otrasData?.data ?? []
                const conImagen = otras.find((v) => {
                  const vAttrs = v?.attributes ?? v
                  const img = vAttrs?.imagen
                  const d = img?.data ?? img
                  const u = d?.attributes?.url ?? d?.url ?? img?.url
                  return !!u
                })
                if (conImagen) {
                  const vAttrs = conImagen?.attributes ?? conImagen
                  const img = vAttrs?.imagen
                  const d = img?.data ?? img
                  const u = d?.attributes?.url ?? d?.url ?? img?.url
                  if (u) imagenUrl = u.startsWith('http') ? u : `${BACKEND_URL}${u}`
                }
              }
            } catch (error) {
              console.error('Error buscando imagen de otra variación:', error)
            }
          }
        }
      }
      if (!imagenUrl.startsWith('http')) {
        imagenUrl = `${BACKEND_URL}${imagenUrl}`
      }

      const precioBase = Number(item?.precio ?? 0)
      const itemId = esCombo
        ? (combo?.documentId ?? comboAttrs?.documentId ?? combo?.id ?? comboAttrs?.id)
        : (producto?.documentId ?? productoAttrs?.documentId ?? producto?.id ?? productoAttrs?.id)

      return {
        id: detalle.id ?? detalleAttrs?.id,
        documentId: detalle.documentId ?? detalleAttrs?.documentId ?? detalle.id ?? detalleAttrs?.id,
        productoId: esCombo ? null : (itemId ?? null),
        comboId: esCombo ? (itemId ?? null) : null,
        imageSrc: imagenUrl,
        name: item?.nombre ?? '',
        size: esCombo ? (comboVariacion?.talle ?? comboVariacion?.attributes?.talle ?? '') : (variacionAttrs?.talle ?? ''),
        color: esCombo ? null : (variacionAttrs?.color ?? ''),
        priceValue: precioBase,
        price: `$${precioBase.toFixed(2)}`,
        quantity: detalleAttrs?.cantidad ?? 1,
        stock: esCombo ? 999 : (variacionAttrs?.stock ?? 0),
        isProductoInactivo
      };
    }));

    const toRemove = mapped.filter((m) => m.isProductoInactivo);
    const valid = mapped.filter((m) => !m.isProductoInactivo);
    await Promise.all(toRemove.map((m) => eliminarDetalleCarrito(m.documentId)));

    return valid.map(({ isProductoInactivo, ...rest }) => rest);
  } catch (error) {
    console.error('Error al obtener carrito completo:', error);
    return [];
  }
}

/**
 * @param {string} 
 * @param {string} 
 * @param {number} 
 * @returns {Promise<Object>} 
 */
export async function agregarAlCarrito(carritoDocumentId, variacionDocumentId, cantidad) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/detalles-carritos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({
        data: {
          cantidad: Number(cantidad) || 1,
          carrito: { connect: [{ documentId: String(carritoDocumentId) }] },
          variacion: { connect: [{ documentId: String(variacionDocumentId) }] }
        }
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Error response:', errorText);
      throw new Error('No se pudo agregar al carrito.');
    }

    window.dispatchEvent(new CustomEvent('cart:updated'));

    return res.json();
  } catch (error) {
    console.error('Error al agregar al carrito:', error);
    throw error;
  }
}

/**
 * @param {string}
 * @param {number}
 * @returns {Promise<Object>}
 */
export async function actualizarDetalleCarrito(detalleDocumentId, cantidad) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/detalles-carritos/${detalleDocumentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({
        data: {
          cantidad: cantidad
        }
      })
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('Error response:', errorText)
      throw new Error('No se pudo actualizar el detalle del carrito.')
    }

    window.dispatchEvent(new CustomEvent('cart:updated'));

    return res.json()
  } catch (error) {
    console.error('Error al actualizar detalle del carrito:', error)
    throw error
  }
}

/**
 * @param {string}
 * @returns {Promise<Object|null>}
 */
export async function eliminarDetalleCarrito(detalleDocumentId) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/detalles-carritos/${detalleDocumentId}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeaders()
      }
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('Error response:', errorText)
      throw new Error('No se pudo eliminar el detalle del carrito.')
    }

    const text = await res.text()
    return text ? JSON.parse(text) : null
  } catch (error) {
    console.error('Error al eliminar detalle del carrito:', error)
    throw error
  }
}

/**
 * @param {string} 
 * @param {string} 
 * @param {number} 
 * @returns {Promise<Object>}
 */
export async function agregarComboAlCarrito(carritoDocumentId, comboVariacionDocumentId, cantidad) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/detalles-carritos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({
        data: {
          cantidad: Number(cantidad) || 1,
          carrito: { connect: [{ documentId: String(carritoDocumentId) }] },
          combo_variacion: { connect: [{ documentId: String(comboVariacionDocumentId) }] }
        }
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Error response:', errorText);
      throw new Error('No se pudo agregar el combo al carrito.');
    }

    window.dispatchEvent(new CustomEvent('cart:updated'));

    return res.json();
  } catch (error) {
    console.error('Error al agregar combo al carrito:', error);
    throw error;
  }
}
