# language: es

Característica: Gestión y validación de clientes
  Como usuario autorizado
  Quiero registrar, consultar y mantener los datos de los clientes
  Para asociar correctamente las ventas

  Antecedentes:
    Dado que la API está disponible
    Y que estoy autenticado con un rol autorizado para gestionar clientes

  Escenario: CP4 - Registro de datos del cliente
    Dado que ingreso nombre, DNI, teléfono y dirección válidos para un nuevo cliente
    Cuando guardo el formulario de cliente
    Entonces se muestra "Cliente creado correctamente"
    Y el cliente queda guardado con estado "Activo"
    Y puedo encontrarlo en el listado mediante su DNI

  Escenario: CP12 - Validación de campos obligatorios en formularios
    Dado que abro el formulario para registrar un cliente
    Cuando intento guardar el formulario sin nombre
    Entonces se muestra "El nombre es obligatorio"

  Escenario: La API lista clientes y permite consultar un cliente por identificador
    Dado que existe un cliente registrado
    Cuando consulto "GET /api/clientes"
    Entonces la API responde con HTTP 200 y una lista de clientes
    Cuando consulto "GET /api/clientes/{id}"
    Entonces la API responde con HTTP 200 y devuelve los datos del cliente

  Escenario: La API permite a los roles autorizados consultar clientes
    Dado que estoy autenticado como administrador, supervisor o vendedor
    Cuando consulto "GET /api/clientes"
    Entonces la API responde con HTTP 200

  Escenario: La API crea, actualiza y elimina clientes
    Dado que estoy autenticado como administrador o supervisor
    Cuando creo un cliente mediante "POST /api/clientes"
    Entonces la API responde con HTTP 201 y devuelve su identificador
    Cuando actualizo sus datos mediante "PUT /api/clientes/{id}"
    Entonces la API responde con HTTP 200 y confirma la actualización
    Cuando un administrador lo elimina mediante "DELETE /api/clientes/{id}"
    Entonces la API responde con HTTP 200 y confirma la eliminación

  Escenario: La API rechaza un cliente sin nombre
    Dado que estoy autenticado como administrador o supervisor
    Cuando envío "POST /api/clientes" con nombre vacío o compuesto por espacios
    Entonces la API responde con HTTP 400 y el error "El nombre es obligatorio."

  Escenario: La API rechaza un cliente con DNI duplicado
    Dado que existe un cliente registrado con un DNI determinado
    Cuando intento crear otro cliente con el mismo DNI mediante "POST /api/clientes"
    Entonces la API responde con HTTP 409 y el error "Ya existe un cliente con ese DNI."

  Escenario: La API no permite a un vendedor crear o modificar clientes
    Dado que estoy autenticado como vendedor
    Cuando intento crear un cliente mediante "POST /api/clientes"
    Entonces la API responde con HTTP 403
    Cuando intento actualizar un cliente mediante "PUT /api/clientes/{id}"
    Entonces la API responde con HTTP 403

  Escenario: La API permite eliminar clientes solo al administrador
    Dado que estoy autenticado como supervisor o vendedor
    Cuando intento eliminar un cliente mediante "DELETE /api/clientes/{id}"
    Entonces la API responde con HTTP 403

  Escenario: La API informa cuando el cliente solicitado no existe
    Dado que estoy autenticado
    Cuando consulto, actualizo o elimino un identificador de cliente inexistente
    Entonces la API responde con HTTP 404
