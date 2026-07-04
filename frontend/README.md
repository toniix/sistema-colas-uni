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

## Cuentas de demostración

La app funciona hoy con **datos simulados en memoria** (no necesita backend).
En la pantalla de login puedes usar:

| Rol           | Correo                  | Contraseña      |
| ------------- | ----------------------- | --------------- |
| Administrador | admin@uni.edu.pe        | admin123        |
| Operador      | operador@uni.edu.pe     | operador123     |
| Estudiante    | estudiante@uni.edu.pe   | estudiante123   |

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
  api/         Capa de datos: mockDb (memoria) + client (funciones async tipo REST)
  auth/        AuthContext (sesión + token) y RequireAuth (rutas por rol)
  components/  UI reutilizable (badges, tarjetas de métrica, cabeceras, marca)
  layout/      AppShell con navegación según rol
  lib/         Constantes de dominio, formato de fechas, exportación, rutas
  pages/       Login, Estudiante, Operador, Pantalla y admin/*
  theme.js     Tema Mantine (teal, sin gradientes)
```

### Conectar al backend real (Spring Boot)

Todas las llamadas viven en `src/api/client.js`. Cada función es `async` y
devuelve datos planos, imitando un cliente REST. Para conectar al API basta
reemplazar el cuerpo de cada función por `fetch(`${API_URL}/...`)` (enviando el
token de `AuthContext` en la cabecera `Authorization`) sin tocar los componentes.
