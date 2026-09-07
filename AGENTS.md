# AGENTS.md — Agent instructions for this workspace

Purpose
-
This file gives concise, actionable guidance for AI coding agents working on phone-number related changes (argument: `phone`) and site security. Keep minimal and link to source files rather than duplicating content.

Quick links
-
- Contact page: [contact.html](contact.html)
- Contact logic: [contact.js](contact.js)
- Shared helpers & security: [shared.js](shared.js), [style.css](style.css)
- Site entry: [index.html](index.html)
- PDF documents: [pdf/](pdf/) (view only, anti-download)

Security conventions
-
- PDF documents in [pdf/](pdf/) are for viewing only. Two layers of protection:
  - **Proxy (server)** — [server.js](server.js) (zero-dependency Node server). PDFs are served ONLY through `/api/pdf/<name>` protected by a one-time token from `/api/token`. Direct access to `/pdf/*` is blocked (403), download/resume ranges are refused, and PDF responses get `Content-Disposition: inline`, `no-store` cache, hardened CSP `default-src 'none'; sandbox`. Run with `npm start` (site: http://localhost:3000).
  - **Front-end (best-effort)** — the legal modal in [index.html](index.html) + [shared.js](shared.js): viewer container uses class `no-rightclick`; `initSecurity()` (shared.js) blocks right-click on `#pdfViewer` / `.no-rightclick`; viewer URL appends `#toolbar=0&navpanes=0&scrollbar=0`; global shortcuts (Ctrl+U, Ctrl+Shift+I/C/J, F12) and image drag are blocked.
  - [shared.js](shared.js) `openModal()` first requests a token from `/api/token` and loads `/api/pdf/...?t=<token>`. Falls back to `pdf/<file>` when no proxy is reachable (e.g., static hosting or `file://`).
  - NOTE: do NOT cover the iframe with a full overlay — it blocks PDF scrolling. Right-click blocking inside the PDF plugin is best-effort.
- Every HTML page includes security meta tags (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy).
- [style.css](style.css) disables user-select on body/images and drag on service images. Do not remove unless a feature requires it.
- [server.js](server.js) also ships security headers (CSP, `frame-ancestors 'none'`, COOP, CORP, Permissions-Policy) and in-memory rate limiting.

What an agent should do for `security` or `pdf` tasks
-
1. Keep the `#toolbar=0...` suffix in `openModal()` (shared.js).
2. Do NOT add an overlay div (`#pdfOverlay`) on top of the PDF iframe — it breaks mouse/touch scrolling.
3. When changing PDF paths, update BOTH `openModal()`/`requestPdfToken()` in shared.js AND the `/api/pdf` + `/api/token` handlers in server.js.
4. When adding new HTML pages, copy the security meta tags from an existing page.
5. Grep for `no-rightclick` / `initSecurity` / `/api/pdf` before changing PDF or security behavior.
6. Run changes with `npm start` and test `/api/token` + `/api/pdf/<name>?t=<token>` manually (curl/Invoke-WebRequest).

Phone-specific conventions
-
- Preferred storage: use normalized E.164-like digits for data (no spaces, leading "+" optional in code). Example in this repo: `WHATSAPP_PHONE_NUMBER` in [contact.js](contact.js).
- Display: format for human-readable UI only; keep underlying code values numeric and safe for `tel:` and API links.
- Link usage: use `tel:` links for clickable phone numbers in HTML and `https://wa.me/<number>` for WhatsApp. Ensure numbers have only digits when used in URLs.

What an agent should do for `phone` tasks
-
1. Search for occurrences of phone-related constants or strings (search for "phone", "WHATSAPP", "wa.me", "tel:"). Key file: [contact.js](contact.js).
2. When changing a phone number, update the constant in `contact.js` and any displayed text in `contact.html` or other pages.
3. Ensure URL-encoded or digit-only forms are used where required (e.g., WhatsApp `wa.me` links). Use existing helper code in `contact.js` to format numbers.
4. Run a quick manual check by opening `contact.html` in a browser and clicking the phone/WhatsApp link.

Testing & verification
-
- There is no automated test runner configured. Verify changes by opening the affected HTML pages locally.
- For PDF changes: open `index.html`, click a legality card, and confirm the PDF opens without a toolbar and right-click is disabled.
- Grep for `phone` after edits to ensure no stray duplicates remain.

Notes & follow-ups
-
- If phone numbers are moved into a data store or config later, prefer a single source of truth (e.g., `config.json`) and update this guide accordingly.

Next suggestions
-
- Add a small script or lint rule to validate phone-number formats across the codebase.
- If you want, I can create a focused agent prompt that automates the edit+verification steps for phone updates.
