# Camisetas Tracker

Sistema profesional de gestión, tracking y seguimiento de pedidos para un emprendimiento
de camisetas importadas. Permite a dos administradores gestionar clientes, pedidos, pagos y
seguimiento internacional (17Track), y ofrece a cada cliente un portal premium para seguir el
avance de su pedido en tiempo real.

- **UI:** español · **Código / esquema:** inglés
- **Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS · PostgreSQL (Supabase) ·
  Prisma · Supabase Auth · Resend + React Email · react-globe.gl · Recharts

---

## Arquitectura

Monolito modular con **Clean Architecture** por feature. Cada módulo se organiza en capas:

```
domain          reglas puras y testeables (motor de traducción, cálculos)
application     casos de uso + puertos (TrackingProvider, NotificationSender…)
infrastructure  implementaciones (Prisma, 17Track, Resend, Supabase)
presentation    Server Actions, páginas y componentes (App Router)
```

Regla de dependencia: `presentation → application → domain`. Los adaptadores externos son
intercambiables sin tocar el dominio.

```
src/
├─ app/
│  ├─ (public)/         login, invitación (set-password), reset-password
│  ├─ (admin)/admin/    panel, pedidos, clientes  (rol ADMIN)
│  ├─ (portal)/portal/  mis pedidos, detalle      (rol CLIENT)
│  ├─ auth/callback/    intercambio de código de Supabase
│  └─ api/              webhooks/17track · cron/tracking-sync · health
├─ modules/
│  ├─ auth/            login, invitación, guards
│  ├─ clients/         CRUD + invitación
│  ├─ orders/          pedidos, ítems, pagos (domain/payment, order-number)
│  ├─ tracking/        motor de traducción (domain), 17Track (infra), sync (application)
│  ├─ notifications/   Resend + plantillas React Email + dedupe
│  ├─ audit/           registro de auditoría
│  └─ metrics/         métricas del panel
├─ shared/
│  ├─ ui/              componentes reutilizables
│  ├─ maps/            ShipmentMap (seam), GlobeMap, ArgentinaMap
│  ├─ lib/             prisma, supabase, auth/session, env, format
│  └─ config/          order-status, payment-status, map
└─ middleware.ts       protección de rutas por rol (edge)
```

Documentación detallada en [`docs/`](docs/).

---

## Puesta en marcha (local)

Requisitos: Node 20+ y un proyecto de Supabase.

```bash
# 1. Variables de entorno
cp .env.example .env
#    Completá DATABASE_URL, DIRECT_URL, claves de Supabase, 17Track, Resend, secretos.

# 2. Dependencias
npm install

# 3. Base de datos
npm run db:migrate      # crea las tablas en Supabase (Prisma Migrate)
npm run db:seed         # crea los 2 admins, config de sync y Rosario

# 4. Desarrollo
npm run dev             # http://localhost:3000

# Opcionales
npm run test            # tests del motor de traducción
npm run db:studio       # explorador de datos de Prisma
npm run email:dev       # previsualizar plantillas de email
```

> **Importante:** el seed crea los administradores en Supabase Auth. Cargá
> `ADMIN_1_EMAIL/PASSWORD` y `ADMIN_2_EMAIL/PASSWORD` en `.env` antes de correrlo.

---

## Flujo del negocio

1. El admin crea el cliente → se envía una invitación por email (Resend).
2. El cliente define su contraseña e ingresa al portal.
3. El admin crea el pedido (tras la seña del 50%) con sus camisetas y la seña.
4. Cuando llega el código del proveedor, el admin lo carga → se registra en 17Track.
5. El sistema sincroniza automáticamente (webhook + cron) y traduce los eventos a
   estados comprensibles. El cliente ve mapa, barra de progreso, timeline y ayuda.
6. En 3 hitos clave (Despachado, Llegó a Argentina, Recibido por nosotros) se envía email.
7. El admin marca **Recibido** y luego **Entregado** manualmente.

---

## Scripts

| Script | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | `prisma generate` + build de producción |
| `npm run start` | Servidor de producción |
| `npm run test` | Tests unitarios (Vitest) |
| `npm run db:migrate` | Migración de desarrollo |
| `npm run db:deploy` | Migración en producción |
| `npm run db:seed` | Seed inicial |
| `npm run db:studio` | Prisma Studio |
| `npm run email:dev` | Previsualizar emails |

Ver [`docs/maintenance.md`](docs/maintenance.md) para mantenimiento y operación.
