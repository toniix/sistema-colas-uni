# 📘 Documentación de la API REST — Sistema de Gestión de Colas UNI

Este documento contiene la especificación de todos los endpoints disponibles en el backend para ser consumidos por el frontend de React.

---

## 🔑 Información General

- **Base URL**: `http://localhost:8080`
- **Formato de Autenticación**: JWT (Json Web Token) enviado en el encabezado HTTP:
  ```http
  Authorization: Bearer <tu_access_token>
  ```
- **Esquema de Rotación de Tokens**:
  - `accessToken` expira en **15 minutos**.
  - `refreshToken` se usa para solicitar un nuevo token de acceso (expira en **7 días**). Cada refresh rota el token (invalida el actual y entrega uno nuevo).

---

## 🗂️ Modelos y Enumeraciones (Enums)

### `RoleEnum` (Roles de Usuario)
- `ADMIN` (Administrador del sistema)
- `OPERADOR` (Operador asignado a una ventanilla de servicio)
- `ESTUDIANTE` (Estudiante solicitante de turnos)

### `TicketType` (Tipos de Ticket)
- `NORMAL` (Turno ordinario por orden de llegada)
- `PREFERENCIAL` (Turno con prioridad: discapacidad, gestantes, tercera edad, etc.)

### `TicketStatus` (Estados del Turno)
- `CREADO` (Registrado en el sistema)
- `EN_COLA` (Esperando atención en la cola del servicio)
- `LLAMADO` (Llamado en pantalla por el operador de ventanilla)
- `EN_ATENCION` (Siendo atendido actualmente por el operador)
- `FINALIZADO` (Atención completada con éxito)
- `ANULADO` (Cancelado por el estudiante, operador o administrador)
- `DERIVADO` (Transferido a otra línea de servicio)

---

## 1. 🔐 Módulo de Autenticación (`/api/auth`)

### 1.1 Iniciar Sesión (Login)
* **Método**: `POST`
* **Ruta**: `/api/auth/login`
* **Acceso**: Público
* **Cuerpo de Petición (Request Body)**:
  ```json
  {
    "username": "estudiante",
    "password": "estudiante123"
  }
  ```
* **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJlc3R1ZGlhbnRlIi...",
    "refreshToken": "48b6f3c1-39bc-4521-8289-e57a3b4cfa12",
    "tokenType": "Bearer",
    "expiresIn": 900000,
    "user": {
      "id": 3,
      "username": "estudiante",
      "email": "estudiante@uni.edu.pe",
      "fullName": "Carlos Gómez (Estudiante)",
      "role": "ESTUDIANTE"
    }
  }
  ```

### 1.2 Registrar Usuario
* **Método**: `POST`
* **Ruta**: `/api/auth/register`
* **Acceso**: Requiere rol `ADMIN`
* **Cuerpo de Petición (Request Body)**:
  ```json
  {
    "username": "nuevo_operador",
    "password": "password123",
    "email": "nuevo.op@uni.edu.pe",
    "fullName": "Ana Martínez",
    "role": "OPERADOR"
  }
  ```
* **Respuesta Exitosa (211 Created)**:
  ```json
  {
    "id": 4,
    "username": "nuevo_operador",
    "email": "nuevo.op@uni.edu.pe",
    "fullName": "Ana Martínez",
    "role": "OPERADOR",
    "enabled": true,
    "createdAt": "2026-07-04T01:00:00",
    "updatedAt": "2026-07-04T01:00:00"
  }
  ```

### 1.3 Refrescar Token
* **Método**: `POST`
* **Ruta**: `/api/auth/refresh`
* **Acceso**: Público
* **Cuerpo de Petición (Request Body)**:
  ```json
  {
    "refreshToken": "48b6f3c1-39bc-4521-8289-e57a3b4cfa12"
  }
  ```
* **Respuesta Exitosa (200 OK)**:
  Retorna un nuevo token de acceso y un nuevo refresh token (rotación).
  ```json
  {
    "accessToken": "new_access_token_jwt",
    "refreshToken": "new_refresh_token_uuid",
    "tokenType": "Bearer",
    "expiresIn": 900000,
    "user": {
      "id": 3,
      "username": "estudiante",
      "email": "estudiante@uni.edu.pe",
      "fullName": "Carlos Gómez",
      "role": "ESTUDIANTE"
    }
  }
  ```

### 1.4 Cerrar Sesión (Logout)
* **Método**: `POST`
* **Ruta**: `/api/auth/logout`
* **Acceso**: Autenticado
* **Headers**: `Authorization: Bearer <token>`
* **Respuesta Exitosa (204 No Content)**: Sin cuerpo de respuesta. Revoca los tokens del usuario.

---

## 2. 👥 Módulo de Usuarios (`/api/users`)
*Todos los endpoints de este módulo requieren acceso de rol `ADMIN`.*

### 2.1 Obtener todos los usuarios (Paginado)
* **Método**: `GET`
* **Ruta**: `/api/users?page=0&size=10&sort=fullName,asc`
* **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "content": [
      {
        "id": 1,
        "username": "admin",
        "email": "admin@uni.edu.pe",
        "fullName": "Administrador Sistema Colas",
        "role": "ADMIN",
        "enabled": true,
        "createdAt": "2026-07-04T00:50:00",
        "updatedAt": "2026-07-04T00:50:00"
      }
    ],
    "pageable": { ... },
    "totalPages": 1,
    "totalElements": 3,
    "last": true
  }
  ```

### 2.2 Obtener usuario por ID
* **Método**: `GET`
* **Ruta**: `/api/users/{id}`
* **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "id": 2,
    "username": "operador",
    "email": "operador@uni.edu.pe",
    "fullName": "Juan Pérez (Operador MAT)",
    "role": "OPERADOR",
    "enabled": true,
    "createdAt": "2026-07-04T00:50:00",
    "updatedAt": "2026-07-04T00:50:00"
  }
  ```

### 2.3 Actualizar datos de usuario
* **Método**: `PUT`
* **Ruta**: `/api/users/{id}`
* **Cuerpo de Petición (Request Body)**:
  ```json
  {
    "email": "juan.perez_actualizado@uni.edu.pe",
    "fullName": "Juan Pérez Gómez",
    "enabled": true
  }
  ```
* **Respuesta Exitosa (200 OK)**: Retorna el modelo `UserResponse` actualizado.

### 2.4 Habilitar/Deshabilitar usuario
* **Método**: `PATCH`
* **Ruta**: `/api/users/{id}/toggle-status`
* **Respuesta Exitosa (200 OK)**: Retorna el modelo `UserResponse` con el campo `enabled` invertido.

### 2.5 Eliminar usuario
* **Método**: `DELETE`
* **Ruta**: `/api/users/{id}`
* **Respuesta Exitosa (204 No Content)**.

---

## 3. ⚙️ Módulo de Servicios (`/api/services`)

### 3.1 Listar todos los servicios (Paginado)
* **Método**: `GET`
* **Ruta**: `/api/services?page=0&size=10`
* **Acceso**: Autenticado (Cualquier rol)
* **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "content": [
      {
        "id": 1,
        "name": "Matrícula",
        "description": "Trámites de matrícula, rectificación e inscripciones",
        "prefix": "MAT",
        "ticketSequence": 0,
        "active": true,
        "assignedOperator": {
          "id": 2,
          "username": "operador",
          "email": "operador@uni.edu.pe",
          "fullName": "Juan Pérez (Operador MAT)",
          "role": "OPERADOR"
        },
        "createdAt": "2026-07-04T00:50:00"
      }
    ]
  }
  ```

### 3.2 Obtener servicio por ID
* **Método**: `GET`
* **Ruta**: `/api/services/{id}`
* **Acceso**: Autenticado (Cualquier rol)
* **Respuesta Exitosa (200 OK)**: Retorna el objeto del servicio detallado.

### 3.3 Crear un servicio
* **Método**: `POST`
* **Ruta**: `/api/services`
* **Acceso**: Requiere rol `ADMIN`
* **Cuerpo de Petición (Request Body)**:
  ```json
  {
    "name": "Secretaría Académica",
    "description": "Certificados y constancias de estudio",
    "prefix": "SEC",
    "assignedOperatorId": null
  }
  ```
* **Respuesta Exitosa (201 Created)**: Retorna el `ServiceResponse` creado.

### 3.4 Actualizar un servicio
* **Método**: `PUT`
* **Ruta**: `/api/services/{id}`
* **Acceso**: Requiere rol `ADMIN`
* **Cuerpo de Petición (Request Body)**:
  Mismo formato que la creación. Retorna el servicio actualizado.

### 3.5 Asignar operador a un servicio
* **Método**: `PATCH`
* **Ruta**: `/api/services/{id}/assign-operator?operatorId=2`
* **Acceso**: Requiere rol `ADMIN`
* **Parámetros**:
  - `operatorId` (Query Param, opcional): ID del usuario a asignar (debe tener rol `OPERADOR` y no estar asignado a otra ventanilla. Si se omite, se desasigna el operador actual).
* **Respuesta Exitosa (200 OK)**: Retorna el servicio con el operador asignado actualizado.

### 3.6 Eliminar un servicio
* **Método**: `DELETE`
* **Ruta**: `/api/services/{id}`
* **Acceso**: Requiere rol `ADMIN`
* **Respuesta Exitosa (204 No Content)**.

---

## 4. 🎫 Módulo de Tickets / Turnos (`/api/tickets`)

### 4.1 Solicitar un Turno (Crear Ticket)
* **Método**: `POST`
* **Ruta**: `/api/tickets`
* **Acceso**: Requiere rol `ESTUDIANTE`
* **Cuerpo de Petición (Request Body)**:
  ```json
  {
    "serviceId": 1,
    "type": "NORMAL" 
  }
  ```
  *(Nota: `type` puede ser `NORMAL` o `PREFERENCIAL`)*
* **Respuesta Exitosa (201 Created)**:
  ```json
  {
    "id": 1,
    "ticketCode": "MAT-1",
    "status": "EN_COLA",
    "type": "NORMAL",
    "position": 1,
    "student": {
      "id": 3,
      "username": "estudiante",
      "email": "estudiante@uni.edu.pe",
      "fullName": "Carlos Gómez (Estudiante)",
      "role": "ESTUDIANTE"
    },
    "service": {
      "id": 1,
      "name": "Matrícula",
      "description": "Trámites de matrícula...",
      "prefix": "MAT",
      "ticketSequence": 1,
      "active": true,
      "assignedOperator": { ... },
      "createdAt": "2026-07-04T00:50:00"
    },
    "operator": null,
    "derivedToService": null,
    "derivationReason": null,
    "cancellationObservation": null,
    "calledAt": null,
    "attendedAt": null,
    "finishedAt": null,
    "createdAt": "2026-07-04T01:05:00"
  }
  ```

### 4.2 Obtener mi historial de turnos (Estudiante)
* **Método**: `GET`
* **Ruta**: `/api/tickets/my`
* **Acceso**: Requiere rol `ESTUDIANTE`
* **Respuesta Exitosa (200 OK)**: Retorna un listado (JSON Array) de todos los tickets solicitados por el estudiante autenticado.

### 4.3 Llamar al siguiente turno en cola
* **Método**: `POST`
* **Ruta**: `/api/tickets/call-next`
* **Acceso**: Requiere rol `OPERADOR`
* **Descripción**: Busca el siguiente ticket en cola del servicio al que pertenece el operador autenticado. Prioriza turnos con tipo `PREFERENCIAL` antes que `NORMAL` (orden FIFO interno). El ticket cambia su estado a `LLAMADO` y su propiedad `position` pasa a `null`.
* **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "id": 1,
    "ticketCode": "MAT-1",
    "status": "LLAMADO",
    "type": "NORMAL",
    "position": null,
    "student": { ... },
    "service": { ... },
    "operator": {
      "id": 2,
      "username": "operador",
      "fullName": "Juan Pérez (Operador MAT)",
      "role": "OPERADOR"
    },
    "calledAt": "2026-07-04T01:10:00",
    "attendedAt": null,
    "finishedAt": null,
    "createdAt": "2026-07-04T01:05:00"
  }
  ```

### 4.4 Iniciar atención de turno
* **Método**: `PATCH`
* **Ruta**: `/api/tickets/{id}/start`
* **Acceso**: Requiere rol `OPERADOR` (debe ser el operador asignado al ticket)
* **Descripción**: Transiciona el ticket de `LLAMADO` a `EN_ATENCION` registrando el timestamp en `attendedAt`.
* **Respuesta Exitosa (200 OK)**: Retorna el ticket con estado `EN_ATENCION`.

### 4.5 Finalizar atención de turno
* **Método**: `PATCH`
* **Ruta**: `/api/tickets/{id}/finish`
* **Acceso**: Requiere rol `OPERADOR` (debe ser el operador asignado al ticket)
* **Descripción**: Transiciona el ticket de `EN_ATENCION` a `FINALIZADO` registrando el timestamp en `finishedAt`. Esto libera al operador para llamar a su siguiente turno.
* **Respuesta Exitosa (200 OK)**: Retorna el ticket con estado `FINALIZADO`.

### 4.6 Cancelar / Anular Turno
* **Método**: `PATCH`
* **Ruta**: `/api/tickets/{id}/cancel`
* **Acceso**: Autenticado (el estudiante dueño del turno, el operador asignado al servicio o el `ADMIN`)
* **Cuerpo de Petición (Request Body)**:
  ```json
  {
    "observation": "El estudiante tuvo que retirarse por urgencia médica."
  }
  ```
* **Respuesta Exitosa (200 OK)**: Retorna el ticket en estado `ANULADO`. Si el ticket estaba en cola (`EN_COLA`), se reordenan automáticamente las posiciones de los turnos que venían detrás.

### 4.7 Derivar turno a otro servicio
* **Método**: `PATCH`
* **Ruta**: `/api/tickets/{id}/derive`
* **Acceso**: Requiere rol `OPERADOR` (debe ser el operador asignado al ticket)
* **Descripción**: Transiciona el ticket actual a `DERIVADO` y crea **automáticamente** un nuevo ticket en el servicio de destino indicado con el mismo tipo (`NORMAL`/`PREFERENCIAL`) y en estado `EN_COLA` al final de la cola correspondiente.
* **Cuerpo de Petición (Request Body)**:
  ```json
  {
    "targetServiceId": 2,
    "reason": "Requiere regularizar un pago en ventanilla de tesorería primero."
  }
  ```
* **Respuesta Exitosa (200 OK)**: Retorna el ticket original actualizado con estado `DERIVADO` y detalles de la derivación.

### 4.8 Obtener estado en tiempo real de la cola
* **Método**: `GET`
* **Ruta**: `/api/tickets/queue/{serviceId}`
* **Acceso**: Autenticado (Cualquier rol)
* **Descripción**: Devuelve información útil para pantallas o paneles de visualización del servicio (tamaño de la cola, turno actual y tiempo de espera estimado).
* **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "serviceId": 1,
    "serviceName": "Matrícula",
    "servicePrefix": "MAT",
    "currentTicket": {
      "id": 1,
      "ticketCode": "MAT-1",
      "status": "LLAMADO",
      "type": "NORMAL",
      "operator": {
        "fullName": "Juan Pérez (Operador MAT)"
      },
      "calledAt": "2026-07-04T01:10:00"
    },
    "queueSize": 4,
    "estimatedWaitMinutes": 20
  }
  ```

### 4.9 Historial global de turnos (Paginado)
* **Método**: `GET`
* **Ruta**: `/api/tickets/history?page=0&size=20&sort=createdAt,desc`
* **Acceso**: Requiere rol `ADMIN`
* **Respuesta Exitosa (200 OK)**: Retorna el listado completo e histórico de tickets del sistema.

---

## 5. 📊 Módulo de Auditoría (`/api/audit`)
*Todos los endpoints de este módulo requieren acceso de rol `ADMIN`.*

### 5.1 Obtener bitácora de auditoría (Paginada)
* **Método**: `GET`
* **Ruta**: `/api/audit?page=0&size=20&sort=createdAt,desc`
* **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "content": [
      {
        "id": 1,
        "action": "TICKET_STATUS_CHANGED",
        "entityType": "Ticket",
        "entityId": 1,
        "performedBy": {
          "id": 2,
          "username": "operador",
          "fullName": "Juan Pérez (Operador MAT)",
          "role": "OPERADOR"
        },
        "oldValue": "Estado: EN_COLA",
        "newValue": "Estado: LLAMADO",
        "description": "Turno llamado por el operador operador",
        "createdAt": "2026-07-04T01:10:00"
      }
    ]
  }
  ```

---

## ⚠️ Manejo de Errores Comunes

Cuando ocurre un error, la API responde con códigos estándar HTTP y devuelve el siguiente esquema JSON detallado:

### Error de Validación (400 Bad Request)
Ocurre cuando no se envían campos obligatorios o no cumplen el formato:
```json
{
  "timestamp": "2026-07-04T01:15:00",
  "status": 400,
  "error": "Bad Request",
  "validationErrors": {
    "email": "El formato del correo electrónico no es válido.",
    "username": "El nombre de usuario es obligatorio."
  },
  "path": "/api/auth/register"
}
```

### Error de Lógica de Negocio (Ejemplo: 409 Conflict)
Por ejemplo, si un estudiante intenta pedir dos turnos activos para el mismo servicio:
```json
{
  "timestamp": "2026-07-04T01:18:00",
  "status": 409,
  "error": "Conflict",
  "message": "Ya tienes un turno activo en el servicio de Matrícula: MAT-1",
  "path": "/api/tickets"
}
```

### Error de Permisos (403 Forbidden)
Ocurre al intentar acceder a un recurso sin el rol adecuado (ej. un estudiante queriendo ver la auditoría):
```json
{
  "timestamp": "2026-07-04T01:20:00",
  "status": 403,
  "error": "Forbidden",
  "message": "Access Denied",
  "path": "/api/audit"
}
```
