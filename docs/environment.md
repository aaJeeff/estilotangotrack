# Variables de entorno

Copiá `.env.example` a `.env` y completá los valores. `.env` está git-ignorado.
Prisma lee `.env`; Next.js lee `.env` y `.env.local`.

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Conexión **pooled** (PgBouncer, puerto 6543) usada en runtime. |
| `DIRECT_URL` | Conexión **directa** (puerto 5432) usada por Prisma Migrate. |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima (cliente y servidor). |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave service-role. **Solo servidor.** Nunca al cliente. |
| `SEVENTEENTRACK_API_KEY` | API key de 17Track. |
| `SEVENTEENTRACK_WEBHOOK_SECRET` | Secreto para validar el webhook entrante. |
| `RESEND_API_KEY` | API key de Resend. |
| `EMAIL_FROM` | Remitente, ej. `Camisetas <pedidos@tudominio.com>`. |
| `CRON_SECRET` | Secreto que protege `/api/cron/tracking-sync`. |
| `NEXT_PUBLIC_APP_URL` | URL pública de la app (links de email, redirects). |
| `ADMIN_1_EMAIL` / `ADMIN_1_PASSWORD` | Primer administrador (solo para el seed). |
| `ADMIN_2_EMAIL` / `ADMIN_2_PASSWORD` | Segundo administrador (solo para el seed). |

El acceso del lado servidor está centralizado y validado en
[`src/shared/lib/env.ts`](../src/shared/lib/env.ts) (lanza error si falta una variable requerida).
