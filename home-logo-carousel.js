(function () {
  var widget = document.querySelector('.elementor-element-f6bb50b.elementor-widget-image-carousel');
  if (!widget) {
    return;
  }

  var track = widget.querySelector('.elementor-image-carousel');
  var slides = Array.from(widget.querySelectorAll('.swiper-slide'));
  var prev = widget.querySelector('.elementor-swiper-button-prev');
  var next = widget.querySelector('.elementor-swiper-button-next');
  var index = 0;
  var timer = null;

  if (!track || !slides.length || !prev || !next) {
    return;
  }

  function visibleSlides() {
    return window.matchMedia('(max-width: 767px)').matches ? 2 : 6;
  }

  function maxIndex() {
    return Math.max(slides.length - visibleSlides(), 0);
  }

  function loadLogoImages() {
    slides.forEach(function (slide) {
      var image = slide.querySelector('img[data-wpfc-original-src]');
      if (image) {
        image.src = image.getAttribute('data-wpfc-original-src');
        image.removeAttribute('onload');
      }
    });
  }

  function update() {
    var visible = visibleSlides();
    var limit = maxIndex();
    if (index > limit) {
      index = 0;
    }
    if (index < 0) {
      index = limit;
    }
    track.style.transform = 'translateX(' + ((index * -100) / visible) + '%)';
  }

  function go(step) {
    index += step;
    update();
  }

  function start() {
    stop();
    timer = window.setInterval(function () {
      go(1);
    }, 2000);
  }

  function stop() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  loadLogoImages();
  widget.classList.add('logo-carousel-ready');
  update();

  prev.addEventListener('click', function () {
    go(-1);
    start();
  });
  next.addEventListener('click', function () {
    go(1);
    start();
  });
  prev.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      go(-1);
      start();
    }
  });
  next.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      go(1);
      start();
    }
  });
  widget.addEventListener('mouseenter', stop);
  widget.addEventListener('mouseleave', start);
  window.addEventListener('resize', update);
  start();
})();
