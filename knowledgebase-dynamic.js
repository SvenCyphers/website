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

  function card(article) {
    return [
      '<article class="kb-card">',
      article.image_url ? '<img src="' + escapeHtml(article.image_url) + '" alt="">' : '',
      '<div class="kb-card-body">',
      '<span>' + escapeHtml(article.category || 'Artikel') + '</span>',
      '<h2>' + escapeHtml(article.title) + '</h2>',
      '<p>' + escapeHtml(article.excerpt) + '</p>',
      '<a href="/artikel/?slug=' + encodeURIComponent(article.slug) + '">Lees artikel</a>',
      '</div>',
      '</article>'
    ].join('');
  }

  fetch('/api/knowledgebase')
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      if (!data.ok || !data.articles || !data.articles.length) {
        return;
      }
      var section = document.createElement('section');
      section.className = 'kb-dynamic';
      section.innerHTML = [
        '<div class="kb-dynamic-inner">',
        '<div class="kb-dynamic-head"><p>Kennisbank</p><h2>Nieuwste artikelen</h2></div>',
        '<div class="kb-grid">',
        data.articles.map(card).join(''),
        '</div>',
        '</div>'
      ].join('');

      var main = document.querySelector('[data-elementor-type="wp-page"]') || document.body;
      main.appendChild(section);
    })
    .catch(function () {});
})();

