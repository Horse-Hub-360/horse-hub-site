/* ==========================================================================
   HorseHub360 — interações da landing page
   - header dinâmico, menu mobile, barra de progresso
   - reveals com IntersectionObserver
   - parallax leve com requestAnimationFrame
   - FAQ accordion, voltar ao topo, vídeos sob demanda

   WhatsApp: os links ficam direto no index.html (https://wa.me/5517997032430).
   Para trocar o número, procure por "wa.me/" no HTML — são 4 ocorrências.
   ========================================================================== */
(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* --------------------------------------------------------- Ano no rodapé */
  var year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ------------------------------------------ Header + barra de progresso */
  var header = $('#siteHeader');
  var progress = $('#scrollProgress');
  var lastY = window.scrollY;

  function onScrollHeader() {
    var y = window.scrollY;

    if (header) {
      header.classList.toggle('is-scrolled', y > 40);
      // esconde ao descer, revela ao subir (apenas fora do topo e com menu fechado)
      var menuOpen = document.body.classList.contains('nav-open');
      if (!menuOpen && y > 400 && y > lastY + 6) header.classList.add('is-hidden');
      else if (y < lastY - 6 || y < 200) header.classList.remove('is-hidden');
    }

    if (progress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';
    }

    var toTop = $('#toTop');
    if (toTop) toTop.classList.toggle('is-visible', y > window.innerHeight * 0.9);

    lastY = y;
  }

  /* --------------------------------------------------------- Menu mobile -- */
  var toggle = $('#navToggle');
  var mobileNav = $('#mobileNav');

  function setMenu(open) {
    if (!toggle || !mobileNav) return;
    toggle.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    mobileNav.classList.toggle('is-open', open);
    mobileNav.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('nav-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) header && header.classList.remove('is-hidden');

    // entrada escalonada dos itens
    $$('.mobile-nav__list a', mobileNav).forEach(function (a, i) {
      a.style.transitionDelay = open ? (80 + i * 55) + 'ms' : '0ms';
    });
  }

  if (toggle) {
    toggle.addEventListener('click', function () {
      setMenu(!mobileNav.classList.contains('is-open'));
    });
  }
  if (mobileNav) {
    mobileNav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && mobileNav && mobileNav.classList.contains('is-open')) setMenu(false);
  });

  /* ------------------------------------------------------------- Reveals -- */
  var revealables = $$('[data-reveal], .reveal-mask');

  // O hero não espera o observador: revela assim que a página pinta.
  function revealHero () {
    $$('.hero [data-reveal], .hero .reveal-mask').forEach(function (el) {
      el.classList.add('is-visible');
    });
  }
  window.requestAnimationFrame(function () { window.requestAnimationFrame(revealHero); });
  window.setTimeout(revealHero, 400); // garantia se o rAF estiver suspenso (aba em segundo plano)

  if (prefersReduced || !('IntersectionObserver' in window)) {
    revealables.forEach(function (el) { el.classList.add('is-visible'); });
    $$('[data-chart] i').forEach(function (bar) { bar.style.height = (bar.dataset.h || 50) + '%'; });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });

    revealables.forEach(function (el) { revealObserver.observe(el); });

    // gráfico do portal do proprietário
    var charts = $$('[data-chart]');
    if (charts.length) {
      var chartObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          $$('i', entry.target).forEach(function (bar, i) {
            setTimeout(function () {
              bar.style.height = (bar.dataset.h || 50) + '%';
            }, i * 90);
          });
          chartObserver.unobserve(entry.target);
        });
      }, { threshold: 0.4 });
      charts.forEach(function (c) { chartObserver.observe(c); });
    }
  }

  /* --------------------------------------------------------------- Vídeos -- */
  /* Carregam sob demanda: só em telas maiores, com movimento permitido e
     fora do modo de economia de dados. Fora disso, fica o poster (imagem). */
  (function initVideos () {
    var videos = $$('video[data-video-src]');
    if (!videos.length) return;

    var conn = navigator.connection || {};
    var saveData = conn.saveData === true;
    var slow = /2g/.test(conn.effectiveType || '');
    // Rodam também no celular (os arquivos são leves); só não carregam com
    // movimento reduzido, economia de dados ou conexão muito lenta.
    var allow = !prefersReduced && !saveData && !slow;
    if (!allow || !('IntersectionObserver' in window)) return;

    var visible = [];
    var narrow = window.matchMedia('(max-width:860px)').matches;

    // Em telas estreitas usa o corte vertical, quando existir
    videos.forEach(function (v) {
      if (narrow && v.dataset.posterMobile) v.poster = v.dataset.posterMobile;
    });

    function sourceFor (video) {
      return (narrow && video.dataset.videoSrcMobile) || video.dataset.videoSrc;
    }

    function tryPlay (video) {
      if (!video.src) {
        video.src = sourceFor(video);
        video.load();                          // preload="none" exige o load explícito
        video.addEventListener('loadeddata', function () {
          video.classList.add('is-playing');   // só revela quando já há imagem de fato
          var pp = video.play();
          if (pp && pp.catch) pp.catch(function () {});
        }, { once: true });
      }
      var p = video.play();
      if (p && p.catch) p.catch(function () { /* autoplay bloqueado: fica o poster */ });
    }

    var videoObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var video = entry.target;
        var i = visible.indexOf(video);
        if (entry.isIntersecting) {
          if (i === -1) visible.push(video);
          tryPlay(video);
        } else {
          if (i > -1) visible.splice(i, 1);
          if (!video.paused) video.pause();
        }
      });
    }, { threshold: 0.15 });

    videos.forEach(function (v) {
      v.muted = true;                 // exigido para autoplay em iOS/Safari
      if (v.classList.contains('is-hero')) {
        // o hero está sempre visível na abertura: começa sem esperar o observador
        visible.push(v);
        tryPlay(v);
      }
      videoObserver.observe(v);
    });

    // Ao voltar para a aba, o navegador pode ter adiado o carregamento: tenta de novo.
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') visible.forEach(tryPlay);
    });
  })();

  /* ------------------------------------------------------------ Parallax -- */
  var parallaxItems = [];
  if (!prefersReduced) {
    parallaxItems = $$('[data-parallax]').map(function (el) {
      return {
        el: el,
        box: el.parentElement || el,
        speed: parseFloat(el.dataset.speed) || 0.15
      };
    });
  }

  function updateParallax() {
    if (!parallaxItems.length) return;
    var vh = window.innerHeight;
    var scale = window.innerWidth < 768 ? 0.55 : 1; // efeito mais discreto no celular

    for (var i = 0; i < parallaxItems.length; i++) {
      var it = parallaxItems[i];
      var r = it.box.getBoundingClientRect();
      if (r.bottom < -240 || r.top > vh + 240) continue;
      var center = r.top + r.height / 2;
      var offset = (vh / 2 - center) * it.speed * scale;
      it.el.style.transform = 'translate3d(0,' + offset.toFixed(2) + 'px,0)';
    }
  }

  /* ---------------------------------------------- Loop único de scroll ---- */
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      onScrollHeader();
      updateParallax();
      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScrollHeader();
  updateParallax();

  /* ------------------------------------------------- Link ativo no menu -- */
  var sections = $$('main section[id]');
  var navLinks = $$('.nav__link');
  if (sections.length && navLinks.length && 'IntersectionObserver' in window) {
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.id;
        navLinks.forEach(function (link) {
          link.classList.toggle('is-active', link.getAttribute('href') === '#' + id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { navObserver.observe(s); });
  }

  /* ----------------------------------------------------------- FAQ ------- */
  $$('.faq__item').forEach(function (item) {
    var btn = $('.faq__q', item);
    if (!btn) return;
    btn.addEventListener('click', function () {
      var isOpen = item.classList.contains('is-open');
      // fecha os demais (comportamento accordion)
      $$('.faq__item.is-open').forEach(function (other) {
        if (other === item) return;
        other.classList.remove('is-open');
        var otherBtn = $('.faq__q', other);
        if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
      });
      item.classList.toggle('is-open', !isOpen);
      btn.setAttribute('aria-expanded', String(!isOpen));
    });
  });

  /* ------------------------------------------------------ Voltar ao topo -- */
  var toTopBtn = $('#toTop');
  if (toTopBtn) {
    toTopBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
    });
  }

  /* --------------------------- Âncoras com compensação do header fixo ----- */
  $$('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href');
      if (!id || id === '#' || id.length < 2) return;
      var target = document.getElementById(id.slice(1));
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top: top, behavior: prefersReduced ? 'auto' : 'smooth' });
      history.replaceState(null, '', id);
    });
  });

})();
