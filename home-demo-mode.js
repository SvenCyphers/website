(function () {
  var params = new URLSearchParams(window.location.search);
  if (params.get('demo') !== 'gek') {
    return;
  }

  var hero = document.querySelector('.elementor-element-9eaf5ac');
  if (!hero) {
    return;
  }

  hero.style.backgroundImage = 'url("/demo-weird-hero.svg")';
  hero.style.backgroundPosition = 'center center';
  hero.style.backgroundSize = 'cover';

  var badge = document.createElement('div');
  badge.textContent = 'DEMO: foto tijdelijk vervangen';
  badge.style.position = 'absolute';
  badge.style.right = '20px';
  badge.style.bottom = '20px';
  badge.style.zIndex = '5';
  badge.style.background = '#fde047';
  badge.style.color = '#111827';
  badge.style.font = '700 13px Inter, Arial, sans-serif';
  badge.style.letterSpacing = '0';
  badge.style.padding = '10px 14px';
  badge.style.borderRadius = '6px';
  badge.style.boxShadow = '0 10px 30px rgba(15, 23, 42, 0.28)';
  hero.style.position = 'relative';
  hero.appendChild(badge);
})();
