# language: es

Característica: Gestión de órdenes de compra
  Como usuario que administra el abastecimiento
  Quiero registrar y mantener órdenes de compra
  Para documentar las compras a proveedores

  Antecedentes:
    Dado que la API está disponible
    Y que estoy autenticado para acceder a las compras

  Escenario: CP9 - Registro de órdenes de compra
    Dado que ingreso proveedor, fecha, total y estado "Pendiente" para una orden nueva
    Cuando registro la orden de compra
    Entonces se muestra "Compra registrada exitosamente"
    Y la orden persiste con el total y estado indicados

  Escenario: La API crea, consulta, actualiza, lista y elimina una orden de compra
    Dado que envío una orden válida con proveedor, fecha, total y productos
    Cuando la creo mediante "POST /api/compras"
    Entonces la API responde con HTTP 201 y devuelve el identificador de la orden
    Cuando consulto "GET /api/compras/{id}"
    Entonces la API responde con HTTP 200 y devuelve los datos de la orden
    Cuando consulto "GET /api/compras"
    Entonces la lista incluye la orden creada
    Cuando actualizo los datos mediante "PUT /api/compras/{id}"
    Entonces la API responde con HTTP 200 y conserva los datos actualizados
    Cuando elimino la orden mediante "DELETE /api/compras/{id}"
    Entonces la API responde con HTTP 200

  Esquema del escenario: El constructor rechaza órdenes de compra inválidas
    Dado que construyo una orden de compra
    Cuando omito o invalido el campo <campo>
    Entonces se informa el error "<error>"

    Ejemplos:
      | campo                    | error                                                    |
      | proveedor                | El campo "proveedor" es obligatorio.                    |
      | total positivo           | El "total" debe ser mayor a 0.                           |
      | productos en formato JSON| El campo "productos" debe ser un JSON válido.            |

  Escenario: El constructor serializa los productos de la orden
    Dado que construyo una orden con productos válidos y estado "pendiente"
    Cuando se genera la orden
    Entonces los productos quedan serializados como JSON
    Y se conservan el proveedor, el total y el estado

  Escenario: La API rechaza una orden con datos inválidos
    Dado que envío una orden sin proveedor o con total no positivo mediante "POST /api/compras"
    Cuando la API valida la solicitud
    Entonces responde con HTTP 400 y un error de validación

  Escenario: La API informa cuando la orden solicitada no existe
    Dado que consulto "GET /api/compras/{id}" con un identificador inexistente
    Cuando la API busca la orden
    Entonces responde con HTTP 404 y el error "Compra no encontrada"
