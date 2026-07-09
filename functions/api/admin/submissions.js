import { requireAdmin } from '../../_lib/auth.js';
import { json, serverError } from '../../_lib/http.js';

export async function onRequestGet(context) {
  try {
    const denied = await requireAdmin(context);
    if (denied) {
      return denied;
    }

    const result = await context.env.DB.prepare(
      `SELECT id, created_at, page, name, email, phone, organization, message, fields_json
       FROM contact_submissions
       ORDER BY created_at DESC
       LIMIT 100`
    ).all();

    return json({ ok: true, submissions: result.results || [] });
  } catch (error) {
    return serverError(error);
  }
}

