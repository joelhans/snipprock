# Snipprok

Single-page React app that stylizes code snippets using ngrok's Mantle UI.

## Scripts
- pnpm dev — start dev server
- pnpm build — production build
- pnpm preview — preview build

## Docker (Phase 5)
This repo ships a multi-stage Dockerfile that builds with pnpm and serves with nginx.

Build the image:

```bash
docker build -t snipprok .
```

Run the container and expose on localhost:8080:

```bash
docker run --rm -p 8080:80 snipprok
```

Open http://localhost:8080

Notes:
- The Dockerfile uses node:20-alpine for build and nginx:alpine to serve dist/.
- Cache busting headers are set for static files; routing falls back to index.html.

## Phase status
- Phase 1–4 complete (dev/build work; PNG export implemented)
- Phase 5 complete (Dockerfile + .dockerignore + run docs)
- Phase 6 complete (full-screen layout, merged editor+preview, width controls; removed border width control)
