# TaskFlow

Modern project/task management web app with email verification, real‑time updates, and full i18n (Ukrainian + English). Built with React + Vite on the frontend and Node.js + Express + MySQL on the backend.

<p align="center">
	<a href="#-features">Features</a> ·
	<a href="#-tech-stack">Tech Stack</a> ·
	<a href="#-repository-structure">Structure</a> ·
	<a href="#-getting-started">Setup</a> ·
	<a href="#-authentication--verification">Auth</a> ·
	<a href="#-internationalization-uaen">i18n</a> ·
	<a href="#-screenshots">Screenshots</a> ·
	# TaskFlow

**Quick links:** Features В· Tech Stack В· Structure В· Setup В· Migrations В· i18n В· API

**Recent highlights:**
- **Avatar support:** users can upload avatars (backend stores relative paths under `/uploads/avatars`).
- **Chat avatars:** small rounded avatars are shown left of each message bubble in the project chat.
- **Clear activity:** project owners/admins can clear project activity from the Project page (button in activity header).
- **Defensive migrations:** the server checks optional columns (avatar/avatar_url/nickname) and migrations are available under `backend/migrations`.
- **i18n coverage:** many UI strings were converted to the `t(key)` lookup; new keys added for confirmations and errors.

**Status:** actively developed (local dev ready). See `backend/migrations` and `src/context/I18nContext.jsx` for migration and localization details.

**Tech Stack**
- Frontend: React + Vite, React Router, Axios, Socket.IO client
- Backend: Node.js, Express, MySQL (mysql2), JWT, Nodemailer

**Repository Layout (high level)**
- `backend/` вЂ“ controllers, routes, `db.js`, `server.js`, `migrations/`
- `src/` вЂ“ React app: `components/`, `context/` (Auth + I18n), `api.js`, `main.jsx`

**Getting started (dev)**

- Install dependencies (from repo root):
```powershell
npm install
```

- Create `.env` in the `backend/` folder (or root depending on your setup). Important vars:
```dotenv
DB_HOST=localhost
DB_USER=<mysql_user>
DB_PASSWORD=<mysql_password>
DB_NAME=TaskFlow
JWT_SECRET=<secret>
PORT=5000

EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=<smtp_user>
EMAIL_PASS=<smtp_pass>
EMAIL_FROM="TaskFlow <noreply@example.com>"
```

- Apply migrations and start backend (from `backend/`):
```powershell
cd backend
node scripts\run-migrations.js
node server.js
```

- Start frontend (root):
```powershell
npm run dev
```

If the backend port is occupied, you can set a different `PORT` environment variable before starting.

**Migrations**
- Migrations are stored in `backend/migrations`. Run `node scripts/run-migrations.js` from the `backend` folder to apply them.
- Recent migrations add optional columns such as `avatar`, `avatar_url`, `nickname` вЂ” the server queries INFORMATION_SCHEMA to include them only when present.

**Key features & usage**
- Authentication: register в†’ verify email (6-digit code) в†’ login в†’ token in `localStorage`.
- Projects & Tasks: create/update/delete from the dashboard and project pages.
- Chat: open a project, go to the chat panel вЂ” messages are delivered live via Socket.IO; avatars (if present) are shown left of messages.
- Attachments: upload files to tasks; attachments are shown inline and can be deleted.
- Members: manage project members and per-member permissions from the Members panel.
- Clear project activity: a button in the activity header clears activity (admin/owner).

**API (high level)**
- Base: `http://localhost:<PORT>/api`
- Auth: `POST /register`, `POST /verify-email`, `POST /login`, `GET /me`, `PATCH /me`, `POST /me/avatar`
- Projects: `GET/POST/PUT/DELETE /projects` and related routes (invitations, members, permissions)
- Tasks: `GET /tasks/:projectId`, `POST /tasks`, `PUT /tasks/:id`, `DELETE /tasks/:id`, attachments endpoints
- Chat: `GET /projects/:projectId/messages`, `POST /projects/:projectId/messages`, `PUT`/`DELETE` message

**i18n**
- The app uses `src/context/I18nContext.jsx` with a simple dictionary approach. Use `t('key')` in components.
- Both Ukrainian (`uk`) and English (`en`) dictionaries are present and were recently expanded (confirm/alert strings, permission messages, avatar/upload texts).

**Troubleshooting**
- If the frontend shows `ERR_CONNECTION_REFUSED`, ensure the backend is running and `PORT` matches `API_URL` in `src/api.js`.
- If avatars do not appear, ensure `users` table has `avatar` or `avatar_url` column (migrations), and that the `backend/uploads/avatars` folder exists and is served by Express static middleware.
- Multer upload size defaults were increased to allow larger avatar files (check logs for `MulterError: File too large`).

**Contributing / Notes**
- This repo contains local development helpers and scripts under `backend/scripts` (migration runner, etc.).
- When adding UI strings, prefer adding keys to `I18nContext.jsx` and use `t('...')` in components.

---

If you'd like, I can also:
- add placeholder initials when a user has no avatar,
- make avatars clickable (profile modal), or
- run a quick build and report any remaining i18n/runtime warnings.


```powershell
npm run build
```

## 🖼 Screenshots

### Login
![Login](assets/screenshots/Login.png)

### Registration
![Registration](assets/screenshots/Register.png)

### Dashboard
![Dashboard](assets/screenshots/Dashboard.png)

### Project Chat
![Chat](assets/screenshots/Chat.png)

## 🔐 Authentication & Verification
- Registration requires a valid email. A 6‑digit verification code is sent via SMTP.
- After verification, the backend returns a JWT. The app stores it in `localStorage`.

## 🌍 Internationalization (UA/EN)
- `I18nContext.jsx` provides `t(key)` and a language toggle.
- All major components use dictionary keys; styles remain unchanged.

## 🔔 Invitations & Notifications
- Invitations bell shows pending project invites; users can accept/decline.
- Notifications bell supports “mark all as read” and single read/delete.

## 👥 Members & Permissions
- `MembersPanel` lists project participants and allows toggling granular permissions.
- Assignee dropdowns pull project members so users don’t need to know IDs.

## 💬 Project Chat
- Real‑time messages via Socket.IO events: create, edit, delete.
- Inline edit with save/cancel; localized tooltips and alerts.

## 🧼 Notes
- Captcha (reCAPTCHA) was removed. Registration no longer requires captcha.
- Overlays (modals/dropdowns) use proper z‑index to always appear above headers.

## 🛠 Troubleshooting
- If backend can’t bind to port 5000, use another port as shown above.
- SMTP: For Gmail, enable 2FA and use an App Password.

## 📄 License

This project is licensed under the [MIT License](https://github.com/Wertoquri/TaskFlow/LICENSE).

---

## 🔌 API Overview
Base URL: `http://localhost:${PORT}/api`

- Auth
	- `POST /register` — register user (returns `userId`, email)
	- `POST /verify-email` — verify with 6‑digit code (returns `token`, `user`)
	- `POST /login` — login (returns `token`, `user`)
	- `GET /me` — current user
	- `DELETE /account` — delete current account

- Projects
	- `GET /projects` — list projects
	- `POST /projects` — create project
	- `PUT /projects/:id` — update project
	- `DELETE /projects/:id` — delete project

- Tasks
	- `GET /tasks/:projectId` — list tasks for a project
	- `POST /tasks` — create task
	- `PUT /tasks/:id` — update task
	- `DELETE /tasks/:id` — delete task

- Invitations
	- `POST /projects/:projectId/invite` — invite user by email
	- `GET /projects/me/invitations` — current user pending invites
	- `POST /projects/invitations/:id/accept` — accept invite
	- `POST /projects/invitations/:id/decline` — decline invite

- Members
	- `GET /projects/:projectId/members` — list members
	- `DELETE /projects/:projectId/members/:userId` — kick member
	- `PUT /projects/:projectId/members/:userId/permissions` — update permissions

- Notifications
	- `GET /notifications` — list notifications
	- `PUT /notifications/read-all` — mark all read
	- `PUT /notifications/:id/read` — mark single read
	- `DELETE /notifications/:id` — delete notification

- Chat
	- `GET /projects/:projectId/messages` — list messages
	- `POST /projects/:projectId/messages` — send message
	- `PUT /projects/:projectId/messages/:messageId` — edit message
	- `DELETE /projects/:projectId/messages/:messageId` — delete message

