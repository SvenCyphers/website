(function () {
  var perPage = 6;
  var currentPage = 1;
  var section = null;

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
    var imageUrl = safeImageUrl(article.image_url);
    return [
      '<article class="kb-card">',
      imageUrl ? '<img src="' + escapeHtml(imageUrl) + '" alt="">' : '',
      '<div class="kb-card-body">',
      '<span>' + escapeHtml(article.category || 'Artikel') + '</span>',
      '<h2>' + escapeHtml(article.title) + '</h2>',
      '<p>' + escapeHtml(article.excerpt) + '</p>',
      '<a href="/artikel/?slug=' + encodeURIComponent(article.slug) + '">Lees artikel</a>',
      '</div>',
      '</article>'
    ].join('');
  }

  function safeImageUrl(value) {
    var url = String(value || '').trim();
    if (/^(https:\/\/|\/|data:image\/(?:png|jpeg|webp);base64,)/i.test(url)) {
      return url;
    }
    return '';
  }

  function hideLegacyArticles() {
    var legacy = document.getElementById('articles');
    if (legacy) {
      legacy.style.display = 'none';
    }
  }

  function mount(section) {
    var main = document.querySelector('[data-elementor-type="wp-page"]') || document.body;
    var legacy = document.getElementById('articles');
    if (legacy && legacy.parentNode) {
      legacy.parentNode.insertBefore(section, legacy);
      return;
    }
    var firstContentSection = main.querySelector('.e-con.e-parent:nth-of-type(2), .elementor-element.e-con:nth-of-type(2)');
    if (firstContentSection && firstContentSection.parentNode) {
      firstContentSection.parentNode.insertBefore(section, firstContentSection);
      return;
    }
    main.insertBefore(section, main.firstChild);
  }

  function setContent(html) {
    if (!section) {
      section = document.createElement('section');
      section.className = 'kb-dynamic';
      mount(section);
    }
    section.innerHTML = html;
  }

  function message(text, hideLegacy) {
    setContent([
      '<div class="kb-dynamic-inner">',
      '<div class="kb-dynamic-head"><p>Kennisbank</p><h2>Dynamische artikelen</h2></div>',
      '<p class="kb-notice">' + escapeHtml(text) + '</p>',
      '</div>'
    ].join(''));
    section.classList.add('kb-dynamic-message');
    if (hideLegacy) {
      hideLegacyArticles();
    }
  }

  function pagination(meta) {
    var totalPages = meta && meta.total_pages ? meta.total_pages : 1;
    if (totalPages <= 1) {
      return '';
    }
    return [
      '<nav class="kb-pagination" aria-label="Kennisbank pagina navigatie">',
      '<button type="button" class="kb-page-button" data-page="' + (currentPage - 1) + '"' + (currentPage <= 1 ? ' disabled' : '') + '>Vorige</button>',
      '<span>Pagina ' + currentPage + ' van ' + totalPages + '</span>',
      '<button type="button" class="kb-page-button" data-page="' + (currentPage + 1) + '"' + (currentPage >= totalPages ? ' disabled' : '') + '>Volgende</button>',
      '</nav>'
    ].join('');
  }

  function bindPagination(meta) {
    if (!section || !meta || meta.total_pages <= 1) {
      return;
    }
    Array.from(section.querySelectorAll('.kb-page-button')).forEach(function (button) {
      button.addEventListener('click', function () {
        var page = parseInt(button.getAttribute('data-page'), 10);
        if (page >= 1 && page <= meta.total_pages && page !== currentPage) {
          currentPage = page;
          loadArticles();
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  function loadArticles() {
    fetch('/api/knowledgebase?page=' + currentPage + '&per_page=' + perPage, { cache: 'no-store' })
      .then(function (response) {
        return response.json().then(function (data) {
          if (!response.ok) {
            throw new Error(data.error || 'Kennisbank API gaf geen geldige response.');
          }
          return data;
        });
      })
      .then(function (data) {
        if (!data.ok || !data.articles || !data.articles.length) {
          message('Er zijn nog geen gepubliceerde dynamische artikelen gevonden.', true);
          return;
        }

        section && section.classList.remove('kb-dynamic-message');
        setContent([
          '<div class="kb-dynamic-inner">',
          '<div class="kb-dynamic-head"><p>Kennisbank</p><h2>Nieuwste artikelen</h2></div>',
          '<div class="kb-grid">',
          data.articles.map(card).join(''),
          '</div>',
          pagination(data.pagination),
          '</div>'
        ].join(''));
        hideLegacyArticles();
        bindPagination(data.pagination);
      })
      .catch(function (error) {
        message(error.message || 'De dynamische kennisbank kon niet worden geladen.', false);
      });
  }

  loadArticles();
})();
