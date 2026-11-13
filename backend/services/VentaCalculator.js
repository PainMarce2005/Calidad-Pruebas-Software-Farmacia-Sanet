const TAX_RATE = 0.18;

function roundMoney(amount) {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

function calculateSaleTotals(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('La venta debe tener al menos un producto.');
  }

  const calculatedItems = items.map((item) => {
    const quantity = Number(item.cantidad);
    const unitPrice = Number(item.precio_unit);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error('La cantidad de cada producto debe ser mayor a 0.');
    }
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      throw new Error('El precio unitario de cada producto debe ser un número válido.');
    }

    return {
      ...item,
      cantidad: quantity,
      precio_unit: unitPrice,
      subtotal: roundMoney(quantity * unitPrice),
    };
  });

  const subtotal = roundMoney(
    calculatedItems.reduce((sum, item) => sum + item.subtotal, 0)
  );
  const igv = roundMoney(subtotal * TAX_RATE);

  return {
    items: calculatedItems,
    subtotal,
    igv,
    total: roundMoney(subtotal + igv),
  };
}

module.exports = { TAX_RATE, calculateSaleTotals, roundMoney };
