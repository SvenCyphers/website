import { json, serverError } from '../_lib/http.js';

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

function fieldLabels() {
  return {
    name: 'Voornaam / aanvraagtype',
    field_d7b39ad: 'Achternaam',
    user_email: 'E-mail',
    email: 'E-mail',
    field_e39ea81: 'E-mail',
    field_697e0d3: 'E-mail',
    field_4bde368: 'Telefoon',
    field_2997757: 'Telefoon',
    field_2f87ef7: 'Organisatie',
    field_343e9b8: 'Organisatie / ziekenhuis',
    field_2ca9a38: 'Afdeling',
    field_7beced1: 'Voornaam',
    field_80cf0e2: 'Achternaam',
    field_baf6a7f: 'Functie',
    field_7ab6f71: 'Interesse',
    field_b812cfa: 'Gewenste vervolgstap',
    field_08a3790: 'Privacy akkoord',
    field_595d865: 'Privacy akkoord',
    field_b491a16: 'Achternaam',
    field_b25b335: 'Telefoon',
    field_caebaf3: 'LinkedIn',
    field_f78d85c: 'Motivatie',
    field_4afffbc: 'CV',
    field_d9c8a2a: 'Portfolio',
    message: 'Bericht',
    field_467d84f: 'Bericht'
  };
}

export async function onRequestPost(context) {
  try {
    const db = context.env.DB;
    if (!db) {
      return json({ ok: false, error: 'D1 binding DB ontbreekt.' }, 500);
    }

    const formData = await context.request.formData();
    const fields = {};
    const labels = fieldLabels();

    for (const [rawKey, rawValue] of formData.entries()) {
      const key = cleanKey(rawKey);
      if (key === 'website' || key === 'url') {
        return json({ ok: true });
      }
      if (rawValue instanceof File) {
        appendField(fields, key, rawValue.name);
      } else {
        appendField(fields, key, String(rawValue).trim());
      }
    }

    const firstName = pick(fields, ['field_7beced1', 'name']);
    const lastName = pick(fields, ['field_d7b39ad', 'field_80cf0e2', 'field_b491a16']);
    const name = [firstName, lastName].filter(Boolean).join(' ').trim() || 'Website bezoeker';
    const email = pick(fields, ['user_email', 'email', 'field_e39ea81', 'field_697e0d3']);
    const phone = pick(fields, ['field_4bde368', 'field_2997757', 'field_b25b335', 'phone']);
    const organization = pick(fields, ['field_2f87ef7', 'field_343e9b8', 'organization']);
    const message = pick(fields, ['message', 'field_467d84f', 'field_f78d85c']);
    const formName = String(formData.get('form_name') || formData.get('form_id') || '').trim();
    const page = context.request.headers.get('referer') || '';
    const userAgent = context.request.headers.get('user-agent') || '';
    const ipHashSource = context.request.headers.get('cf-connecting-ip') || '';
    const ipHash = ipHashSource
      ? Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ipHashSource))))
          .map((byte) => byte.toString(16).padStart(2, '0'))
          .join('')
      : '';

    const enrichedFields = Object.fromEntries(
      Object.entries(fields).map(([key, value]) => [labels[key] || key, value])
    );

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
      JSON.stringify({ formName, raw: fields, labels: enrichedFields }),
      userAgent,
      ipHash
    ).run();

    return json({ ok: true });
  } catch (error) {
    return serverError(error);
  }
}

export function onRequestGet() {
  return json({ ok: false, error: 'Method not allowed' }, 405);
}
