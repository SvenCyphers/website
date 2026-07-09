import { publicArticle } from '../../_lib/articles.js';
import { json, serverError } from '../../_lib/http.js';

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const includeDrafts = url.searchParams.get('drafts') === '1';
    const page = Math.max(parseInt(url.searchParams.get('page') || '1', 10) || 1, 1);
    const perPage = Math.min(Math.max(parseInt(url.searchParams.get('per_page') || '6', 10) || 6, 1), 6);
    const offset = (page - 1) * perPage;
    const where = includeDrafts ? '' : "WHERE status = 'published'";
    const totalResult = await context.env.DB.prepare(
      `SELECT COUNT(*) AS total
       FROM knowledgebase_articles
       ${where}`
    ).first();
    const result = await context.env.DB.prepare(
      `SELECT id, slug, title, excerpt, content, category, image_url, status, published_at, created_at, updated_at
       FROM knowledgebase_articles
       ${where}
       ORDER BY
        COALESCE(NULLIF(published_at, ''), updated_at, created_at) DESC,
        updated_at DESC,
        created_at DESC,
        id DESC
       LIMIT ? OFFSET ?`
    ).bind(perPage, offset).all();

    const total = Number(totalResult?.total || 0);
    return json({
      ok: true,
      articles: (result.results || []).map(publicArticle),
      pagination: {
        page,
        per_page: perPage,
        total,
        total_pages: Math.max(Math.ceil(total / perPage), 1)
      }
    });
  } catch (error) {
    return serverError(error);
  }
}
