# Asset storage on static.timesauto.net

Uploaded files (images, video, PDFs, documents) are written to a volume
served by nginx as `static.timesauto.net`, with Cloudflare caching in
front. Uploads go through the admin API, which validates and converts
them before writing.

## The one design rule

**The database stores host-relative paths, never absolute URLs.**

A row holds `/uploads/brands/1786010515866-e10b09afad7a.avif`. It does
not hold `https://static.timesauto.net/uploads/...`.

The hostname lives in one env var per frontend. Repointing assets at a
different origin — a new CDN, a staging bucket, a rollback to serving
from the API — is a config change and a redeploy. If the hostname were
baked into rows instead, it would be an `UPDATE` across every table
holding a path, and every stale cache and search index would still carry
the old one.

This is also why **no database migration is needed to adopt the CDN**.
Paths written before the cutover and after it are identical.

## Moving parts

| Where | Setting | Purpose |
|---|---|---|
| admin-backend | `ASSET_STORAGE_ROOT` | directory files are written to |
| admin-backend | `ASSET_PUBLIC_BASE_URL` | only builds the `url` field in upload responses |
| website | `NEXT_PUBLIC_ASSET_BASE_URL` | prefix `getUploadUrl()` resolves paths against |
| admin-panel | `VITE_ASSET_BASE_URL` | same |

Both frontends already funnel every asset path through `getUploadUrl()`
(48 files call it), so only the two helpers needed changing.

Unset, the asset base falls back to the API origin — local development
keeps working against Express's own `/uploads` mount with no CDN.

## Upload endpoint

```
POST   /api/v1/assets?folder=<folder>     (multipart, field: "files", up to 20)
DELETE /api/v1/assets                     (json: { "path": "/uploads/..." })
```

Requires an admin token and the `assets.create` / `assets.delete`
permissions (added to the permission seed — re-run
`prisma/seed-site-settings-and-permissions.ts` after deploying).

`folder` is a **query parameter, not a body field**: multer chooses the
destination directory before any multipart body is parsed, so the value
has to be readable from the URL. It is checked against the allowlist in
`asset.validation.ts` before multer runs, so an unknown or traversing
folder never causes a file to be written.

Response:

```json
{ "success": true, "message": "Asset(s) uploaded successfully",
  "data": [{
    "path": "/uploads/brands/1786010515866-e10b09afad7a.avif",
    "url":  "https://static.timesauto.net/uploads/brands/1786010515866-e10b09afad7a.avif",
    "filename": "...", "originalName": "logo.png",
    "mimeType": "image/avif", "sizeBytes": 4211
  }]
}
```

Persist `path`. `url` is for previewing the upload immediately.

Accepted: JPG, PNG, WEBP, AVIF · MP4, WEBM, MOV · PDF, DOC, DOCX, XLS,
XLSX, CSV. Images are re-encoded to AVIF; video and documents pass
through. Limits: 2 MB images, 20 MB documents, 100 MB media.

The 15 existing per-module upload routes are unchanged and write to the
same volume.

### SVG is deliberately not accepted

An SVG can carry an inline `<script>`, and anything served from
`static.timesauto.net` executes on that origin. If SVG is ever needed it
must be served with `Content-Disposition: attachment`, never inlined.

### Content is verified, not trusted

`fileFilter` can only see the `Content-Type` the client claims, which is
trivially forged. Uploads are additionally checked against the format's
magic bytes, and a mismatch removes **every** file in the request — a
partially-accepted multi-file upload would leave orphans on disk that no
row points at.

## nginx on the static origin

```nginx
server {
    listen 443 ssl http2;
    server_name static.timesauto.net;

    ssl_certificate     /etc/letsencrypt/live/static.timesauto.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/static.timesauto.net/privkey.pem;

    root /var/www/static.timesauto.net;

    # Matches ASSET_STORAGE_ROOT: the backend writes <root>/brands/x.avif
    # and the database path is /uploads/brands/x.avif.
    location /uploads/ {
        alias /var/www/static.timesauto.net/;

        # Filenames contain a timestamp and random suffix and are never
        # rewritten in place, so a long immutable TTL is safe — an edited
        # image is a new filename, not new bytes at the old one.
        expires 1y;
        add_header Cache-Control "public, immutable";

        # The website and admin panel are on other origins.
        add_header Access-Control-Allow-Origin "*";

        # Nothing under here is ever executable; force downloads for
        # anything the browser might otherwise run.
        location ~* \.(svg|html?|xhtml|js|php)$ {
            add_header Content-Disposition "attachment";
            default_type application/octet-stream;
        }

        try_files $uri =404;
        autoindex off;
    }

    # No write path is exposed here. Uploads reach this volume through
    # the admin API only.
    location / { return 404; }
}
```

Then in Cloudflare: an `A`/`AAAA` record for `static` pointed at the
origin, **proxied** (orange cloud), with a cache rule set to *Cache
Everything* — the immutable headers above do the rest.

## Deployment

Order matters.

1. Create the volume and point `ASSET_STORAGE_ROOT` at it.
2. Copy the existing `admin-backend/uploads/` tree into it, preserving
   folder names:
   ```bash
   rsync -av admin-backend/uploads/ /var/www/static.timesauto.net/
   ```
3. Bring up nginx + the Cloudflare record, and verify a known file
   resolves before switching any frontend over.
4. Set `NEXT_PUBLIC_ASSET_BASE_URL` / `VITE_ASSET_BASE_URL` and redeploy
   the frontends.
5. Re-run the permission seed so `assets.create` / `assets.delete` exist.

Keep the API's own `/uploads` static mount serving throughout — it is the
rollback path, and it costs nothing to leave in place.

## Known gap: the backend must be able to write to the volume

`ASSET_STORAGE_ROOT` is a filesystem path, so the API process needs write
access to it. That is fine when the API and the static origin are the
same host, or when the volume is a shared mount.

**If they are separate machines with no shared mount, this does not work
as-is** and needs one of:

- a shared volume (NFS/EFS) mounted on both, or
- a push step after write (rsync/SFTP to the static host), or
- object storage instead, which removes the problem entirely.

The same constraint applies to running more than one API replica: two
replicas each with their own local disk will serve inconsistent assets
unless the volume is shared.
