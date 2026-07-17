# RAG Frontend - Asesor de Maquinaria Pesada

Chat UI para el sistema RAG de renta de maquinaria pesada. Desplegado en Render como static site.

## Stack

- Svelte 4
- Vite 5
- SSE Streaming

## Desarrollo local

```bash
pnpm install
pnpm dev
```

## Build

```bash
pnpm build
```

## Variables de entorno

| Variable | Descripcion | Default |
|----------|-------------|---------|
| `VITE_API_URL` | URL del backend (ngrok) | `''` (mismo origen) |

En Render, configurar `VITE_API_URL` a la URL de ngrok del backend.
