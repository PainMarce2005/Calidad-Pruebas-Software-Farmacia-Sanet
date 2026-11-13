# language: es

Característica: Ventas, comprobantes y control de existencias
  Como usuario autorizado de la farmacia
  Quiero registrar y consultar ventas
  Para cobrar correctamente y mantener actualizado el inventario

  Antecedentes:
    Dado que la API está disponible
    Y que existe un usuario autenticado con un rol autorizado

  Escenario: CP1 - Registro de venta de productos
    Dado que existe un cliente activo
    Y que existe un producto no vencido con existencias
    Cuando registro una venta con una unidad del producto, tipo de comprobante "Boleta" y pago en "Efectivo"
    Entonces la venta se registra correctamente con respuesta HTTP 201
    Y la venta consultada contiene el cliente y el detalle del producto

  Escenario: CP2 - Cálculo automático de totales e impuestos
    Dado que agrego dos unidades de un producto de precio 10.25 y una unidad de un producto de precio 4.50
    Cuando se calculan los importes de la venta
    Entonces los subtotales de los productos son 20.50 y 4.50
    Y el subtotal de la venta es 25.00
    Y el IGV del 18 por ciento es 4.50
    Y el total de la venta es 29.50

  Escenario: CP3 - Selección de tipo de comprobante de pago
    Dado que tengo un producto y un cliente seleccionados para la venta
    Cuando selecciono el tipo de comprobante "Factura"
    Y abro la confirmación de la venta
    Entonces la confirmación muestra el comprobante "Factura"

  Escenario: CP5 - Actualización de stock post-venta
    Dado que un producto no vencido tiene existencias disponibles
    Cuando registro una venta de una unidad de ese producto
    Entonces el stock del producto disminuye en una unidad
    Cuando anulo la venta como administrador mediante "PUT /api/ventas/{id}/anular"
    Entonces el stock vuelve a su cantidad inicial

  Escenario: CP6 - Validación de stock insuficiente
    Dado que un producto tiene existencias disponibles
    Cuando intento registrar mediante "POST /api/ventas" una cantidad mayor que el stock disponible
    Entonces la API responde con HTTP 400 y un error que indica "Stock insuficiente"
    Y el stock del producto permanece sin cambios

  Escenario: La API lista las ventas solo para roles autorizados
    Dado que estoy autenticado como administrador
    Cuando consulto "GET /api/ventas"
    Entonces la API responde con HTTP 200 y una lista de ventas
    Cuando consulto "GET /api/ventas" como vendedor
    Entonces la API responde con HTTP 403

  Escenario: La API devuelve el detalle y el comprobante PDF de una venta
    Dado que existe una venta registrada
    Cuando consulto "GET /api/ventas/{id}"
    Entonces la API responde con HTTP 200 e incluye los productos vendidos
    Cuando solicito "GET /api/ventas/{id}/pdf"
    Entonces la API responde con HTTP 200 y contenido de tipo "application/pdf"

  Escenario: La API rechaza una venta sin productos
    Dado que estoy autenticado con un rol autorizado para vender
    Cuando envío "POST /api/ventas" con una lista de productos vacía
    Entonces la API responde con HTTP 400 y el error "La venta debe tener al menos un producto."

  Esquema del escenario: La API valida los datos de cada venta
    Dado que estoy autenticado con un rol autorizado para vender
    Cuando envío "POST /api/ventas" con <campo> igual a <valor>
    Entonces la API responde con HTTP 400 y un error de validación

    Ejemplos:
      | campo               | valor                 |
      | tipo_doc            | "Recibo"              |
      | metodo_pago         | "Cheque"              |
      | cantidad de un ítem | 0                     |
      | precio_unit de ítem | -1                    |

  Escenario: La API impide vender productos vencidos
    Dado que existe un producto cuyo estado es "vencido"
    Cuando intento registrar una venta de ese producto mediante "POST /api/ventas"
    Entonces la API responde con HTTP 400 e indica que el producto está vencido
    Y no se descuenta stock

  Escenario: La API rechaza una venta de un producto inexistente
    Dado que estoy autenticado con un rol autorizado para vender
    Cuando envío "POST /api/ventas" con un identificador de producto inexistente
    Entonces la API responde con HTTP 400 e indica que el producto no fue encontrado

  Escenario: La API permite anular una venta solo al administrador
    Dado que existe una venta no anulada
    Cuando un administrador solicita "PUT /api/ventas/{id}/anular"
    Entonces la API responde con HTTP 200 y restaura el stock vendido
    Cuando un vendedor intenta anular una venta
    Entonces la API responde con HTTP 403

  Escenario: La API no permite anular una venta inexistente o ya anulada
    Dado que intento anular una venta inexistente o que ya tiene estado "Anulada"
    Cuando un administrador solicita "PUT /api/ventas/{id}/anular"
    Entonces la API responde con HTTP 400 y describe el motivo del rechazo

  Escenario: El cálculo de importes rechaza ventas vacías, cantidades y precios inválidos
    Dado que calculo los importes de una venta sin productos
    Entonces se informa "La venta debe tener al menos un producto."
    Cuando calculo una venta con cantidad cero
    Entonces se informa "La cantidad de cada producto debe ser mayor a 0."
    Cuando calculo una venta con precio unitario negativo
    Entonces se informa "El precio unitario de cada producto debe ser un número válido."
