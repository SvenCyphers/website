import { requireAdmin } from '../../_lib/auth.js';
import { json } from '../../_lib/http.js';

export async function onRequestGet(context) {
  const denied = await requireAdmin(context);
  if (denied) {
    return denied;
  }
  return json({ ok: true });
}

