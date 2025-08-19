# Secure Express Server (Hardened)

- AES-256-GCM payload encryption (with auth tag)
- HMAC request signing + timestamp (replay protection)
- Strict CORS allowlist
- Helmet CSP/HSTS and security headers
- Rate limiting
- JWT auth + API key guard
- JSON structured logging (pino)

## Setup
1. Copy `.env.example` to `.env` and fill values.
2. `npm install`
3. `npm run dev` (or `npm start` in production)

## Security Notes
- Never generate secrets at runtime; store them in a secret manager or `.env` on the host.
- Keep `ENCRYPTION_KEY_*` consistent across restarts or you won’t be able to decrypt past payloads.
- Put this behind HTTPS and a reverse proxy (Nginx/Cloudflare) if exposed publicly.
- For file uploads, use presigned URLs to object stores (S3/GCS) instead of accepting large files directly.# Frank-swap-server
