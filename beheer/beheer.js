(function () {
  var tokenKey = 'cyphers_admin_token';
  var token = localStorage.getItem(tokenKey) || '';
  var articles = [];
  var activeArticle = null;

  function qs(selector) {
    return document.querySelector(selector);
  }

  function request(path, options) {
    options = options || {};
    options.headers = options.headers || {};
    if (token) {
      options.headers.Authorization = 'Bearer ' + token;
    }
    if (options.body && !options.headers['Content-Type']) {
      options.headers['Content-Type'] = 'application/json';
    }
    return fetch(path, options).then(function (response) {
      return response.json().then(function (data) {
        if (!response.ok || data.ok === false) {
          throw new Error(data.error || 'Aanvraag mislukt.');
        }
        return data;
      });
    });
  }

  function showDashboard(show) {
    qs('#login-panel').classList.toggle('hidden', show);
    qs('#dashboard').classList.toggle('hidden', !show);
  }

  function setMessage(selector, text, error) {
    var element = qs(selector);
    element.textContent = text || '';
    element.classList.toggle('error', Boolean(error));
  }

  function fmt(value) {
    if (!value) return '';
    return new Date(value + 'Z').toLocaleString('nl-NL');
  }

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

  function loadSubmissions() {
    return request('/api/admin/submissions').then(function (data) {
      var body = qs('#submissions-body');
      body.innerHTML = '';
      data.submissions.forEach(function (item) {
        var row = document.createElement('tr');
        row.innerHTML = [
          '<td>' + escapeHtml(fmt(item.created_at)) + '</td>',
          '<td>' + escapeHtml(item.name) + '</td>',
          '<td><a href="mailto:' + escapeHtml(item.email) + '">' + escapeHtml(item.email) + '</a></td>',
          '<td>' + escapeHtml(item.organization) + '</td>',
          '<td>' + escapeHtml(item.message || item.page) + '</td>'
        ].join('');
        body.appendChild(row);
      });
    });
  }

  function renderArticles() {
    var list = qs('#article-list');
    list.innerHTML = '';
    articles.forEach(function (article) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = activeArticle && activeArticle.slug === article.slug ? 'active' : '';
      button.innerHTML = escapeHtml(article.title) + '<small>' + escapeHtml(article.status + ' - ' + article.slug) + '</small>';
      button.addEventListener('click', function () {
        editArticle(article);
      });
      list.appendChild(button);
    });
  }

  function editArticle(article) {
    activeArticle = article;
    var form = qs('#article-form');
    Array.from(form.elements).forEach(function (field) {
      if (field.name && Object.prototype.hasOwnProperty.call(article, field.name)) {
        field.value = article[field.name] || '';
      }
    });
    qs('#preview-link').href = '/artikel/?slug=' + encodeURIComponent(article.slug);
    renderArticles();
  }

  function newArticle() {
    editArticle({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      category: 'Artikel',
      image_url: '',
      status: 'draft',
      published_at: new Date().toISOString().slice(0, 10)
    });
  }

  function loadArticles() {
    return request('/api/admin/articles').then(function (data) {
      articles = data.articles;
      if (!activeArticle && articles.length) {
        activeArticle = articles[0];
      }
      renderArticles();
      if (activeArticle) {
        editArticle(articles.find(function (article) {
          return article.slug === activeArticle.slug;
        }) || articles[0]);
      } else {
        newArticle();
      }
    });
  }

  qs('#login-form').addEventListener('submit', function (event) {
    event.preventDefault();
    setMessage('#login-message', 'Bezig met inloggen...');
    request('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password: qs('#password').value })
    }).then(function (data) {
      token = data.token;
      localStorage.setItem(tokenKey, token);
      showDashboard(true);
      return Promise.all([loadSubmissions(), loadArticles()]);
    }).catch(function (error) {
      setMessage('#login-message', error.message, true);
    });
  });

  qs('#logout-button').addEventListener('click', function () {
    token = '';
    localStorage.removeItem(tokenKey);
    showDashboard(false);
  });

  document.querySelectorAll('.tabs button').forEach(function (button) {
    button.addEventListener('click', function () {
      document.querySelectorAll('.tabs button').forEach(function (tab) {
        tab.classList.toggle('active', tab === button);
      });
      qs('#submissions-tab').classList.toggle('hidden', button.dataset.tab !== 'submissions');
      qs('#articles-tab').classList.toggle('hidden', button.dataset.tab !== 'articles');
    });
  });

  qs('#refresh-submissions').addEventListener('click', loadSubmissions);
  qs('#new-article').addEventListener('click', newArticle);

  qs('#article-form').addEventListener('submit', function (event) {
    event.preventDefault();
    var data = Object.fromEntries(new FormData(event.currentTarget).entries());
    setMessage('#article-message', 'Opslaan...');
    request('/api/admin/articles', {
      method: 'POST',
      body: JSON.stringify(data)
    }).then(function () {
      setMessage('#article-message', 'Artikel opgeslagen.');
      activeArticle = data;
      return loadArticles();
    }).catch(function (error) {
      setMessage('#article-message', error.message, true);
    });
  });

  if (token) {
    request('/api/admin/session').then(function () {
      showDashboard(true);
      return Promise.all([loadSubmissions(), loadArticles()]);
    }).catch(function () {
      token = '';
      localStorage.removeItem(tokenKey);
      showDashboard(false);
    });
  }
})();

