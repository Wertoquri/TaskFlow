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
	<a href="#-api-overview">API</a> ·
	<a href="#-troubleshooting">Troubleshooting</a>
</p>

<p align="center">
	<img alt="Built with Vite" src="https://img.shields.io/badge/Built%20with-Vite-646CFF?logo=vite" />
	<img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" />
	<img alt="Node" src="https://img.shields.io/badge/Node.js-24-339933?logo=node.js&logoColor=white" />
	<img alt="License" src="https://img.shields.io/badge/License-Proprietary-grey" />
</p>

## ✨ Features
- Authentication with email verification flow (verification code via email)
- Projects CRUD with modal editing
- Tasks management: create, edit, delete, status/priority, labels
- Kanban board view with drag‑like interactions (UI driven)
- Project chat with live updates via Socket.IO
- Invitations: invite users by email, accept/decline from bell dropdown
- Members management with permissions and kick member
- Global i18n: full UI translations (UA/EN) through `I18nContext`
- Clean overlays: dropdowns and modals correctly stack over headers

## 🧱 Tech Stack
- Frontend: React (Vite), React Router, Axios, Socket.IO client
- Backend: Node.js, Express, MySQL, JWT, Nodemailer
- Tooling: ESLint, PostCSS/Tailwind (postcss), Sass

## 📦 Repository Structure
```
backend/
	controllers/        # auth, project, task
	middleware/         # JWT authenticate
	routes/             # API routes
	db.js               # MySQL pool
	server.js           # Express app + Socket.IO

src/
	components/         # UI components (Dashboard, Kanban, Modals, Panels)
	context/            # AuthContext, I18nContext
	pages/              # LoginPage
	api.js              # Axios API layer
	main.jsx            # App bootstrap
```

## 🚀 Getting Started

1) Install dependencies
```powershell
# install all project dependencies
npm install

# or install explicitly if needed
npm install react react-dom react-router-dom axios socket.io-client sass
npm install vite @vitejs/plugin-react
npm install eslint @eslint/js eslint-plugin-react-hooks eslint-plugin-react-refresh globals
npm install postcss autoprefixer @tailwindcss/postcss
```

2) Configure environment in `.env`
```dotenv
DB_HOST=localhost
DB_USER=<your_mysql_user>
DB_PASSWORD=<your_mysql_password>
DB_NAME=TaskFlow
JWT_SECRET=<random_secret>
PORT=5000

# Email SMTP (example: Gmail App Password)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=<your_email>
EMAIL_PASS=<your_app_password>
EMAIL_FROM="TaskFlow <your_email>"
```

3) Start backend (default on port 5000)
```powershell
node .\backend\server.js
```

If port 5000 is busy:
```powershell
$env:PORT=5001
node .\backend\server.js
```

4) Start frontend (Vite dev server)
```powershell
npm run dev
```

5) Build production bundle
```powershell
npm run build
```

## 🖼 Screenshots
Add your UI screenshots here (Dashboard, Kanban, Project Page, Chat).

```
assets/
	screenshots/
		dashboard.png
		kanban.png
		project-page.png
		chat.png
```

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
Proprietary. All rights reserved.

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

