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
    template.content.querySelectorAll('script, iframe, object, embed, form, link, meta, style, svg, math').forEach(function (node) {
      node.remove();
    });
    template.content.querySelectorAll('*').forEach(function (node) {
      Array.from(node.attributes).forEach(function (attribute) {
        var name = attribute.name.toLowerCase();
        var value = String(attribute.value || '').trim();
        if (/^on/i.test(name) || name === 'srcdoc' || name === 'style') {
          node.removeAttribute(attribute.name);
          return;
        }
        if ((name === 'href' || name === 'src') && !safeUrl(value)) {
          node.removeAttribute(attribute.name);
        }
      });
    });
    return template.innerHTML;
  }

  function safeUrl(value) {
    return /^(https?:\/\/|\/|#|mailto:|tel:|data:image\/(?:png|jpeg|webp);base64,)/i.test(value);
  }

  function safeImageUrl(value) {
    var url = String(value || '').trim();
    return safeUrl(url) ? url : '';
  }

  function render(article) {
    var imageUrl = safeImageUrl(article.image_url);
    document.title = article.title + ' | Cyphers';
    document.querySelector('#article').innerHTML = [
      '<p class="eyebrow">' + escapeHtml(article.category || 'Kennisbank') + '</p>',
      '<h1>' + escapeHtml(article.title) + '</h1>',
      '<p class="meta">' + escapeHtml(article.published_at || '') + '</p>',
      imageUrl ? '<img src="' + escapeHtml(imageUrl) + '" alt="">' : '',
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
