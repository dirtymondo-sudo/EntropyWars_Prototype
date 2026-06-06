const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID || '';
const CF_D1_DATABASE_ID = process.env.CF_D1_DATABASE_ID || '';
const CF_API_TOKEN = process.env.CF_API_TOKEN || '';

const D1_BASE = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_D1_DATABASE_ID}`;

function isConfigured() {
    return !!(CF_ACCOUNT_ID && CF_D1_DATABASE_ID && CF_API_TOKEN);
}

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

    const resultSet = data.result && data.result[0];
    return {
        results: resultSet ? resultSet.results || [] : [],
        meta: resultSet ? resultSet.meta || {} : {},
    };
}

async function execute(sql, params = []) {
    return query(sql, params);
}

async function getOne(sql, params = []) {
    const { results } = await query(sql, params);
    return results.length > 0 ? results[0] : null;
}

async function getAll(sql, params = []) {
    const { results } = await query(sql, params);
    return results;
}

module.exports = { isConfigured, query, execute, getOne, getAll };
