'use strict';

// ─── Cursor glow ──────────────────────────────────────────────────────────────
// A soft radial gradient that trails the cursor, reacts to hover targets.
function initCursor() {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const glow = document.createElement('div');
  glow.id = 'cursor-glow';
  document.body.appendChild(glow);

  // A small bright dot at the exact cursor position.
  const dot = document.createElement('div');
  dot.id = 'cursor-dot';
  document.body.appendChild(dot);

  let tx = -600, ty = -600, cx = tx, cy = ty;
  let lastTrail = 0;

  document.addEventListener('mousemove', e => {
    tx = e.clientX; ty = e.clientY;
    // Particle trail (rate-limited)
    const now = performance.now();
    if (now - lastTrail > 22) {
      lastTrail = now;
      spawnTrailParticle(e.clientX, e.clientY);
    }
  });

  document.addEventListener('mouseover', e => {
    const over = e.target.closest('a, button, .card, canvas, input, select, [tabindex]');
    glow.classList.toggle('cursor-over', !!over);
    dot.classList.toggle('cursor-over', !!over);
  });

  (function tick() {
    cx += (tx - cx) * 0.09;
    cy += (ty - cy) * 0.09;
    glow.style.transform = `translate(${cx}px, ${cy}px)`;
    dot.style.transform  = `translate(${tx}px, ${ty}px)`;
    requestAnimationFrame(tick);
  })();
}

// Trail particles: tiny fading dots that drift slightly behind cursor.
function spawnTrailParticle(x, y) {
  const p = document.createElement('div');
  p.className = 'cursor-trail';
  p.style.left = x + 'px';
  p.style.top  = y + 'px';
  // Slight random drift
  const dx = (Math.random() - 0.5) * 14;
  const dy = (Math.random() - 0.5) * 14 + 6;
  p.style.setProperty('--dx', dx + 'px');
  p.style.setProperty('--dy', dy + 'px');
  document.body.appendChild(p);
  setTimeout(() => p.remove(), 700);
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
  const sel = '.section, .pullquote, .stat-row, .cards, .timeline, .param-grid, .thought-panel, .coda-frame';
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
    'coda.html':     ['∞',  'Coda',     '#f4f4f4'],
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

// ─── Page breath ──────────────────────────────────────────────────────────────
// A very subtle global pulse — nothing dramatic, just life.
function initBreath() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.body.classList.add('breathing');
}

// ═════════════════════════════════════════════════════════════════════════════
//  EASTER EGGS & UNLOCKS
// ═════════════════════════════════════════════════════════════════════════════

const UNLOCK_KEY = 'emergence-coda-unlocked';
const SYNAESTHESIA_KEY = 'emergence-synaesthesia';

function isCodaUnlocked() { return localStorage.getItem(UNLOCK_KEY) === '1'; }
function isSynaesthesiaOn() { return localStorage.getItem(SYNAESTHESIA_KEY) === '1'; }

function unlockCoda(silent) {
  if (isCodaUnlocked()) return;
  localStorage.setItem(UNLOCK_KEY, '1');
  revealCodaLink();
  if (!silent) {
    toast('A seventh chapter awaits.', { href: 'coda.html', label: 'Enter the Coda →' });
    if (window.EM_SOUND) {
      window.EM_SOUND.boot();
      window.EM_SOUND.chordPing(0, 0.10, 3.0);
      setTimeout(() => window.EM_SOUND.chordPing(2, 0.08, 3.5), 400);
      setTimeout(() => window.EM_SOUND.chordPing(4, 0.07, 4.0), 800);
    }
  }
}

function setSynaesthesia(on) {
  localStorage.setItem(SYNAESTHESIA_KEY, on ? '1' : '0');
  document.body.classList.toggle('synaesthesia', on);
  if (on) toast('Synaesthesia engaged. Every click rings out.');
}

// Konami: ↑ ↑ ↓ ↓ ← → ← → b a
function initKonami() {
  const seq = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let i = 0;
  document.addEventListener('keydown', e => {
    const k = e.key;
    if (k === seq[i] || k.toLowerCase() === seq[i]) {
      i++;
      if (i === seq.length) {
        unlockCoda();
        i = 0;
      }
    } else {
      i = (k === seq[0]) ? 1 : 0;
    }
  });
}

// Type "more" anywhere → flash a Philip Anderson whisper.
function initWordWatcher() {
  const watch = ['more', 'emerge', 'phi', 'iter'];
  let buf = '';
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key.length !== 1) return;
    buf = (buf + e.key.toLowerCase()).slice(-12);
    if (buf.endsWith('more')) {
      whisper('More is different. — P.W.A.');
    } else if (buf.endsWith('emerge')) {
      whisper('You are reading something that is reading itself.');
    } else if (buf.endsWith('phi')) {
      whisper('Φ — the integration of information across a system.');
    }
  });
}

// Click logo 7× → synaesthesia mode (visual sparks + sfx on every click)
function initLogoSecret() {
  const logo = document.querySelector('.nav-logo');
  if (!logo) return;
  let n = 0, last = 0;
  logo.addEventListener('click', e => {
    const now = performance.now();
    if (now - last > 1500) n = 0;
    last = now;
    n++;
    if (n >= 7) {
      e.preventDefault();
      n = 0;
      setSynaesthesia(!isSynaesthesiaOn());
    }
  });
}

// Footer dot — visible only once Coda is unlocked.
function revealCodaLink() {
  document.querySelectorAll('.coda-dot').forEach(el => el.classList.add('on'));
  // Add a subtle "Coda" link in nav too (only on pages that don't already have it)
  const links = document.querySelector('.nav-links');
  if (links && !links.querySelector('.coda-nav')) {
    const li = document.createElement('li');
    li.className = 'coda-nav';
    li.innerHTML = `<a href="coda.html"${location.pathname.endsWith('coda.html') ? ' class="active"' : ''}>Coda</a>`;
    links.appendChild(li);
  }
}

function initCodaFooterDot() {
  // Add the tiny dot to every footer (visible only when unlocked).
  document.querySelectorAll('footer').forEach(f => {
    if (f.querySelector('.coda-dot')) return;
    const a = document.createElement('a');
    a.className = 'coda-dot';
    a.href = 'coda.html';
    a.title = '·';
    a.setAttribute('aria-label', 'Coda');
    f.appendChild(a);
  });
  if (isCodaUnlocked()) revealCodaLink();
}

// ─── Toast / whisper UI ──────────────────────────────────────────────────────
function toast(msg, opts) {
  const t = document.createElement('div');
  t.className = 'em-toast';
  t.innerHTML = `<span>${msg}</span>` +
    (opts && opts.href ? ` <a href="${opts.href}">${opts.label || 'Open'}</a>` : '');
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('in'));
  setTimeout(() => { t.classList.remove('in'); }, 6500);
  setTimeout(() => t.remove(), 7400);
}

function whisper(msg) {
  const w = document.createElement('div');
  w.className = 'em-whisper';
  w.textContent = msg;
  document.body.appendChild(w);
  requestAnimationFrame(() => w.classList.add('in'));
  setTimeout(() => w.classList.remove('in'), 2400);
  setTimeout(() => w.remove(), 3300);
  if (window.EM_SOUND) window.EM_SOUND.chordPing(2, 0.05, 2.0);
}

// Hidden-quote spans: click to whisper an embedded line.
function initHiddenQuotes() {
  document.querySelectorAll('.hidden-quote').forEach(el => {
    el.addEventListener('click', () => {
      const q = el.getAttribute('data-q') || '';
      if (q) whisper(q);
    });
  });
}

// Synaesthesia: sparks + sfx on any click.
function initSynaesthesia() {
  document.body.classList.toggle('synaesthesia', isSynaesthesiaOn());
  document.addEventListener('click', e => {
    if (!isSynaesthesiaOn()) return;
    burst(e.clientX, e.clientY);
    if (window.EM_SOUND) {
      const idx = Math.floor(Math.random() * 5);
      window.EM_SOUND.chordPing(idx, 0.05, 0.9);
    }
  });
}

function burst(x, y) {
  const N = 14;
  for (let i = 0; i < N; i++) {
    const s = document.createElement('div');
    s.className = 'em-spark';
    const a = (i / N) * Math.PI * 2 + Math.random() * 0.4;
    const r = 30 + Math.random() * 50;
    s.style.left = x + 'px';
    s.style.top  = y + 'px';
    s.style.setProperty('--dx', Math.cos(a) * r + 'px');
    s.style.setProperty('--dy', Math.sin(a) * r + 'px');
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 900);
  }
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
  initBreath();
  initKonami();
  initWordWatcher();
  initLogoSecret();
  initCodaFooterDot();
  initHiddenQuotes();
  initSynaesthesia();
});
