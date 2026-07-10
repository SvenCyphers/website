export function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function limit(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

function normalizeImageInput(value) {
  const imageUrl = limit(value, 500000);
  if (!imageUrl) {
    return '';
  }
  if (imageUrl.startsWith('/')) {
    return imageUrl;
  }
  if (/^https:\/\/[^\s"'<>]+$/i.test(imageUrl)) {
    return imageUrl;
  }
  if (/^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(imageUrl) && imageUrl.length <= 450000) {
    return imageUrl;
  }
  return '';
}

export function normalizeArticle(input) {
  const title = limit(input.title, 180);
  const slug = slugify(input.slug || title);
  return {
    slug,
    title,
    excerpt: limit(input.excerpt, 500),
    content: limit(input.content, 60000),
    category: limit(input.category || 'Artikel', 80) || 'Artikel',
    image_url: normalizeImageInput(input.image_url),
    status: input.status === 'published' ? 'published' : 'draft',
    published_at: /^\d{4}-\d{2}-\d{2}$/.test(String(input.published_at || '')) ? String(input.published_at) : ''
  };
}

function normalizeImageUrl(value) {
  const imageUrl = String(value || '').trim();
  const movedImages = {
    '/wp-content/uploads/2026/03/AI-Technology.png': '/wp-content/uploads/2026/02/AI-Technology.png',
    '/wp-content/uploads/2026/03/Data-Engineering.png': '/wp-content/uploads/2026/02/Data-Engineering.png'
  };
  return movedImages[imageUrl] || imageUrl;
}

export function publicArticle(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    category: row.category,
    image_url: normalizeImageUrl(row.image_url),
    status: row.status,
    published_at: row.published_at,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

export function publicArticleSummary(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    category: row.category,
    image_url: normalizeImageUrl(row.image_url),
    status: row.status,
    published_at: row.published_at,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}
