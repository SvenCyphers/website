import { createToken, validateAdminPassword } from '../../_lib/auth.js';
import { badRequest, json, readJson, serverError } from '../../_lib/http.js';

export async function onRequestPost(context) {
  try {
    const body = await readJson(context.request);
    if (!body || typeof body.password !== 'string') {
      return badRequest('Wachtwoord ontbreekt.');
    }

    if (!validateAdminPassword(context.env, body.password)) {
      return json({ ok: false, error: 'Ongeldig wachtwoord.' }, 401);
    }

    return json({ ok: true, token: await createToken(context.env) });
  } catch (error) {
    return serverError(error);
  }
}

