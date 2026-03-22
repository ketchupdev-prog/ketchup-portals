# Docker and custom domains

You can run ketchup-portals in Docker and still use **portal.ketchup.cc**, **admin.ketchup.cc**, **gov.ketchup.cc**, **agent.ketchup.cc**, and **mobile.ketchup.cc**. The app uses the `Host` header in middleware, so as long as your reverse proxy forwards that header, the same redirects apply.

## How it works

- **Middleware** (`src/middleware.ts`) reads `request.nextUrl.hostname`.
- If the host is `admin.ketchup.cc` and path is `/`, the app redirects to `/ketchup`. Same for `gov.ketchup.cc` → `/government`, `agent.ketchup.cc` → `/agent`, `mobile.ketchup.cc` → `/field-ops`.
- So you need: **one container**, **one app**, and a **reverse proxy** that sends traffic to the container and preserves the `Host` header.

## 1. Run the container

```bash
docker build -t ketchup-portals .
docker run -d -p 3000:3000 --env-file .env --name portals ketchup-portals
```

Or with Compose: `docker compose up -d`. The app listens on port 3000 inside the container.

## 2. Reverse proxy in front

Run Nginx, Caddy, or Traefik on the same host (or a load balancer). All five domains should point to this host (DNS A record to your server IP, or CNAME to your host).

### Option A: Nginx (example)

```nginx
# All four domains → same upstream
upstream portals {
    server 127.0.0.1:3000;
}

server {
    listen 443 ssl http2;
    server_name portal.ketchup.cc admin.ketchup.cc gov.ketchup.cc agent.ketchup.cc;
    ssl_certificate     /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;

    location / {
        proxy_pass http://portals;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

- **Host** is preserved, so the Next.js app sees `admin.ketchup.cc` etc. and middleware can redirect correctly.
- Use Let's Encrypt (e.g. `certbot`) or your provider to get certificates for all four hostnames.

### Option B: Caddy (included)

Use the repo **Caddyfile** and **docker-compose.proxy.yml** to run Caddy in front of the app. Caddy obtains Let's Encrypt certs automatically when DNS points to the host.

```bash
# Build and run app + Caddy (ports 80, 443, 3000)
docker compose -f docker-compose.yml -f docker-compose.proxy.yml up -d --build
```

- **Caddyfile** (repo root): `portal.ketchup.cc`, `admin.ketchup.cc`, `gov.ketchup.cc`, `agent.ketchup.cc`, `mobile.ketchup.cc` → `reverse_proxy app:3000`.
- Ensure DNS for all five domains points to this host so Caddy can issue certificates.

### Option C: Traefik

Configure a router for each domain (or one with multiple host rules) and a service pointing at the container on port 3000; enable TLS. Traefik forwards `Host` by default.

## 3. DNS

- **A record**: Point **portal.ketchup.cc**, **admin.ketchup.cc**, **gov.ketchup.cc**, **agent.ketchup.cc**, **mobile.ketchup.cc** to your server’s public IP (or to the load balancer in front of the proxy).
- Or use a **wildcard** `*.ketchup.cc` → server IP if your proxy supports SNI and multiple certs.

## 4. Env in Docker

Set in `.env` (or `docker run -e` / `environment` in Compose):

- **DATABASE_URL**, **BUFFR_API_URL**, **BUFFR_API_KEY**
- **NEON_AUTH_BASE_URL**, **NEXT_PUBLIC_NEON_AUTH_URL**, **NEON_AUTH_COOKIE_SECRET**
- **NEXT_PUBLIC_PORTAL_URL** = `https://portal.ketchup.cc` (for emails, password reset links)
- **SMTP_*** if you use transactional email

Same variables as in [DOMAIN_AND_ENV_RECOMMENDATIONS.md](DOMAIN_AND_ENV_RECOMMENDATIONS.md).

## Summary

| Item | Notes |
|------|--------|
| Domains | portal, admin, gov, agent, mobile all point to the same server and proxy. |
| App | Single container; middleware does host-based redirects. |
| Proxy | Must forward requests to the container and preserve the `Host` header. |
| SSL | Terminated at the proxy (Nginx/Caddy/Traefik) with certs for each domain (or wildcard). |

You can use your domains with Docker the same way as on Vercel; only the way traffic reaches the app (reverse proxy vs Vercel’s edge) is different.
