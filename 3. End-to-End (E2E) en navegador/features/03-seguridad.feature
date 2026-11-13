# language: es

Característica: Autenticación, autorización y administración de usuarios
  Como usuario del sistema
  Quiero iniciar sesión y acceder solo a las funciones permitidas para mi rol
  Para proteger la información de la farmacia

  Antecedentes:
    Dado que la API está disponible

  Escenario: CP13 - Inicio de sesión de usuario
    Dado que existe un usuario administrador activo con credenciales válidas
    Cuando inicio sesión mediante "POST /api/auth/login"
    Entonces la API responde con HTTP 200
    Y devuelve un token JWT válido y los datos del usuario con rol "Administrador"
    Y el acceso exitoso queda registrado en el historial

  Escenario: CP14 - Control de acceso por roles de usuario
    Dado que existen usuarios activos con roles de administrador, supervisor y vendedor
    Cuando cada usuario inicia sesión correctamente
    Entonces el sistema identifica su rol
    Y el menú "Catálogos" es visible para administrador y supervisor
    Pero el menú "Catálogos" no es visible para vendedor

  Escenario: CP15 - Gestión de usuarios del sistema
    Dado que estoy autenticado como administrador
    Cuando creo un usuario vendedor con nombre, correo y contraseña
    Entonces el sistema confirma la creación del usuario
    Y el usuario aparece en el listado con estado "Activo"
    Y su contraseña no se expone en la consulta de usuario

  Escenario: CP16 - Registro de intentos fallidos de acceso
    Dado que intento iniciar sesión con un correo no registrado y una contraseña incorrecta
    Cuando la API procesa "POST /api/auth/login"
    Entonces responde con HTTP 401 y el error "Credenciales inválidas."
    Y el intento queda registrado con resultado "Fallido"
    Cuando un administrador consulta el historial filtrando por resultado y correo
    Entonces encuentra el registro fallido correspondiente

  Escenario: La API requiere correo y contraseña para iniciar sesión
    Dado que envío una solicitud de inicio de sesión sin correo o sin contraseña
    Cuando consulto "POST /api/auth/login"
    Entonces la API responde con HTTP 400 y el error "Email y contraseña son requeridos."

  Esquema del escenario: La API rechaza credenciales inválidas
    Dado que intento iniciar sesión con <condición>
    Cuando envío "POST /api/auth/login"
    Entonces la API responde con el estado <estado> y el mensaje <mensaje>
    Y registra el intento como fallido

    Ejemplos:
      | condición                              | estado | mensaje                                                        |
      | correo inexistente                     | 401    | "Credenciales inválidas."                                      |
      | contraseña incorrecta                  | 401    | "Credenciales inválidas."                                      |
      | cuenta desactivada                      | 403    | "Tu cuenta está desactivada. Contacta al administrador."       |
      | cuenta sin contraseña configurada      | 401    | "Credenciales inválidas."                                      |

  Escenario: La API confirma el cierre de sesión
    Dado que solicito cerrar la sesión
    Cuando envío "POST /api/auth/logout"
    Entonces la API responde con HTTP 200 y el mensaje "Sesión cerrada correctamente."

  Escenario: La consulta del historial de accesos está protegida
    Dado que no estoy autenticado
    Cuando consulto "GET /api/auth/historial"
    Entonces la API responde con HTTP 401
    Cuando consulto el historial como vendedor
    Entonces la API responde con HTTP 403
    Cuando consulto el historial como administrador
    Entonces la API responde con HTTP 200 y una lista paginada de registros

  Escenario: La API filtra el historial de accesos
    Dado que existen intentos de acceso registrados
    Cuando un administrador filtra "GET /api/auth/historial" por resultado, correo y rango de fechas
    Entonces la respuesta contiene únicamente los registros coincidentes
    Y presenta el total, la página, el límite y los registros

  Escenario: La API permite verificar la disponibilidad de correo
    Dado que estoy autenticado como administrador
    Cuando consulto "GET /api/usuarios/check-email" con un correo ya registrado
    Entonces la API responde con HTTP 200 e indica que no está disponible
    Cuando consulto el mismo endpoint con un correo libre
    Entonces la API indica que está disponible

  Escenario: La API restringe el listado de usuarios por rol
    Dado que no estoy autenticado
    Cuando consulto "GET /api/usuarios"
    Entonces la API responde con HTTP 401
    Cuando consulto el listado como vendedor
    Entonces la API responde con HTTP 403
    Cuando consulto el listado como administrador o supervisor
    Entonces la API responde con HTTP 200 y no incluye hashes de contraseñas

  Escenario: La API crea, consulta, actualiza y elimina usuarios
    Dado que estoy autenticado como administrador
    Cuando creo un usuario mediante "POST /api/usuarios"
    Entonces la API responde con HTTP 201
    Cuando consulto "GET /api/usuarios/{id}"
    Entonces la API responde con HTTP 200 sin exponer el hash de contraseña
    Cuando actualizo el rol y los datos mediante "PUT /api/usuarios/{id}"
    Entonces la API responde con HTTP 200 y conserva los cambios
    Cuando elimino el usuario mediante "DELETE /api/usuarios/{id}"
    Entonces la API responde con HTTP 200

  Escenario: La API rechaza la creación de usuarios con campos obligatorios ausentes o correo duplicado
    Dado que estoy autenticado como administrador
    Cuando envío "POST /api/usuarios" sin nombre, correo, contraseña o rol
    Entonces la API responde con HTTP 400
    Cuando intento crear otro usuario con un correo ya registrado
    Entonces la API responde con HTTP 409

  Escenario: La API valida la actualización de usuarios y evita correos duplicados
    Dado que estoy autenticado como administrador
    Cuando envío "PUT /api/usuarios/{id}" sin nombre, correo o rol
    Entonces la API responde con HTTP 400
    Cuando intento asignar un correo que pertenece a otro usuario
    Entonces la API responde con HTTP 409

  Escenario: La API permite al administrador cambiar la contraseña de otro usuario
    Dado que estoy autenticado como administrador y existe otro usuario
    Cuando actualizo su contraseña mediante "PUT /api/usuarios/{id}/password"
    Entonces la API responde con HTTP 200
    Y el usuario puede iniciar sesión con la contraseña nueva

  Escenario: La API valida permisos y longitud al cambiar una contraseña
    Dado que un usuario intenta cambiar la contraseña de otra cuenta sin ser administrador
    Cuando envía "PUT /api/usuarios/{id}/password"
    Entonces la API responde con HTTP 403
    Cuando el usuario envía una contraseña nueva de menos de 6 caracteres
    Entonces la API responde con HTTP 400

  Escenario: La API impide eliminar la propia cuenta de administrador
    Dado que estoy autenticado como administrador
    Cuando intento eliminar mi propio usuario mediante "DELETE /api/usuarios/{id}"
    Entonces la API responde con HTTP 400
    Y el usuario permanece activo en el sistema

  Escenario: La API informa cuando un usuario no existe
    Dado que estoy autenticado como administrador o supervisor
    Cuando consulto "GET /api/usuarios/{id}" con un identificador inexistente
    Entonces la API responde con HTTP 404 y el error "Usuario no encontrado."

  Escenario: La API de salud confirma que el servicio está disponible
    Dado que el servidor de la API está iniciado
    Cuando consulto "GET /"
    Entonces la API responde con HTTP 200 e informa que la API de Farmacia Sanet está funcionando
