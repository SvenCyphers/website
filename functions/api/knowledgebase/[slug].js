import { publicArticle } from '../../_lib/articles.js';
import { json, serverError } from '../../_lib/http.js';

export async function onRequestGet(context) {
  try {
    const slug = context.params.slug;
    const row = await context.env.DB.prepare(
      `SELECT id, slug, title, excerpt, content, category, image_url, status, published_at, created_at, updated_at
       FROM knowledgebase_articles
       WHERE slug = ? AND status = 'published'
       LIMIT 1`
    ).bind(slug).first();

    if (!row) {
      return json({ ok: false, error: 'Artikel niet gevonden.' }, 404);
    }

    return json({ ok: true, article: publicArticle(row) });
  } catch (error) {
    return serverError(error);
  }
}
