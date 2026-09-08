# AGENTS.md — Agent instructions for this workspace

Purpose
-
This file gives concise, actionable guidance for AI coding agents working on phone-number related changes (argument: `phone`). Keep minimal and link to source files rather than duplicating content.

Quick links
-
- Contact page: [contact.html](contact.html)
- Contact logic: [contact.js](contact.js)
- Shared helpers: [shared.js](shared.js)
- Site entry: [index.html](index.html)

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
- Grep for `phone` after edits to ensure no stray duplicates remain.

Notes & follow-ups
-
- If phone numbers are moved into a data store or config later, prefer a single source of truth (e.g., `config.json`) and update this guide accordingly.

Next suggestions
-
- Add a small script or lint rule to validate phone-number formats across the codebase.
- If you want, I can create a focused agent prompt that automates the edit+verification steps for phone updates.
