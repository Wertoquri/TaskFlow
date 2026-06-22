const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required');
}

const nativePool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  max: Number(process.env.DB_POOL_SIZE || 10),
});

function compileQuery(query, params = []) {
  let index = 0;
  const values = [];
  const text = query.replace(/`([^`]+)`/g, '"$1"').replace(/\?/g, () => {
    const value = params[index++];
    if (Array.isArray(value)) {
      if (!value.length) return 'NULL';
      return value.map((item) => {
        values.push(item);
        return `$${values.length}`;
      }).join(', ');
    }
    values.push(value);
    return `$${values.length}`;
  });
  return { text, values };
}

function normalizeRows(rows) {
  return rows.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => {
    if ((key === 'cnt' || key === 'n') && typeof value === 'string' && /^\d+$/.test(value)) {
      return [key, Number(value)];
    }
    return [key, value];
  })));
}

async function execute(query, params = [], { returnId = false } = {}) {
  let { text, values } = compileQuery(query, params);
  const isInsert = /^\s*INSERT\b/i.test(text);
  if (returnId && isInsert && !/\bRETURNING\b/i.test(text)) text += ' RETURNING id';
  const result = await nativePool.query(text, values);
  return {
    rows: normalizeRows(result.rows || []),
    insertId: result.rows?.[0]?.id ?? null,
    affectedRows: result.rowCount || 0,
  };
}

const pool = {
  async query(query, params = []) {
    const result = await execute(query, params, { returnId: /^\s*INSERT\b/i.test(query) });
    if (/^\s*(SELECT|WITH)\b/i.test(query)) return [result.rows];
    return [{ insertId: result.insertId, affectedRows: result.affectedRows }];
  },
  end: () => nativePool.end(),
};

async function getQuery(query, params = []) {
  return (await execute(query, params)).rows;
}

async function run(query, params = []) {
  const result = await execute(query, params, { returnId: /^\s*INSERT\b/i.test(query) });
  return { insertId: result.insertId, affectedRows: result.affectedRows };
}

module.exports = { pool, nativePool, getQuery, run };
