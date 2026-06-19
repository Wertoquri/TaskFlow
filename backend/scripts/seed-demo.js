const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { pool } = require('../db');
async function seed() {
  if (process.env.DEMO_SEED !== 'true') return;
  const email = process.env.DEMO_EMAIL || 'demo@taskflow.local';
  const password = process.env.DEMO_PASSWORD || 'DemoPass123';
  const hash = await bcrypt.hash(password, 10);
  await pool.query(`INSERT INTO users (username,email,password,is_verified) VALUES ('demo',?,?,1) ON DUPLICATE KEY UPDATE password=VALUES(password),is_verified=1`, [email, hash]);
  const [[user]] = await pool.query('SELECT id FROM users WHERE email=?', [email]);
  await pool.query(`INSERT INTO projects (name,description,owner_id) SELECT 'Website launch','Client-ready demo workspace',? WHERE NOT EXISTS (SELECT 1 FROM projects WHERE owner_id=? AND name='Website launch')`, [user.id, user.id]);
  const [[project]] = await pool.query("SELECT id FROM projects WHERE owner_id=? AND name='Website launch'", [user.id]);
  await pool.query("INSERT IGNORE INTO project_members (project_id,user_id,role) VALUES (?,?,'admin')", [project.id,user.id]);
  const [[count]] = await pool.query('SELECT COUNT(*) AS n FROM tasks WHERE project_id=?', [project.id]);
  if (!count.n) await pool.query(`INSERT INTO tasks (project_id,title,description,status,priority,owner_id,created_by,labels) VALUES (?, 'Approve visual direction', 'Review the final design with stakeholders', 'todo', 'high', ?, ?, JSON_ARRAY('design')), (?, 'Prepare launch checklist', 'Validate analytics, SEO and rollback plan', 'in-progress', 'medium', ?, ?, JSON_ARRAY('release')), (?, 'Project kickoff', 'Scope and responsibilities confirmed', 'done', 'low', ?, ?, JSON_ARRAY('planning'))`, [project.id,user.id,user.id,project.id,user.id,user.id,project.id,user.id,user.id]);
  console.log(`[demo] ${email} / ${password}`);
}
seed().then(()=>pool.end()).catch((error)=>{ console.error(error); process.exit(1); });
