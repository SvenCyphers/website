import { publicArticle } from '../../_lib/articles.js';
import { json, serverError } from '../../_lib/http.js';

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const includeDrafts = url.searchParams.get('drafts') === '1';
    const where = includeDrafts ? '' : "WHERE status = 'published'";
    const result = await context.env.DB.prepare(
      `SELECT id, slug, title, excerpt, content, category, image_url, status, published_at, created_at, updated_at
       FROM knowledgebase_articles
       ${where}
       ORDER BY COALESCE(NULLIF(published_at, ''), created_at) DESC`
    ).all();

    return json({ ok: true, articles: (result.results || []).map(publicArticle) });
  } catch (error) {
    return serverError(error);
  }
}

