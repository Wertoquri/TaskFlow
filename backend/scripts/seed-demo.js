const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { nativePool } = require('../db');

async function seed() {
  if (process.env.DEMO_SEED !== 'true') return;
  const email = process.env.DEMO_EMAIL || 'demo@taskflow.local';
  const password = process.env.DEMO_PASSWORD || 'DemoPass123';
  const hash = await bcrypt.hash(password, 10);
  const userResult = await nativePool.query(
    `INSERT INTO users (username, email, password, is_verified)
     VALUES ('demo', $1, $2, TRUE)
     ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, is_verified = TRUE
     RETURNING id`,
    [email, hash]
  );
  const userId = userResult.rows[0].id;
  const projectResult = await nativePool.query(
    `INSERT INTO projects (name, description, owner_id)
     SELECT 'Website launch', 'Client-ready demo workspace', $1
     WHERE NOT EXISTS (SELECT 1 FROM projects WHERE owner_id = $1 AND name = 'Website launch')
     RETURNING id`,
    [userId]
  );
  const projectId = projectResult.rows[0]?.id || (await nativePool.query(
    "SELECT id FROM projects WHERE owner_id = $1 AND name = 'Website launch'",
    [userId]
  )).rows[0].id;
  await nativePool.query(
    "INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, 'admin') ON CONFLICT (project_id, user_id) DO NOTHING",
    [projectId, userId]
  );
  const count = Number((await nativePool.query('SELECT COUNT(*) AS n FROM tasks WHERE project_id = $1', [projectId])).rows[0].n);
  if (!count) {
    await nativePool.query(
      `INSERT INTO tasks (project_id, title, description, status, priority, owner_id, created_by, labels) VALUES
       ($1, 'Approve visual direction', 'Review the final design with stakeholders', 'pending', 'high', $2, $2, '["design"]'::jsonb),
       ($1, 'Prepare launch checklist', 'Validate analytics, SEO and rollback plan', 'in_progress', 'medium', $2, $2, '["release"]'::jsonb),
       ($1, 'Project kickoff', 'Scope and responsibilities confirmed', 'done', 'low', $2, $2, '["planning"]'::jsonb)`,
      [projectId, userId]
    );
  }
  console.log(`[demo] ${email}`);
}

seed().then(() => nativePool.end()).catch((error) => { console.error(error); process.exit(1); });
