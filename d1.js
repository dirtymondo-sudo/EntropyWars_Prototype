// ── Entropy Wars: Cloudflare D1 Helper ──
// Wraps the Cloudflare D1 REST API for server-side database access.
// Requires env vars: CF_ACCOUNT_ID, CF_D1_DATABASE_ID, CF_API_TOKEN

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID || '';
const CF_D1_DATABASE_ID = process.env.CF_D1_DATABASE_ID || '';
const CF_API_TOKEN = process.env.CF_API_TOKEN || '';

const D1_BASE = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_D1_DATABASE_ID}`;

/**
 * Check if D1 is configured (all env vars present)
 */
function isConfigured() {
    return !!(CF_ACCOUNT_ID && CF_D1_DATABASE_ID && CF_API_TOKEN);
}

/**
 * Execute a D1 SQL query
 * @param {string} sql - SQL statement
 * @param {Array} params - Bound parameters (positional ?1, ?2 etc.)
 * @returns {Promise<{results: Array, meta: Object}>}
 */
async function query(sql, params = []) {
    if (!isConfigured()) {
        throw new Error('[D1] Not configured — set CF_ACCOUNT_ID, CF_D1_DATABASE_ID, CF_API_TOKEN env vars');
    }

    const resp = await fetch(`${D1_BASE}/query`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${CF_API_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql, params }),
    });

    if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`[D1] HTTP ${resp.status}: ${text}`);
    }

    const data = await resp.json();

    if (!data.success) {
        const errMsg = data.errors && data.errors.length > 0
            ? data.errors.map(e => e.message).join(', ')
            : 'Unknown D1 error';
        throw new Error(`[D1] ${errMsg}`);
    }

    // D1 returns results as an array of result sets (one per statement)
    const resultSet = data.result && data.result[0];
    return {
        results: resultSet ? resultSet.results || [] : [],
        meta: resultSet ? resultSet.meta || {} : {},
    };
}

/**
 * Execute a write query (INSERT, UPDATE, DELETE)
 * Same as query() but semantic alias
 */
async function execute(sql, params = []) {
    return query(sql, params);
}

/**
 * Get a single row
 */
async function getOne(sql, params = []) {
    const { results } = await query(sql, params);
    return results.length > 0 ? results[0] : null;
}

/**
 * Get all rows
 */
async function getAll(sql, params = []) {
    const { results } = await query(sql, params);
    return results;
}

module.exports = { isConfigured, query, execute, getOne, getAll };
