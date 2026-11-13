# language: es

Característica: Catálogo de productos, alertas y vencimientos
  Como administrador de la farmacia
  Quiero administrar los productos y vigilar sus existencias
  Para mantener un catálogo confiable y prevenir quiebres o ventas de productos vencidos

  Antecedentes:
    Dado que la API está disponible
    Y que estoy autenticado para acceder al inventario

  Escenario: CP7 - Generación de alertas de stock mínimo
    Dado que creo un producto con stock 1 y stock mínimo 5 mediante "POST /api/productos"
    Cuando consulto "GET /api/productos/alertas"
    Entonces encuentro una alerta de tipo "STOCK_BAJO" para ese producto
    Y la alerta informa stock 1 y mínimo 5

  Escenario: CP8 - Control de fechas de vencimiento
    Dado que el catálogo contiene un producto vencido o próximo a vencer
    Cuando abro los detalles de ese producto
    Entonces se muestra el aviso "Producto próximo a vencer o vencido"

  Escenario: CP10 - Administración del catálogo de productos y categorías
    Dado que consulto "GET /api/productos" y recibo el catálogo
    Cuando busco un producto por su identificador
    Entonces solo se muestra el producto coincidente
    Cuando busco un identificador que no existe
    Entonces se muestra "No se encontraron productos"
    Cuando filtro el catálogo por laboratorio
    Entonces solo se muestran los productos de ese laboratorio
    Cuando abro la edición de un producto
    Entonces el formulario presenta el nombre actual del producto

  Escenario: La API exige autenticación para consultar productos
    Dado que no presento un token de autenticación
    Cuando consulto "GET /api/productos"
    Entonces la API responde con HTTP 401

  Escenario: La API lista productos y devuelve el detalle solicitado
    Dado que estoy autenticado y existen productos en el catálogo
    Cuando consulto "GET /api/productos"
    Entonces la API responde con HTTP 200 y una lista de productos
    Cuando consulto "GET /api/productos/{id}" con el identificador de un producto existente
    Entonces la API responde con HTTP 200 y devuelve ese producto

  Escenario: La API informa cuando un producto no existe
    Dado que estoy autenticado
    Cuando consulto "GET /api/productos/{id}" con un identificador inexistente
    Entonces la API responde con HTTP 404 y el error "Producto no encontrado"

  Escenario: La API crea un producto y lo devuelve en consultas posteriores
    Dado que estoy autenticado y envío los datos obligatorios de un producto nuevo
    Cuando creo el producto mediante "POST /api/productos"
    Entonces la API responde con HTTP 201
    Y el producto puede recuperarse mediante "GET /api/productos/{id}"

  Escenario: La API actualiza un producto y reevalúa su nivel de stock
    Dado que existe un producto registrado
    Cuando actualizo sus datos y existencias mediante "PUT /api/productos/{id}"
    Entonces la API responde con HTTP 200
    Y la consulta del producto refleja los datos actualizados
    Y se genera o actualiza la alerta si el stock queda por debajo del mínimo

  Esquema del escenario: El constructor rechaza productos con datos inválidos
    Dado que intento construir un producto
    Cuando omito o invalido el campo <campo>
    Entonces se informa el error de validación correspondiente

    Ejemplos:
      | campo          |
      | identificador  |
      | nombre         |
      | precio positivo|
      | estado válido  |

  Escenario: El constructor de productos conserva valores predeterminados
    Dado que construyo un producto indicando identificador, nombre, precio, stock y estado
    Cuando no especifico descripción ni stock mínimo
    Entonces la descripción queda vacía
    Y el stock mínimo queda en 5

  Escenario: El observador notifica solo cuando el stock está bajo el mínimo
    Dado que un observador está suscrito al control de stock
    Cuando actualizo un producto con stock inferior al mínimo
    Entonces el observador recibe la notificación del producto
    Cuando actualizo el producto con stock igual al mínimo
    Entonces el observador no recibe una nueva notificación

  Escenario: El observador solo admite suscriptores válidos y permite cancelar la suscripción
    Dado que un objeto que no hereda del observador intenta suscribirse
    Entonces la operación informa "Solo se pueden suscribir instancias de Observer."
    Cuando un observador válido se desuscribe
    Y se vuelve a actualizar el stock bajo
    Entonces ese observador ya no recibe notificaciones

  Escenario: El observador registra y limpia las alertas de stock bajo
    Dado que se notifica un producto cuyo stock está por debajo del mínimo
    Cuando consulto las alertas registradas
    Entonces encuentro una alerta con el identificador, nombre, stock y mínimo del producto
    Cuando limpio las alertas
    Entonces la lista de alertas queda vacía

  Escenario: La API elimina un producto
    Dado que existe un producto de prueba
    Cuando lo elimino mediante "DELETE /api/productos/{id}"
    Entonces la API responde con HTTP 200 y confirma la eliminación
