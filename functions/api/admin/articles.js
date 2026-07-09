import { requireAdmin } from '../../_lib/auth.js';
import { normalizeArticle, publicArticle } from '../../_lib/articles.js';
import { badRequest, json, readJson, serverError } from '../../_lib/http.js';

export async function onRequestGet(context) {
  try {
    const denied = await requireAdmin(context);
    if (denied) {
      return denied;
    }

    const result = await context.env.DB.prepare(
      `SELECT id, slug, title, excerpt, content, category, image_url, status, published_at, created_at, updated_at
       FROM knowledgebase_articles
       ORDER BY updated_at DESC`
    ).all();

    return json({ ok: true, articles: (result.results || []).map(publicArticle) });
  } catch (error) {
    return serverError(error);
  }
}

export async function onRequestPost(context) {
  try {
    const denied = await requireAdmin(context);
    if (denied) {
      return denied;
    }

    const body = await readJson(context.request);
    const article = normalizeArticle(body || {});
    if (!article.title || !article.slug) {
      return badRequest('Titel en slug zijn verplicht.');
    }

    const result = await context.env.DB.prepare(
      `INSERT INTO knowledgebase_articles
        (slug, title, excerpt, content, category, image_url, status, published_at, created_at, updated_at)
       VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
       ON CONFLICT(slug) DO UPDATE SET
        title = excluded.title,
        excerpt = excluded.excerpt,
        content = excluded.content,
        category = excluded.category,
        image_url = excluded.image_url,
        status = excluded.status,
        published_at = excluded.published_at,
        updated_at = datetime('now')`
    ).bind(
      article.slug,
      article.title,
      article.excerpt,
      article.content,
      article.category,
      article.image_url,
      article.status,
      article.published_at
    ).run();

    return json({ ok: true, result });
  } catch (error) {
    return serverError(error);
  }
}

