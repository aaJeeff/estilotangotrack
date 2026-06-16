# Despliegue (Vercel + Supabase)

## Pasos

1. **Supabase**: proyecto creado y migrado (ver [supabase.md](supabase.md)).
2. **Vercel**: importá el repositorio.
3. **Environment Variables**: cargá todas las de [environment.md](environment.md) en Vercel
   (Production y Preview). Asegurate de que `NEXT_PUBLIC_APP_URL` sea el dominio real.
4. **Build**: el comando es `npm run build` (incluye `prisma generate`). Sin configuración extra.
5. **Migraciones**: corré `npm run db:deploy` apuntando a la base de producción (localmente con
   las credenciales de prod, o como paso de CI). No uses `db:push` en producción.
6. **Cron**: `vercel.json` ya define el cron horario hacia `/api/cron/tracking-sync`.
   Vercel inyecta `Authorization: Bearer <CRON_SECRET>` automáticamente si la variable existe.
   > En el plan Hobby los cron corren una vez por día; para mayor frecuencia se requiere Pro.
7. **Webhook 17Track**: configurá la URL del webhook (ver [17track.md](17track.md)).

## Scheduler desacoplado

La lógica de "qué sincronizar" vive en `syncDueShipments()` y `getSyncFrequencies()`. El cron de
Vercel es solo un disparador; migrar a `pg_cron`, una cola o un worker externo no requiere tocar
el dominio — basta invocar el mismo endpoint o caso de uso.

## Verificación post-deploy

- `GET /api/health` → `{ "status": "ok" }`.
- Login con un admin del seed.
- Crear un cliente de prueba y confirmar la llegada del email de invitación.
