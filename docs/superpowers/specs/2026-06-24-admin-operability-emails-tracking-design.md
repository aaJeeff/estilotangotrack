# Admin operability for emails and tracking

## Goal

Make the current production blockers visible and recoverable from the admin UI:

- failed status-update emails must be visible;
- failed status-update emails must be retryable after fixing provider configuration;
- tracking provider state and raw recent events must be visible on the order detail page.

This is an operational slice, not a redesign.

## Current findings

- Status-update emails are recorded in `Notification`.
- Existing local notifications are all `FAILED` with `API key is invalid`.
- Failed status notifications are deduped, so fixing `RESEND_API_KEY` does not resend old failed emails automatically.
- Order detail already queries `notifications` and `shipment.events`, but does not render them.
- Client invitation emails are best-effort and only log to console on failure. Because the current `Notification` model requires `orderId`, invitation persistence needs a separate future schema decision and is out of this slice.

## Scope

### In scope

1. Add a server action that retries a failed order status email:
   - admin-only;
   - only for `Notification.status === FAILED`;
   - only for email notifications with a valid `triggerStatus`;
   - sends the same status update email again;
   - updates the existing notification to `SENT` or keeps it `FAILED` with the new error.

2. Render notification history on `/admin/orders/[id]`:
   - template/status;
   - notification state;
   - created/sent date;
   - error message;
   - retry button for failed email notifications.

3. Render tracking diagnostics on `/admin/orders/[id]`:
   - provider registration state;
   - sync zone;
   - last/next sync;
   - recent raw provider events already stored.

4. Update docs to explain retry behavior and the current 17Track readiness checklist.

### Out of scope

- Adding a new table for client invitation email audit.
- Sending real emails without a valid `RESEND_API_KEY`.
- Registering or syncing a real tracking number without a valid 17Track key.
- Changing customer-facing tracking UI.

## Error handling

The retry action writes the latest provider error back to the same `Notification.error` field. It does not create duplicate notification rows and does not bypass admin authorization.

## Validation

Run:

- TypeScript check.
- Lint.
- Unit tests.
- Build.
- Local HTTP smoke checks for health and protected API routes.
