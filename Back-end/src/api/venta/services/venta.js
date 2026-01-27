'use strict';

const { createCoreService } = require('@strapi/strapi').factories;
const { errors } = require('@strapi/utils');
const pricingService = require('../../../services/pricing');
const { aNumero } = require('../../../utils/numero');
const { generarNroSeguimiento } = require('../../../utils/seguimiento');

module.exports = createCoreService(
  /** @type {any} */ ('api::venta.venta'),
  ({ strapi }) => ({
    async createFromCarrito(carritoId, opts = {}) {
      if (!carritoId) {
        throw new errors.ValidationError('carritoId requerido');
      }
      const envio = aNumero(opts.envio ?? 0);
      const subtotalFront = opts.subtotal != null ? aNumero(opts.subtotal) : null;
      const usuario = opts.usuario ?? {};
      const direccionId = opts.direccionId && String(opts.direccionId).trim() !== '' ? String(opts.direccionId).trim() : null;

      const resultado = await strapi.db.transaction(async ({ trx }) => {
        const carritos = await strapi.entityService.findMany(
          /** @type {any} */ ('api::carrito.carrito'),
          /** @type {any} */ ({
            filters: { documentId: String(carritoId) },
            limit: 1,
            populate: {
              detalle_carritos: {
                populate: {
                  variacion: {
                    populate: {
                      producto: true,
                    },
                  },
                  combo: true,
                },
              },
              users_permissions_user: true,
            },
            transaction: trx,
          })
        );
        const carrito = carritos[0];

        if (!carrito) {
          throw new errors.NotFoundError('Carrito no encontrado');
        }

        const carritoEntity = /** @type {any} */ (carrito);
        const detalleCarritos = /** @type {any[]} */ (
          carritoEntity.detalle_carritos || []
        );

        if (!detalleCarritos.length) {
          throw new errors.ValidationError('Carrito sin items');
        }

        const itemsVenta = await Promise.all(
          detalleCarritos.map(async (detalle) => {
            const variacion = detalle?.variacion;
            const combo = detalle?.combo;
            const cantidad = aNumero(detalle?.cantidad);

            if (cantidad <= 0) {
              return null;
            }

            // Procesar productos (con variación)
            if (variacion) {
              const variacionId = variacion?.id;
              const variacionDocumentId = variacion?.documentId;

              if (!variacionId || !variacionDocumentId) {
                return null;
              }

              // Verificar stock
              const variacionActual = await strapi.entityService.findOne(
                /** @type {any} */ ('api::variacion.variacion'),
                variacionId,
                /** @type {any} */ ({ transaction: trx })
              );

              if (!variacionActual || aNumero(variacionActual.stock) < cantidad) {
                throw new errors.ValidationError(`Stock insuficiente para la variación ${variacionId}`);
              }

              const precio = await pricingService.getPrecioFinal(variacionId);
              const precioUnitario = aNumero(precio?.precioFinal);
              const descuento = aNumero(precio?.descuento);
              const subtotal = precioUnitario * cantidad;

              return {
                tipo: 'producto',
                variacion: variacionId,
                variacionDocumentId,
                cantidad,
                precioUnitario,
                descuento,
                subtotal,
              };
            }

            // Procesar combos
            if (combo) {
              const comboId = combo?.id;
              const comboDocumentId = combo?.documentId;

              if (!comboId || !comboDocumentId) {
                return null;
              }

              // Verificar que el combo exista
              const comboActual = await strapi.entityService.findOne(
                /** @type {any} */ ('api::combo.combo'),
                comboId,
                /** @type {any} */ ({ transaction: trx })
              );

              if (!comboActual) {
                throw new errors.ValidationError(`Combo ${comboId} no encontrado`);
              }

              // Los combos usan su precio directamente (sin descuentos)
              const precioUnitario = aNumero(comboActual.precio ?? 0);
              const descuento = 0;
              const subtotal = precioUnitario * cantidad;

              return {
                tipo: 'combo',
                combo: comboId,
                comboDocumentId,
                cantidad,
                precioUnitario,
                descuento,
                subtotal,
              };
            }

            return null;
          })
        );

        const itemsValidos = itemsVenta.filter(Boolean);
        const subtotalBack = itemsValidos.reduce(
          (acc, item) => acc + item.subtotal,
          0
        );
        const subtotalVenta = subtotalFront != null ? subtotalFront : subtotalBack;

        const usuarioId = carritoEntity?.users_permissions_user?.id;
        const nroSeguimiento = generarNroSeguimiento(usuario?.provincia);

        // Preparar datos de la venta
        const ventaData = {
          fecha: new Date(),
          estado: 'pendiente',
          total: subtotalVenta,
          envio,
          nroSeguimiento,
          users_permissions_user: usuarioId || null,
        };

        strapi.log.info(`[createFromCarrito] direccionId recibido: ${direccionId}`);
        if (direccionId) {
          const direcciones = await strapi.entityService.findMany(
            /** @type {any} */ ('api::direccion.direccion'),
            /** @type {any} */ ({
              filters: { documentId: String(direccionId) },
              limit: 1,
              transaction: trx,
            })
          );
          
          strapi.log.info(`[createFromCarrito] Direcciones encontradas: ${direcciones.length}`);
          
          if (direcciones.length > 0) {
            const direccionEncontrada = direcciones[0];
            strapi.log.info(`[createFromCarrito] Dirección encontrada con id: ${direccionEncontrada.id}`);
            ventaData.direccion = direccionEncontrada.id || null;
            strapi.log.info(`[createFromCarrito] ventaData.direccion asignado: ${ventaData.direccion}`);
          } else {
            strapi.log.warn(`[createFromCarrito] No se encontró dirección con documentId: ${direccionId}`);
          }
        } else {
          strapi.log.warn(`[createFromCarrito] No se proporcionó direccionId`);
        }

        const venta = await strapi.entityService.create(
          /** @type {any} */ ('api::venta.venta'),
          /** @type {any} */ ({
            data: ventaData,
            status: 'published',
            transaction: trx,
          })
        );

        const items = await Promise.all(
          itemsValidos.map((item) => {
            const dataBase = {
              venta: {
                connect: [{ documentId: venta.documentId }],
              },
              cantidad: item.cantidad,
              precioUnitario: item.precioUnitario,
              descuento: item.descuento,
              subtotal: item.subtotal,
            };

            // Agregar relación según el tipo
            if (item.tipo === 'producto') {
              dataBase.variacion = {
                connect: [{ documentId: item.variacionDocumentId }],
              };
            } else if (item.tipo === 'combo') {
              dataBase.combo = {
                connect: [{ documentId: item.comboDocumentId }],
              };
            }

            return strapi.entityService.create(
              /** @type {any} */ ('api::detalle-venta.detalle-venta'),
              /** @type {any} */ ({
                data: dataBase,
                status: 'published',
                transaction: trx,
              })
            );
          })
        );

        // Verificar stock solo para productos (las variaciones ya se verificaron antes)
        for (const item of itemsValidos) {
          if (item.tipo === 'producto') {
            const variacionActual = await strapi.entityService.findOne(
              /** @type {any} */ ('api::variacion.variacion'),
              item.variacion,
              /** @type {any} */ ({ transaction: trx })
            );

            if (!variacionActual) {
              throw new errors.ValidationError(`Variación ${item.variacion} no encontrada`);
            }

            const stockActual = aNumero(variacionActual.stock);
            if (stockActual < item.cantidad) {
              throw new errors.ValidationError(`Stock insuficiente para la variación ${item.variacion}`);
            }
          }
          // Para combos, no verificamos stock aquí ya que se verifica al agregar al carrito
        }

        for (const detalle of detalleCarritos) {
          await strapi.entityService.delete(
            /** @type {any} */ ('api::detalle-carrito.detalle-carrito'),
            detalle.id,
            /** @type {any} */ ({ transaction: trx })
          );
        }

        const carritoNuevo = await strapi.entityService.create(
          /** @type {any} */ ('api::carrito.carrito'),
          /** @type {any} */ ({
            data: {
              fecha: new Date(),
              users_permissions_user: usuarioId || null,
            },
            transaction: trx,
          })
        );

        return { venta, items, carritoNuevo, carritoOriginal: carrito };
      });

      return resultado;
    },
    async revertirVenta(ventaId) {
      if (!ventaId) {
        throw new errors.ValidationError('ventaId requerido');
      }

      const resultado = await strapi.db.transaction(async ({ trx }) => {
        const ventas = await strapi.entityService.findMany(
          /** @type {any} */ ('api::venta.venta'),
          /** @type {any} */ ({
            filters: { documentId: String(ventaId) },
            limit: 1,
            populate: {
              detalle_ventas: {
                populate: {
                  variacion: true,
                  combo: true,
                },
              },
              users_permissions_user: true,
            },
            transaction: trx,
          })
        );
        const venta = ventas[0];

        if (!venta) {
          throw new errors.NotFoundError('Venta no encontrada');
        }

        const ventaEntity = /** @type {any} */ (venta);
        const detalleVentas = /** @type {any[]} */ (
          ventaEntity.detalle_ventas || []
        );

        const usuarioId = ventaEntity?.users_permissions_user?.id;

        const variacionesRestauradas = [];
        if (ventaEntity.estado === 'En proceso') {
          for (const detalle of detalleVentas) {
            const variacion = detalle?.variacion;
            const cantidad = aNumero(detalle?.cantidad);

            // Solo restaurar stock para productos (variaciones)
            if (variacion && cantidad > 0) {
              const variacionId = variacion?.id;

              if (!variacionId) {
                continue;
              }

              const variacionActual = await strapi.entityService.findOne(
                /** @type {any} */ ('api::variacion.variacion'),
                variacionId,
                /** @type {any} */ ({ transaction: trx })
              );

              if (variacionActual) {
                const variacionActualizada = await strapi.entityService.update(
                  /** @type {any} */ ('api::variacion.variacion'),
                  variacionId,
                  /** @type {any} */ ({
                    data: {
                      stock: aNumero(variacionActual.stock) + cantidad,
                    },
                    transaction: trx,
                  })
                );

                if (variacionActualizada?.documentId) {
                  variacionesRestauradas.push(variacionActualizada.documentId);
                }
              }
            }
            // Para combos, no restauramos stock ya que no tienen variaciones con stock en detalle_venta
          }
        }

        let carrito = null;
        if (usuarioId) {
          const carritos = await strapi.entityService.findMany(
            /** @type {any} */ ('api::carrito.carrito'),
            /** @type {any} */ ({
              filters: { users_permissions_user: { id: usuarioId } },
              limit: 1,
              populate: {
                detalle_carritos: true,
              },
              transaction: trx,
            })
          );
          carrito = carritos[0];
        }

        if (!carrito) {
          carrito = await strapi.entityService.create(
            /** @type {any} */ ('api::carrito.carrito'),
            /** @type {any} */ ({
              data: {
                fecha: new Date(),
                users_permissions_user: usuarioId || null,
              },
              transaction: trx,
            })
          );
        }

        for (const detalle of detalleVentas) {
          const variacion = detalle?.variacion;
          const combo = detalle?.combo;
          const cantidad = aNumero(detalle?.cantidad);

          if (cantidad <= 0) {
            continue;
          }

          const dataBase = {
            carrito: {
              connect: [{ documentId: carrito.documentId }],
            },
            cantidad: cantidad,
          };

          // Agregar relación según el tipo
          if (variacion) {
            const variacionId = variacion?.id;
            const variacionDocumentId = variacion?.documentId;

            if (!variacionId || !variacionDocumentId) {
              continue;
            }

            dataBase.variacion = {
              connect: [{ documentId: variacionDocumentId }],
            };
          } else if (combo) {
            const comboId = combo?.id;
            const comboDocumentId = combo?.documentId;

            if (!comboId || !comboDocumentId) {
              continue;
            }

            dataBase.combo = {
              connect: [{ documentId: comboDocumentId }],
            };
          } else {
            continue;
          }

          await strapi.entityService.create(
            /** @type {any} */ ('api::detalle-carrito.detalle-carrito'),
            /** @type {any} */ ({
              data: dataBase,
              transaction: trx,
            })
          );
        }

        for (const detalle of detalleVentas) {
          await strapi.entityService.delete(
            /** @type {any} */ ('api::detalle-venta.detalle-venta'),
            detalle.id,
            /** @type {any} */ ({ transaction: trx })
          );
        }

        // Eliminar venta
        await strapi.entityService.delete(
          /** @type {any} */ ('api::venta.venta'),
          venta.id,
          /** @type {any} */ ({ transaction: trx })
        );

        return { carrito, variacionesRestauradas };
      });

      if (resultado.variacionesRestauradas && resultado.variacionesRestauradas.length > 0) {
        Promise.all(
          resultado.variacionesRestauradas.map((documentId) =>
            strapi.documents('api::variacion.variacion')
              .publish({ documentId })
              .catch((error) => {
                strapi.log.warn(`Error al publicar variación ${documentId}:`, error);
              })
          )
        ).catch(() => {
        });
      }

      const { variacionesRestauradas, ...resultadoFinal } = resultado;
      return resultadoFinal;
    },
    async confirmarPago(ventaId) {
      if (!ventaId) {
        throw new errors.ValidationError('ventaId requerido');
      }

      const resultado = await strapi.db.transaction(async ({ trx }) => {
        const ventas = await strapi.entityService.findMany(
          /** @type {any} */ ('api::venta.venta'),
          /** @type {any} */ ({
            filters: { documentId: String(ventaId) },
            limit: 1,
            populate: {
              detalle_ventas: {
                populate: {
                  variacion: true,
                  combo: true,
                },
              },
            },
            transaction: trx,
          })
        );
        const venta = ventas[0];

        if (!venta) {
          throw new errors.NotFoundError('Venta no encontrada');
        }

        const ventaEntity = /** @type {any} */ (venta);
        
        // Solo confirmar si está en estado pendiente
        if (ventaEntity.estado !== 'pendiente') {
          strapi.log.warn(`Venta ${ventaId} ya fue procesada, estado actual: ${ventaEntity.estado}`);
          return { venta: ventaEntity, yaProcesada: true };
        }

        const detalleVentas = /** @type {any[]} */ (
          ventaEntity.detalle_ventas || []
        );

        const variacionesActualizadas = [];
        for (const detalle of detalleVentas) {
          const variacion = detalle?.variacion;
          const combo = detalle?.combo;
          const cantidad = aNumero(detalle?.cantidad);

          if (cantidad <= 0) {
            continue;
          }

          // Solo actualizar stock para productos (variaciones)
          if (variacion) {
            const variacionId = variacion?.id;

            if (!variacionId) {
              continue;
            }

            const variacionActual = await strapi.entityService.findOne(
              /** @type {any} */ ('api::variacion.variacion'),
              variacionId,
              /** @type {any} */ ({ transaction: trx })
            );

            if (!variacionActual) {
              continue;
            }

            const stockActual = aNumero(variacionActual.stock);
            const nuevoStock = stockActual - cantidad;

            if (nuevoStock < 0) {
              throw new errors.ValidationError(`Stock insuficiente para la variación ${variacionId}`);
            }

            const variacionActualizada = await strapi.entityService.update(
              /** @type {any} */ ('api::variacion.variacion'),
              variacionId,
              /** @type {any} */ ({
                data: {
                  stock: nuevoStock,
                },
                transaction: trx,
              })
            );

            if (variacionActualizada?.documentId) {
              variacionesActualizadas.push(variacionActualizada.documentId);
            }
          }
          // Para combos, no actualizamos stock aquí ya que no tienen variaciones con stock en detalle_venta
        }

        const ventaActualizada = await strapi.entityService.update(
          /** @type {any} */ ('api::venta.venta'),
          venta.id,
          /** @type {any} */ ({
            data: {
              estado: 'En proceso',
            },
            transaction: trx,
          })
        );

        return { venta: ventaActualizada, variacionesActualizadas };
      });

      if (resultado.variacionesActualizadas && resultado.variacionesActualizadas.length > 0) {
        Promise.all(
          resultado.variacionesActualizadas.map((documentId) =>
            strapi.documents('api::variacion.variacion')
              .publish({ documentId })
              .catch((error) => {
                strapi.log.warn(`Error al publicar variación ${documentId}:`, error);
              })
          )
        ).catch(() => {
        });
      }

      return resultado;
    },
    async cancelarVenta(ventaId) {
      if (!ventaId) {
        throw new errors.ValidationError('ventaId requerido');
      }

      const resultado = await strapi.db.transaction(async ({ trx }) => {
        const ventas = await strapi.entityService.findMany(
          /** @type {any} */ ('api::venta.venta'),
          /** @type {any} */ ({
            filters: { documentId: String(ventaId) },
            limit: 1,
            populate: {
              detalle_ventas: true,
            },
            transaction: trx,
          })
        );
        const venta = ventas[0];

        if (!venta) {
          throw new errors.NotFoundError('Venta no encontrada');
        }

        const ventaEntity = /** @type {any} */ (venta);
        
        // Solo cancelar/eliminar ventas en estado pendiente
        // Si está en "En proceso" significa que ya se pagó y no se puede cancelar
        if (ventaEntity.estado !== 'pendiente') {
          strapi.log.warn(`Venta ${ventaId} no puede ser cancelada, estado actual: ${ventaEntity.estado}`);
          return { venta: ventaEntity, yaProcesada: true };
        }

        const detalleVentas = /** @type {any[]} */ (
          ventaEntity.detalle_ventas || []
        );

        // No necesitamos restaurar stock porque en estado "pendiente" 
        // el stock aún no se ha descontado (solo se descuenta en confirmarPago)

        // Eliminar detalle_ventas primero (por las relaciones)
        for (const detalle of detalleVentas) {
          if (detalle?.id) {
            await strapi.entityService.delete(
              /** @type {any} */ ('api::detalle-venta.detalle-venta'),
              detalle.id,
              /** @type {any} */ ({ transaction: trx })
            );
          }
        }

        // Eliminar la venta
        await strapi.entityService.delete(
          /** @type {any} */ ('api::venta.venta'),
          venta.id,
          /** @type {any} */ ({ transaction: trx })
        );

        return { eliminada: true, ventaId };
      });

      return resultado;
    },
  })
);
