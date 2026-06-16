# Integración con Supabase

Supabase provee **PostgreSQL** y **Auth**. La identidad vive en `auth.users`; nuestra tabla
`User` la espeja por `id`. La autorización se aplica en la capa de aplicación (cada Server
Action valida sesión y rol); RLS queda como segunda capa de defensa.

## Configuración inicial

1. Crear un proyecto en [supabase.com](https://supabase.com).
2. **Settings → Database → Connection string**: copiar las cadenas *pooled* (6543) y
   *direct* (5432) a `DATABASE_URL` y `DIRECT_URL`.
3. **Settings → API**: copiar `Project URL`, `anon key` y `service_role key` al `.env`.
4. **Authentication → URL Configuration**: agregar a *Redirect URLs*:
   - `http://localhost:3000/auth/callback`
   - `https://TU_DOMINIO/auth/callback`
5. Ejecutar `npm run db:migrate` y luego `npm run db:seed`.

## Clientes de Supabase en el código

- `shared/lib/supabase/server.ts` — Server Components / Actions (cookies de la sesión).
- `shared/lib/supabase/client.ts` — componentes de navegador.
- `shared/lib/supabase/admin.ts` — service-role (invitaciones, ban). **Solo servidor.**

## Roles

El rol se guarda en `app_metadata.role` del usuario de Supabase (controlado por el servidor),
lo que permite al middleware (edge) enrutar por rol sin tocar la base. Los administradores se
crean con `app_metadata.role = "ADMIN"`; los clientes quedan como `CLIENT` por defecto.

## RLS (opcional, recomendado)

El sistema funciona sin RLS porque Prisma corre del lado servidor con autorización propia.
Como endurecimiento adicional podés activar RLS en las tablas y políticas que limiten a cada
cliente a sus propias filas para cualquier acceso vía el SDK de Supabase.
