# Block CMS

A local, offline, static admin interface for managing block-based content.
No backend, no frameworks, no build step. Open the files and it runs.

## Getting started

Open `index.html` in a browser. You'll be sent to `login.html`, where you can
register a local account. Everything is stored in that browser's `localStorage`,
so each browser is its own independent instance.

Optionally serve the folder with any static server (`python3 -m http.server`),
but this isn't required.

## File layout

```
index.html        redirects to dashboard or login based on session
login.html        registration + login
dashboard.html    overview counts and recent content
pages.html        page list, filter by status
posts.html        post list, filter by status/category, sort
categories.html   category CRUD and rename
editor.html       block editor for pages and posts (?type=page|post&id=...)
settings.html     site title, tagline, display name, password
preview.html      public output view (?type=page|post&slug=...)

css/style.css     the whole design system

js/storage.js     localStorage read/write wrapper
js/auth.js        register, login, logout, SHA-256 hashing, session
js/settings.js    site settings
js/pages.js       page CRUD
js/posts.js       post CRUD, filtering and sorting
js/categories.js  category CRUD
js/blocks.js      block model, editor UI, and HTML rendering
js/preview.js     shared rendering for admin preview and public view
js/router.js      auth guards, query params, navigation
js/ui.js          escaping, slugs, dates, toasts, modals, sidebar
js/dragdrop.js    drag-to-reorder helper built on native drag events
```

## Blocks

Text: heading (H1–H3), paragraph, list (bulleted/numbered), quote.
Structural: columns (2–3), divider, table.

There is no media handling of any kind — no images, video, audio, or uploads.

Blocks can be reordered by dragging them, or with the arrow buttons in each
block header. Each block can also be duplicated or deleted.

## Notes on passwords

Passwords are hashed with SHA-256 via the Web Crypto API before being stored.
This keeps plaintext out of storage, but it is not a substitute for real
server-side authentication — anyone with access to the browser profile can read
the stored data.
