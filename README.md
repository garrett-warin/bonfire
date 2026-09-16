# Scramjet proxy engine

This repository contains only the Scramjet proxy engine and the runtime packages
required to build and integrate it. Demo sites, deployable frontends, generated
browser bundles, and app-specific infrastructure have been removed.

## Packages

- `packages/core` — proxy runtime, request pipeline, content rewriters, and the
  Rust/WASM JavaScript rewriter
- `packages/controller` — browser and service-worker controller
- `packages/bootstrap` — server/client bootstrap helpers
- `packages/utils` — integration utilities and plugins
- `packages/rpc` — internal RPC primitive used by the controller

## Build

Requirements: Node.js, pnpm, Rust, `wasm-bindgen`, `wasm-opt`, and the Scramjet
fork of `wasm-snip`.

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm build:rewriter
pnpm build
```

The runtime outputs are written to each package's `dist` directory. This engine
repository intentionally does not include a web UI or application server.

## Checks

```sh
pnpm lint
pnpm format:check
```

Scramjet is licensed under the AGPL-3.0-only license.
