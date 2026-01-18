'use strict';

const estaPromoActiva = (promo) => {
  if (!promo) return false;
  const now = new Date();
  const start = promo.fechaInicio ? new Date(promo.fechaInicio) : null;
  const end = promo.fechaFin ? new Date(promo.fechaFin) : null;
  if (!start || !end) return false;
  return start <= now && now <= end;
};

module.exports = {
  estaPromoActiva,
};
