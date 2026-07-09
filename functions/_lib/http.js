export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...headers
    }
  });
}

export function badRequest(message) {
  return json({ ok: false, error: message }, 400);
}

export function serverError(error) {
  const message = error instanceof Error ? error.message : 'Onbekende fout';
  return json({ ok: false, error: message }, 500);
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch (error) {
    return null;
  }
}

