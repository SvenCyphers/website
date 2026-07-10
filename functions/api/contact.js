import { json, serverError } from '../_lib/http.js';
const MAX_BODY_BYTES = 1024 * 1024;
const MAX_FIELDS = 80;
const MAX_FIELD_LENGTH = 4000;

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

  const safeValue = String(value).slice(0, MAX_FIELD_LENGTH);
  if (fields[key] === undefined) {
    fields[key] = safeValue;
    return;
  }

  if (!Array.isArray(fields[key])) {
    fields[key] = [fields[key]];
  }

  fields[key].push(safeValue);
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

    const contentLength = Number(context.request.headers.get('content-length') || 0);
    if (contentLength > MAX_BODY_BYTES) {
      return json({ ok: false, error: 'Formulier is te groot.' }, 413);
    }

    const formData = await context.request.formData();
    const fields = {};
    const labels = fieldLabels();
    let fieldCount = 0;

    for (const [rawKey, rawValue] of formData.entries()) {
      fieldCount += 1;
      if (fieldCount > MAX_FIELDS) {
        return json({ ok: false, error: 'Te veel velden.' }, 413);
      }
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
