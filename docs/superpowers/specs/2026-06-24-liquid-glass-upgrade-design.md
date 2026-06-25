# Liquid Glass upgrade

## Goal

Improve the customer-facing Liquid Glass material across Login, Mis pedidos, and Tracking without changing layout, flow, data, or functionality.

## Reference

The visual reference is the CodePen `SVG Liquid Glass - feDisplacementMap`, which builds a more physical glass effect with:

- layered tint, blur, glint, and rounded clipping;
- SVG displacement/refraction as the expensive high-fidelity layer;
- explicit performance notes about avoiding broad, constantly repainted surfaces.

## Design decision

Use a hybrid implementation:

1. A centralized CSS material system for most surfaces.
2. Refractive-looking static CSS overlays for all reusable panels, cards, badges, inputs, and controls.
3. Avoid full dynamic cloned-scene SVG refraction in this pass because the project already has expensive 3D/map layers and many nested panels. The CodePen technique is best reserved for a small, isolated lens, not every app card.

This keeps the product premium and coherent while protecting mobile performance and text clarity.

## Shared material API

Add reusable global classes and CSS variables:

- `.liquid-glass`
- `.liquid-glass--hero`
- `.liquid-glass--card`
- `.liquid-glass--control`
- `.liquid-glass--subtle`
- `.liquid-glass--interactive`

The variables control tint, border, blur, saturation, shadow, glint, shine, and opacity. The old `.liquid-panel` remains as a compatibility alias using the new material.

## Application

### Login

- Apply hero glass to the auth card.
- Apply control glass to inputs and submit button treatment where legibility remains strong.
- Keep the existing fields and links.

### Mis pedidos

- Apply hero/card glass to the wallet and tickets without changing ticket geometry.
- Apply control/subtle glass to summary chips, badges, progress tracks, and action pill.
- Preserve ticket cutouts, route layout, progress, and previous-order cards.

### Tracking

- Apply hero glass to the route header and main sheet.
- Apply card/subtle glass to timeline cards, ETA card, disclosure cards, inline help, product markers, and route pill.
- Preserve existing sheet animation, globe/map behavior, timeline logic, and responsive breakpoints.

## Performance and accessibility

- Keep blur moderate and tunable through variables.
- Reduce blur and remove heavy glints on small screens.
- Respect `prefers-reduced-motion`.
- Use `@supports` fallback when `backdrop-filter` is unavailable.
- Do not apply expensive material to every deeply nested child.

## Validation

Run:

- TypeScript check.
- Lint.
- Tests.
- Production build if practical.
- Localhost smoke test for `/login`, `/portal/orders`, and `/portal/orders/[id]`.
