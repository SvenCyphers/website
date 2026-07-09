export function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

export function normalizeArticle(input) {
  const title = String(input.title || '').trim();
  const slug = slugify(input.slug || title);
  return {
    slug,
    title,
    excerpt: String(input.excerpt || '').trim(),
    content: String(input.content || '').trim(),
    category: String(input.category || 'Artikel').trim() || 'Artikel',
    image_url: String(input.image_url || '').trim(),
    status: input.status === 'published' ? 'published' : 'draft',
    published_at: String(input.published_at || '').trim()
  };
}

export function publicArticle(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    category: row.category,
    image_url: row.image_url,
    status: row.status,
    published_at: row.published_at,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

