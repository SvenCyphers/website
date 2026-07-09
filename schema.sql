CREATE TABLE IF NOT EXISTS contact_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  page TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  organization TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  fields_json TEXT NOT NULL DEFAULT '{}',
  user_agent TEXT NOT NULL DEFAULT '',
  ip_hash TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at
  ON contact_submissions (created_at DESC);

CREATE TABLE IF NOT EXISTS knowledgebase_articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Artikel',
  image_url TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  published_at TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_knowledgebase_articles_status_published
  ON knowledgebase_articles (status, published_at DESC);

INSERT OR IGNORE INTO knowledgebase_articles
  (slug, title, excerpt, content, category, image_url, status, published_at)
VALUES
  (
    'lokale-llms-in-de-praktijk-wat-kunnen-ze-en-wanneer-zet-je-ze-in',
    'Lokale LLMs in de praktijk: wat kunnen ze, en wanneer zet je ze in?',
    'Een praktische blik op lokale taalmodellen en wanneer je ze veilig inzet.',
    '<p>Gebruik dit artikel als startpunt in het beheer. Vervang deze tekst door de definitieve inhoud zodra je de dynamische kennisbank gaat vullen.</p>',
    'Artikel',
    '/wp-content/uploads/2026/02/AI-Technology.png',
    'published',
    '2026-05-26'
  ),
  (
    'van-spreadsheets-naar-dashboardsde-stap-die-elke-organisatie-moetmaken',
    'Van spreadsheets naar dashboards',
    'De stap van losse Excel-bestanden naar betrouwbare dashboards.',
    '<p>Gebruik dit artikel als startpunt in het beheer. Vervang deze tekst door de definitieve inhoud zodra je de dynamische kennisbank gaat vullen.</p>',
    'Artikel',
    '/wp-content/uploads/2026/03/Container-1-1.png',
    'published',
    '2026-05-26'
  ),
  (
    '5-valkuilen-bij-het-implementeren-vaneen-dataplatform',
    'Valkuilen bij het implementeren van een dataplatform',
    'Vijf veelvoorkomende risico''s bij dataplatforms en hoe je ze voorkomt.',
    '<p>Gebruik dit artikel als startpunt in het beheer. Vervang deze tekst door de definitieve inhoud zodra je de dynamische kennisbank gaat vullen.</p>',
    'Artikel',
    '/wp-content/uploads/2026/02/Data-Engineering.png',
    'published',
    '2026-05-26'
  );
