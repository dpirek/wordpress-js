# WordPress JS

Node.js version of WordPress focused on a lightweight, server-rendered blog with SQLite storage and modular components.

## Overview

This project re-implements core WordPress-like concepts in Node.js:

- `wp_*` database tables in SQLite (`db/schema.sql`)
- Blog post listing on the home page (`/`)
- Blog post detail pages by slug (`/blog/:blurb`)
- Component-based server-side HTML rendering
- Simple routing and auth/session utilities

## Tech Stack

- Node.js (ESM modules)
- Built-in `node:sqlite` driver (`DatabaseSync`)
- Vanilla server-side rendering (no frontend framework required)
- Bootstrap for UI styling

## Project Structure

- `server.js` - HTTP server entrypoint
- `routes.js` - route definitions
- `components/` - page and shared UI renderers
- `models/` - SQLite-backed data access layer
- `db/schema.sql` - WordPress-style SQLite schema
- `db/data.sqlite` - local SQLite database
- `public/` - static assets
- `utils/` - router, response, auth, string, image helpers

## Getting Started

### Requirements

- Node.js 22+ (recommended: latest LTS)

### Install

No external dependencies are required for the core app in its current form.

### Run

```bash
npm run dev
```

or

```bash
npm start
```

Default server port:

- `8080` (or `PORT` env override)

## Database

Schema is defined in:

- `db/schema.sql`

WordPress-like tables include:

- `wp_posts`, `wp_users`, `wp_comments`, `wp_terms`, and related `meta`/taxonomy tables

Model initialization auto-applies schema when the app loads database models.

## Main Routes

- `GET /` - home page with published blog posts
- `GET /home` - alias for home page
- `GET /blog/:blurb` - blog post detail page by slug
- `GET /about` - about page

## Notes

- Project is configured as ESM (`"type": "module"`).
- Some Node SQLite APIs may show experimental warnings depending on Node version.
- This project is a Node.js interpretation of WordPress concepts, not a PHP WordPress runtime.
