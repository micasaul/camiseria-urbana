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
    const userDocumentId = userData.documentId;
    
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
    const userDocumentId = userData.documentId;
    
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
    const userDocumentId = userData.documentId;
    

    const res = await fetch(
      `${BACKEND_URL}/api/carritos?filters[users_permissions_user][documentId][$eq]=${userDocumentId}&populate[0]=detalle_carritos&populate[1]=detalle_carritos.variacion&populate[2]=detalle_carritos.variacion.producto&populate[3]=detalle_carritos.combo&populate[4]=detalle_carritos.combo.imagen`,
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

    const mapped = detalles.map((detalle) => {
      const detalleAttrs = detalle?.attributes ?? detalle;
      const variacion = detalleAttrs?.variacion?.data ?? detalleAttrs?.variacion;
      const variacionAttrs = variacion?.attributes ?? variacion;
      const producto = variacionAttrs?.producto?.data ?? variacionAttrs?.producto;
      const productoAttrs = producto?.attributes ?? producto;
      const combo = detalleAttrs?.combo?.data ?? detalleAttrs?.combo;
      const comboAttrs = combo?.attributes ?? combo;

      const esCombo = !!combo;
      const item = esCombo ? comboAttrs : productoAttrs;
      const isProductoInactivo = !esCombo && productoAttrs?.inactivo === true;

      let imagenUrl = '/assets/fallback.jpg'
      if (esCombo && item?.imagen) {
        if (item.imagen?.data?.attributes?.url) {
          imagenUrl = item.imagen.data.attributes.url
        } else if (item.imagen?.url) {
          imagenUrl = item.imagen.url
        } else if (typeof item.imagen === 'string') {
          imagenUrl = item.imagen
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
        size: esCombo ? null : (variacionAttrs?.talle ?? ''),
        color: esCombo ? null : (variacionAttrs?.color ?? ''),
        priceValue: precioBase,
        price: `$${precioBase.toFixed(2)}`,
        quantity: detalleAttrs?.cantidad ?? 1,
        stock: esCombo ? 999 : (variacionAttrs?.stock ?? 0),
        isProductoInactivo
      };
    });

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
          cantidad: cantidad,
          carrito: carritoDocumentId,
          variacion: variacionDocumentId
        }
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Error response:', errorText);
      throw new Error('No se pudo agregar al carrito.');
    }

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
export async function agregarComboAlCarrito(carritoDocumentId, comboDocumentId, cantidad) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/detalles-carritos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({
        data: {
          cantidad: cantidad,
          carrito: carritoDocumentId,
          combo: comboDocumentId
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
