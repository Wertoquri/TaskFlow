# TaskFlow

TaskFlow is a bilingual project-management application for small teams. It demonstrates role-based access, Kanban workflows, invitations, notifications, file attachments and real-time project chat.

![TaskFlow dashboard](assets/screenshots/Dashboard.png)

## Client demo

```bash
docker compose up --build
```

Open http://localhost:3000 and sign in with:

- Email: `demo@taskflow.local`
- Password: `DemoPass123`

The container creates the MySQL schema and a populated demo workspace automatically. SMTP is replaced by a console mailer in demo mode; production SMTP remains configurable.

## Demo walkthrough

1. Sign in and open **Website launch**.
2. Move work through the Kanban columns and edit priorities.
3. Open project chat and show live updates in a second browser.
4. Invite a user, inspect permissions and review project activity.
5. Switch between Ukrainian and English.

## Architecture

```text
React/Vite + Socket.IO client
           | REST / WebSocket
Express API + JWT
     |            |
TiDB/MySQL    Cloudinary media
```

## Local development

Prerequisites: Node.js 22 and MySQL 8.

```bash
cp .env.example .env
npm ci
npm --prefix backend ci
npm --prefix backend run migrate
npm --prefix backend start
npm run dev
```

Frontend: http://localhost:3000. API health: http://localhost:5000/api/health.

## Free portfolio deployment

The repository includes `render.yaml` for a single public Render URL. In production, Express serves both the API and the built React application, including SPA routes and Socket.IO.

1. Create a free TiDB Cloud Starter database and copy its host, port, username, password and database name.
2. Create a free Cloudinary account and copy `CLOUDINARY_URL`.
3. Open this repository as a Render Blueprint.
4. Fill the secret variables marked `sync: false` in the Render dashboard.
5. Deploy and verify `/api/health`, login, Kanban drag-and-drop, chat and uploads.

Required production variables:

```env
DB_HOST=
DB_PORT=4000
DB_USER=
DB_PASSWORD=
DB_NAME=
DB_SSL=true
JWT_SECRET=
DEMO_PASSWORD=
CLOUDINARY_URL=
NODE_ENV=production
```

The free Render service sleeps after inactivity, so the first request can take about a minute. This setup is suitable for a portfolio demo, not a production SLA.

## Quality checks

```bash
npm run lint
npm run build
npm --prefix backend test
npm run verify
docker compose config
```

GitHub Actions runs the same checks for every pull request and push to `main`.

## Security notes

- Secrets are supplied only through environment variables.
- Passwords are hashed with bcrypt and authenticated endpoints require JWT.
- `EMAIL_MODE=console` and seeded credentials are intended only for local demonstrations.
- Production requires a unique `JWT_SECRET`; media is stored outside the ephemeral app filesystem.

## Technology

React 19, Vite, Express 5, Socket.IO, MySQL/TiDB, Cloudinary, JWT, Nodemailer and Docker Compose.

MIT licensed.
