# Randy Fahmi — Portfolio + Admin Panel

A full-stack portfolio site built with **Node.js, Express and MongoDB**, styled after your
"Porto Folio" design (black / yellow / white, rounded bold type). It works as a normal
website, and is installable on phones as a **PWA** (Progressive Web App) — no app-store
build needed, one codebase for web + mobile.

## What's included

- **Public site** (`/`) — hero, about, "table of content" category cards, a filterable
  project grid (Graphic Design / Photography / Videography / Coding), and a contact section.
- **Admin panel** (`/admin-login.html` → `/admin-dashboard.html`) — password-protected,
  lets you add, edit, and delete projects, including image upload.
- **API** (`/api/...`) — Express + MongoDB (Mongoose), JWT-based admin auth, image uploads
  via Multer.
- **PWA** — `manifest.json` + a service worker (`sw.js`) so visitors can "Add to Home
  Screen" on mobile and it behaves like an app (works offline for already-viewed pages).

## Project structure

```
portfolio-app/
├── server.js              # Express entry point
├── seed.js                # creates your first admin login
├── config/db.js           # MongoDB connection
├── models/                # Admin.js, Project.js (Mongoose schemas)
├── middleware/             # authMiddleware.js (JWT check), upload.js (Multer)
├── routes/                 # authRoutes.js, projectRoutes.js
├── uploads/                 # uploaded project images are stored here
└── public/                  # the actual website (static, served by Express)
    ├── index.html            # public portfolio page
    ├── admin-login.html
    ├── admin-dashboard.html
    ├── manifest.json / sw.js # PWA files
    ├── css/style.css         # public site styles
    ├── css/admin.css         # admin panel styles
    └── js/app.js, admin.js
```

## 1. Requirements

- **Node.js** 18+ (https://nodejs.org)
- **MongoDB** — either:
  - installed locally (https://www.mongodb.com/try/download/community), or
  - a free cloud database at **MongoDB Atlas** (https://www.mongodb.com/atlas) — easier if
    you don't want to install anything.

## 2. Setup

```bash
cd portfolio-app
npm install
cp .env.example .env
```

Open `.env` and fill in:

```
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/randy_portfolio   # or your Atlas connection string
JWT_SECRET=make_this_a_long_random_string
ADMIN_USERNAME=randy
ADMIN_PASSWORD=pick-a-strong-password
```

Then create your admin login (reads `ADMIN_USERNAME` / `ADMIN_PASSWORD` from `.env`):

```bash
npm run seed
```

Run this only once. To change the password later, edit `.env` and either re-run seed with
a new username, or update it directly in the database.

## 3. Run it

```bash
npm start          # production
npm run dev         # auto-restarts on file changes (requires the nodemon dev dependency)
```

Visit:
- **Public site:** http://localhost:4000
- **Admin panel:** http://localhost:4000/admin-login.html

## 4. Using the admin panel

1. Log in with the username/password from your `.env`.
2. Click **"+ Add new"**.
3. Fill in:
   - **Title, Category** (Graphic Design / Photography / Videography / Coding)
   - **Description**
   - For **Coding** projects only: tech stack (comma-separated), repo URL, live URL
   - **Image** — upload a screenshot, poster, or thumbnail (jpg/png/gif/webp, up to 8MB)
4. Save. It appears instantly on the public site's project grid, filterable by category.
5. **Edit** or **Delete** any project from its card. Deleting also removes its uploaded
   image file from the server.

## 5. Installing it as a mobile app (PWA)

Once deployed to a real domain with HTTPS (see below):

- **Android (Chrome):** open the site → menu (⋮) → "Add to Home screen" / "Install app".
- **iPhone (Safari):** open the site → Share button → "Add to Home Screen".

It'll open full-screen with your icon, no browser bar — behaving like a native app,
while it's really just the same website.

> Note: PWA install prompts require **HTTPS** (localhost is exempt for testing). Add real
> `icons/icon-192.png` and `icons/icon-512.png` files to `public/icons/` before shipping —
> placeholders aren't included in this build.

## 6. Deploying

Any Node.js host works (Railway, Render, Fly.io, a VPS, etc.):

1. Push this project to GitHub (uploads/ and .env are gitignored on purpose).
2. On your host, set the same environment variables as your `.env`.
3. Use a **MongoDB Atlas** connection string for `MONGO_URI` (a local MongoDB won't be
   reachable from most hosts).
4. Set the start command to `npm start`, then run `npm run seed` once (via the host's
   shell/console) to create your admin login on the live database.
5. Point your domain at the host and make sure HTTPS is enabled — most hosts do this
   automatically — so the PWA install prompt works.

## Notes & things you may want to extend later

- Currently there's a single admin account. If you want multiple team members with
  logins, extend `models/Admin.js` and `routes/authRoutes.js`.
- Images are stored on the server's disk (`/uploads`). For production at scale, consider
  swapping the Multer disk storage for an S3-compatible bucket — the rest of the code
  doesn't need to change, only `middleware/upload.js`.
- The category list (Graphic Design / Photography / Videography / Coding) is defined in
  `models/Project.js` (`enum`) and mirrored in the frontend/admin HTML — add a category in
  all three places if you want a fifth type.
