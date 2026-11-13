# language: es

Característica: Gestión de laboratorios y categorías
  Como administrador
  Quiero mantener los catálogos auxiliares del inventario
  Para clasificar los productos y registrar sus laboratorios

  Antecedentes:
    Dado que la API está disponible
    Y que estoy autenticado como administrador

  Escenario: CP11 - Gestión de datos de proveedores y laboratorios
    Dado que abro la sección de catálogos
    Cuando consulto los laboratorios mediante "GET /api/laboratorios"
    Entonces el número y los nombres mostrados coinciden con la respuesta de la API
    Cuando creo un laboratorio
    Entonces el nuevo laboratorio aparece en el catálogo
    Cuando actualizo sus datos
    Entonces el catálogo muestra el nombre y los datos actualizados
    Cuando elimino el laboratorio
    Entonces ya no aparece en el catálogo

  Escenario: La API crea, actualiza y elimina un laboratorio
    Dado que envío los datos de un laboratorio nuevo
    Cuando solicito "POST /api/laboratorios"
    Entonces la API responde con HTTP 201 y devuelve su identificador
    Cuando actualizo el laboratorio mediante "PUT /api/laboratorios/{id}"
    Entonces la API responde con HTTP 200
    Cuando elimino el laboratorio mediante "DELETE /api/laboratorios/{id}"
    Entonces la API responde con HTTP 200

  Escenario: La API lista laboratorios
    Dado que existen laboratorios registrados
    Cuando consulto "GET /api/laboratorios"
    Entonces la API responde con HTTP 200 y una lista ordenada por nombre

  Escenario: La API crea, actualiza y elimina una categoría
    Dado que envío nombre y descripción para una categoría nueva
    Cuando solicito "POST /api/categorias"
    Entonces la API responde con HTTP 201 y devuelve su identificador
    Cuando actualizo sus datos mediante "PUT /api/categorias/{id}"
    Entonces la API responde con HTTP 200
    Cuando elimino la categoría mediante "DELETE /api/categorias/{id}"
    Entonces la API responde con HTTP 200

  Escenario: La API lista categorías
    Dado que existen categorías registradas
    Cuando consulto "GET /api/categorias"
    Entonces la API responde con HTTP 200 y una lista ordenada por nombre

  Escenario: La API exige autenticación para acceder a los catálogos auxiliares
    Dado que no presento un token de autenticación
    Cuando consulto, creo, actualizo o elimino laboratorios o categorías
    Entonces la API responde con HTTP 401
