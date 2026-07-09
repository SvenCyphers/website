function json(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: {
      'content-type': 'application/json; charset=utf-8'
    }
  });
}

function cleanKey(key) {
  return key
    .replace(/^form_fields\[/, '')
    .replace(/\](\[\])?$/, '')
    .replace(/\[\]$/, '');
}

function appendField(fields, key, value) {
  if (!key || value === '') {
    return;
  }

  if (fields[key] === undefined) {
    fields[key] = value;
    return;
  }

  if (!Array.isArray(fields[key])) {
    fields[key] = [fields[key]];
  }

  fields[key].push(value);
}

function pick(fields, names) {
  for (const name of names) {
    const value = fields[name];
    if (Array.isArray(value) && value.length) {
      return value.join(', ');
    }
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
}

export async function onRequestPost(context) {
  const db = context.env.DB;
  if (!db) {
    return json({ ok: false, error: 'D1 binding DB ontbreekt.' }, 500);
  }

  const formData = await context.request.formData();
  const fields = {};

  for (const [rawKey, rawValue] of formData.entries()) {
    if (rawValue instanceof File) {
      appendField(fields, cleanKey(rawKey), rawValue.name);
    } else {
      appendField(fields, cleanKey(rawKey), String(rawValue).trim());
    }
  }

  const name = [
    pick(fields, ['name']),
    pick(fields, ['field_d7b39ad', 'field_80cf0e2'])
  ].filter(Boolean).join(' ').trim();
  const email = pick(fields, ['user_email', 'email', 'field_e39ea81', 'field_697e0d3']);
  const phone = pick(fields, ['field_4bde368', 'field_2997757', 'phone']);
  const organization = pick(fields, ['field_2f87ef7', 'field_343e9b8', 'organization']);
  const message = pick(fields, ['message', 'field_467d84f']);
  const page = context.request.headers.get('referer') || '';
  const userAgent = context.request.headers.get('user-agent') || '';
  const ipHashSource = context.request.headers.get('cf-connecting-ip') || '';
  const ipHash = ipHashSource
    ? Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ipHashSource))))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('')
    : '';

  await db.prepare(
    `INSERT INTO contact_submissions
      (created_at, page, name, email, phone, organization, message, fields_json, user_agent, ip_hash)
     VALUES
      (datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    page,
    name,
    email,
    phone,
    organization,
    message,
    JSON.stringify(fields),
    userAgent,
    ipHash
  ).run();

  return json({ ok: true });
}

export function onRequestGet() {
  return json({ ok: false, error: 'Method not allowed' }, 405);
}

