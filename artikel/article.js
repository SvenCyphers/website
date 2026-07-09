(function () {
  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, function (char) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      }[char];
    });
  }

  function safeContent(html) {
    var template = document.createElement('template');
    template.innerHTML = String(html || '');
    template.content.querySelectorAll('script, iframe, object, embed, form').forEach(function (node) {
      node.remove();
    });
    template.content.querySelectorAll('*').forEach(function (node) {
      Array.from(node.attributes).forEach(function (attribute) {
        if (/^on/i.test(attribute.name)) {
          node.removeAttribute(attribute.name);
        }
      });
    });
    return template.innerHTML;
  }

  function render(article) {
    document.title = article.title + ' | Cyphers';
    document.querySelector('#article').innerHTML = [
      '<p class="eyebrow">' + escapeHtml(article.category || 'Kennisbank') + '</p>',
      '<h1>' + escapeHtml(article.title) + '</h1>',
      '<p class="meta">' + escapeHtml(article.published_at || '') + '</p>',
      article.image_url ? '<img src="' + escapeHtml(article.image_url) + '" alt="">' : '',
      article.excerpt ? '<p class="excerpt">' + escapeHtml(article.excerpt) + '</p>' : '',
      '<div class="content">' + safeContent(article.content || '<p>Dit artikel heeft nog geen inhoud.</p>') + '</div>',
      '<a class="back" href="/kennisbank/">Terug naar kennisbank</a>'
    ].join('');
  }

  var slug = new URLSearchParams(window.location.search).get('slug');
  if (!slug) {
    document.querySelector('#article').innerHTML = '<h1>Artikel niet gevonden</h1><a class="back" href="/kennisbank/">Terug naar kennisbank</a>';
    return;
  }

  fetch('/api/knowledgebase/' + encodeURIComponent(slug))
    .then(function (response) {
      return response.json().then(function (data) {
        if (!response.ok || data.ok === false) {
          throw new Error(data.error || 'Artikel niet gevonden.');
        }
        return data.article;
      });
    })
    .then(render)
    .catch(function () {
      document.querySelector('#article').innerHTML = '<h1>Artikel niet gevonden</h1><a class="back" href="/kennisbank/">Terug naar kennisbank</a>';
    });
})();

