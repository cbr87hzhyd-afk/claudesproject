'use strict';

// ─── Cursor glow ──────────────────────────────────────────────────────────────
// A soft radial gradient that trails the cursor, reacts to hover targets.
function initCursor() {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const glow = document.createElement('div');
  glow.id = 'cursor-glow';
  document.body.appendChild(glow);

  let tx = -600, ty = -600, cx = tx, cy = ty;

  document.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; });

  document.addEventListener('mouseover', e => {
    const over = e.target.closest('a, button, .card, canvas, input, select, [tabindex]');
    glow.classList.toggle('cursor-over', !!over);
  });

  (function tick() {
    cx += (tx - cx) * 0.09;
    cy += (ty - cy) * 0.09;
    glow.style.transform = `translate(${cx}px, ${cy}px)`;
    requestAnimationFrame(tick);
  })();
}

// ─── Scroll-progress bar in nav ───────────────────────────────────────────────
function initProgress() {
  const nav = document.querySelector('nav');
  if (!nav) return;
  const bar = document.createElement('div');
  bar.id = 'scroll-progress';
  nav.appendChild(bar);

  const update = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0) + '%';
  };

  window.addEventListener('scroll', update, { passive: true });
  update();
}

// ─── Scroll-reveal ────────────────────────────────────────────────────────────
// Anything with class .will-reveal fades + rises when entering viewport.
function initReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('revealed');
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.05, rootMargin: '0px 0px -24px 0px' });

  let i = 0;
  const sel = '.section, .pullquote, .stat-row, .cards, .timeline, .param-grid, .thought-panel';
  document.querySelectorAll(sel).forEach(el => {
    if (el.closest('.hero')) return;
    el.classList.add('will-reveal');
    el.style.setProperty('--ri', i++);
    obs.observe(el);
  });
}

// ─── 3-D card tilt ────────────────────────────────────────────────────────────
function initTilt() {
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const x  = (e.clientX - r.left) / r.width  - 0.5;
      const y  = (e.clientY - r.top)  / r.height - 0.5;
      card.style.transform =
        `perspective(700px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-5px) scale(1.02)`;
      card.style.setProperty('--shine-x', (x + 0.5) * 100 + '%');
      card.style.setProperty('--shine-y', (y + 0.5) * 100 + '%');
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

// ─── Animated stat counters ───────────────────────────────────────────────────
function initCounters() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const raw = el.textContent;
      const n   = parseFloat(raw.replace(/[^\d.]/g, ''));
      if (isNaN(n) || n < 3) return;
      const suffix = raw.replace(/[\d.,]/g, '');
      let t0;
      const dur  = 1000;
      const ease = t => 1 - Math.pow(1 - t, 3);
      (function frame(ts) {
        if (!t0) t0 = ts;
        const p = ease(Math.min((ts - t0) / dur, 1));
        el.textContent = Math.round(p * n).toLocaleString() + suffix;
        if (p < 1) requestAnimationFrame(frame);
      })(performance.now());
      obs.unobserve(el);
    });
  }, { threshold: 0.8 });

  document.querySelectorAll('.stat-val').forEach(el => obs.observe(el));
}

// ─── Chapter label in nav ─────────────────────────────────────────────────────
function initChapterTag() {
  const map = {
    'life.html':     ['01', 'Life',     '#4ade80'],
    'form.html':     ['02', 'Form',     '#c084fc'],
    'patterns.html': ['03', 'Patterns', '#e879f9'],
    'mind.html':     ['04', 'Mind',     '#ffb347'],
    'cosmos.html':   ['05', 'Cosmos',   '#22d3ee'],
  };
  const page = location.pathname.split('/').pop() || 'index.html';
  const entry = map[page];
  if (!entry) return;
  const [num, name, color] = entry;
  const tag = document.createElement('div');
  tag.className = 'nav-chapter-tag';
  tag.innerHTML = `<span style="color:${color}">${num}</span> ${name}`;
  document.querySelector('nav').appendChild(tag);
}

// ─── First-visit intro splash (home page only) ────────────────────────────────
function initIntro() {
  if (!document.body.classList.contains('page-home')) return;
  if (sessionStorage.getItem('intro-seen')) return;
  sessionStorage.setItem('intro-seen', '1');

  const ov = document.createElement('div');
  ov.id = 'intro-overlay';
  ov.innerHTML = `
    <div id="intro-inner">
      <div id="intro-word">emergence</div>
      <div id="intro-def">
        <em>n.</em> the arising of novel, irreducible properties<br>
        from the interaction of simpler constituents
      </div>
      <div id="intro-byline">an interactive journal · six chapters</div>
    </div>
  `;
  document.body.prepend(ov);

  setTimeout(() => ov.classList.add('exiting'), 3400);
  setTimeout(() => ov.remove(), 4200);
}

// ─── Subtle nav glass on scroll ───────────────────────────────────────────────
function initNavScroll() {
  const nav = document.querySelector('nav');
  if (!nav) return;
  const update = () => nav.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', update, { passive: true });
  update();
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initCursor();
  initProgress();
  initReveal();
  initTilt();
  initCounters();
  initChapterTag();
  initIntro();
  initNavScroll();
});
