'use strict';

const aNumero = (value) => {
  if (value === null || value === undefined) return 0;
  const numberValue = Number(value);
  return Number.isNaN(numberValue) ? 0 : numberValue;
};

module.exports = {
  aNumero,
};
