# ColasUNI — Frontend

Frontend del **Sistema integral de colas, atención y trazabilidad para servicios
universitarios**. SPA en React + Vite con componentes de [Mantine](https://mantine.dev)
(paleta teal institucional, sin gradientes).

## Requisitos

- Node 20+
- pnpm (`corepack prepare pnpm@9.15.0 --activate`)

## Puesta en marcha

```bash
pnpm install
pnpm dev        # servidor de desarrollo (http://localhost:5173)
pnpm build      # build de producción en dist/
pnpm preview    # previsualizar el build
pnpm lint       # eslint
```

## Conexión con el backend

La app consume el **API REST real** (Spring Boot) descrito en
[`api_documentation.md`](./api_documentation.md). La URL base se configura por
variable de entorno en `.env`:

```
VITE_API_URL=http://localhost:8080
```

Autenticación por **JWT con rotación de token**: el `accessToken` se envía en
`Authorization: Bearer …` y ante un `401` el cliente intenta `/api/auth/refresh`
automáticamente y reintenta la petición. El backend debe permitir **CORS** desde
el origen del frontend (`http://localhost:5173`).

## Cuentas de demostración

Se ingresa por **usuario** (no correo). Estas dependen del *seed* del backend:

| Rol           | Usuario      | Contraseña      |
| ------------- | ------------ | --------------- |
| Administrador | admin        | admin123        |
| Operador      | operador     | operador123     |
| Estudiante    | estudiante   | estudiante123   |

## Funcionalidades por rol

- **Estudiante**: pedir turno por servicio (normal/preferente), ver posición en
  cola y estado en vivo, historial.
- **Operador**: atención multiventanilla — llamar siguiente, iniciar atención,
  finalizar con observación, derivar a otro servicio, anular. Un operador solo
  atiende un turno a la vez.
- **Administrador**: reportes y métricas (espera por servicio, atención por
  operador, horas pico, exportación CSV/JSON), servicios, usuarios y auditoría.
- **Pantalla de turnos**: tablero público de turnos llamados / en atención.

Los estados del turno respetan el flujo sin saltos:
`Creado → En cola → Llamado → En atención → Finalizado / Anulado / Derivado`.

## Arquitectura

```
src/
  api/
    http.js      Cliente fetch: JWT, refresh automático en 401, manejo de errores
    client.js    Una función por endpoint del backend (cobertura completa)
    adapters.js  Mapeo DTO del backend (inglés) -> modelo interno (español)
  auth/          AuthContext, tokenStore (localStorage) y RequireAuth (rutas por rol)
  components/    UI reutilizable (badges, tarjetas de métrica, cabeceras, marca)
  layout/        AppShell con navegación según rol
  lib/           Constantes de dominio, formato de fechas, exportación, rutas
  pages/         Login, Estudiante, Operador, Pantalla y admin/*
  theme.js       Tema Mantine (teal, sin gradientes)
```

Si el backend cambia el nombre de un campo, normalmente solo se toca
`src/api/adapters.js`. Los componentes no dependen de los nombres del DTO.

### Notas / endpoints pendientes para el equipo de backend

- **Reportes**: no hay endpoint de métricas agregadas; el frontend las calcula a
  partir de `GET /api/tickets/history`. Un `GET /api/reports` sería más eficiente.
- **Cierre con observación**: `PATCH /api/tickets/{id}/finish` no acepta
  observación, pero el enunciado la pide en el cierre de atención.
- **Auditoría**: la bitácora no incluye `ip/host` ni `resultado (OK/ERROR)` que
  exige el enunciado.
- **Lista de cola del operador**: `GET /api/tickets/queue/{id}` solo da el conteo
  y el turno actual; falta un endpoint para listar los turnos en espera.
- **Turno activo del operador**: no hay endpoint para recuperar el turno en curso
  tras recargar (se infiere del `currentTicket` de la cola).
