/* ============================================================
   AMANDA RABELO — script.js
   Conteúdo dinâmico · WhatsApp · Modal · Botão flutuante ·
   Hero 3D (Three.js) · Animações (GSAP)
   ============================================================ */
(() => {
'use strict';

const defaults = window.SITE_CONTENT || {};
let data = { ...defaults };
try {
  const local = localStorage.getItem('amandaSiteDraft');
  if (local) data = { ...data, ...JSON.parse(local) };
} catch (e) { /* rascunho inválido — ignora */ }

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = () => window.matchMedia('(max-width: 640px)').matches;

function wa(msg) {
  return 'https://wa.me/' + String(data.whatsapp || '5521979670646').replace(/\D/g, '')
    + '?text=' + encodeURIComponent(msg || 'Olá Amanda! Quero conversar sobre um projeto.');
}

/* ---------- Renderização do conteúdo (compatível com painel admin) ---------- */
function apply() {
  $$('[data-content]').forEach(el => {
    const k = el.dataset.content;
    if (data[k] != null) el.textContent = data[k];
  });

  const photo = $('#profile-photo');
  if (photo && data.profilePhoto) photo.src = data.profilePhoto;

  const insta = $('[data-profile-social]');
  if (insta) insta.href = data.instagram || '#';
  const footer = $('[data-footer-social]');
  if (footer) footer.href = data.instagram || '#';

  $('#year').textContent = new Date().getFullYear();

  const grid = $('#service-grid');
  if (grid) grid.innerHTML = (data.services || []).map((s, i) =>
    `<a class="service-card ${i === 0 ? 'service-featured' : ''}" href="${wa(s.message)}" target="_blank" rel="noopener noreferrer" data-tilt>
      <span class="service-index">${esc(s.index)}</span>
      <span class="service-icon">${['◉', '✳', '◇', '▷', '✣'][i % 5]}</span>
      <h3>${esc(s.title)}</h3>
      <p>${esc(s.description)}</p>
      <span class="service-cta">${esc(s.cta)} ↗</span>
    </a>`).join('') +
    `<div class="service-card service-note">
      <span class="note-star">✳</span>
      <p class="eyebrow">NÃO SABE POR ONDE COMEÇAR?</p>
      <h3>A gente organiza isso juntas.</h3>
      <p>Conte o que você está construindo. Vamos identificar o melhor próximo passo.</p>
      <button class="button" type="button" data-open-budget>Montar meu pedido ↗</button>
    </div>`;

  const steps = $('#process-steps');
  if (steps) steps.innerHTML = (data.steps || []).map((s, i) =>
    `<article data-anim="rise">
      <span>0${i + 1}</span>
      <div><h3>${esc(s.title)}</h3><p>${esc(s.description)}</p></div>
    </article>`).join('');

  const faq = $('#faq-list');
  if (faq) faq.innerHTML = (data.faqs || []).map(f =>
    `<details data-anim="rise"><summary>${esc(f.question)}</summary><p>${esc(f.answer)}</p></details>`).join('');

  $$('.wa-link').forEach(a => {
    a.href = wa('Olá Amanda! Vim pelo seu site e quero conversar sobre um projeto.');
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  });

  const select = $('#service-select');
  if (select) select.innerHTML = (data.services || []).map(s =>
    `<option>${esc(s.title)}</option>`).join('') + '<option>Quero ajuda para decidir</option>';
}

apply();

/* ---------- Modal de orçamento ---------- */
document.addEventListener('click', e => {
  if (e.target.closest('[data-open-budget]')) $('#budget-dialog').showModal();
  if (e.target.closest('[data-close-budget]')) $('#budget-dialog').close();
});

$('#budget-form')?.addEventListener('submit', e => {
  e.preventDefault();
  const f = new FormData(e.currentTarget);
  window.open(wa(`Olá Amanda! Meu nome é ${f.get('name')}. Tenho interesse em: ${f.get('service')}. ${f.get('notes') || ''}`), '_blank', 'noopener,noreferrer');
  $('#budget-dialog').close();
});

/* ---------- API pública (usada pelo fluxo admin) ---------- */
window.AmandaSite = {
  getData: () => JSON.parse(JSON.stringify(data)),
  setData: next => {
    data = next;
    try { localStorage.setItem('amandaSiteDraft', JSON.stringify(data)); } catch (e) {}
    apply();
  },
  clearDraft: () => localStorage.removeItem('amandaSiteDraft')
};

/* =========================================================
   HERO 3D — Three.js
   Objetos abstratos flutuantes em torno da foto,
   parallax sutil de mouse, pausa fora de vista.
   ========================================================= */
(function initHero3D() {
  const canvas = $('#hero-3d');
  if (!canvas || reduceMotion || isMobile()) { if (canvas) canvas.style.display = 'none'; return; }
  if (typeof THREE === 'undefined') { canvas.style.display = 'none'; return; }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  } catch (e) {
    canvas.style.display = 'none'; /* Fallback: decoração CSS permanece */
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  /* Iluminação suave e cinematográfica */
  scene.add(new THREE.AmbientLight(0xffffff, 0.75));
  const key = new THREE.DirectionalLight(0xffffff, 0.85);
  key.position.set(4, 6, 6);
  scene.add(key);
  const rim = new THREE.PointLight(0x955fff, 1.1, 30);
  rim.position.set(-5, 2, 4);
  scene.add(rim);
  const fill = new THREE.PointLight(0xcfabff, 0.7, 25);
  fill.position.set(5, -3, 3);
  scene.add(fill);

  const group = new THREE.Group();
  scene.add(group);

  const matPurple = new THREE.MeshStandardMaterial({ color: 0x955fff, roughness: 0.28, metalness: 0.35 });
  const matLilac  = new THREE.MeshStandardMaterial({ color: 0xcfabff, roughness: 0.35, metalness: 0.25 });
  const matWhite  = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.15, metalness: 0.1 });
  const matGlass  = new THREE.MeshPhysicalMaterial({ color: 0xb794ff, roughness: 0.1, metalness: 0, transparent: true, opacity: 0.55 });

  const floaters = [];

  function add(mesh, x, y, z, amp, speed) {
    mesh.position.set(x, y, z);
    mesh.userData = { baseY: y, amp, speed, rot: 0.15 + Math.random() * 0.3, phase: Math.random() * Math.PI * 2 };
    group.add(mesh);
    floaters.push(mesh);
    return mesh;
  }

  /* Composição lateral (nunca cobre o rosto — lado direito e fundo) */
  add(new THREE.Mesh(new THREE.TorusKnotGeometry(0.55, 0.18, 140, 20), matPurple), 4.4, 1.6, -1.5, 0.35, 0.6);
  add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 0), matGlass), 2.4, 2.6, -2.6, 0.3, 0.8);
  add(new THREE.Mesh(new THREE.SphereGeometry(0.32, 40, 40), matLilac), 5.6, -0.4, -1, 0.4, 0.7);
  add(new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.1, 24, 80), matWhite), 3.1, -2.2, -2, 0.3, 0.5);
  add(new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), matPurple), 1.2, 3.4, -3, 0.35, 0.9);
  add(new THREE.Mesh(new THREE.SphereGeometry(0.18, 32, 32), matWhite), 5.9, 2.9, -2.4, 0.45, 1);
  add(new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.055, 20, 60), matLilac), 6.3, 1.1, -3.2, 0.3, 0.75);

  /* Anel flutuante atrás da foto */
  add(new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.045, 24, 120), new THREE.MeshStandardMaterial({
    color: 0x955fff, roughness: 0.3, metalness: 0.4, transparent: true, opacity: 0.5
  })), 3.9, 0.3, -3.5, 0.15, 0.35);

  /* Partículas suaves */
  const dotGeo = new THREE.SphereGeometry(0.035, 10, 10);
  const dots = new THREE.Group();
  for (let i = 0; i < 40; i++) {
    const d = new THREE.Mesh(dotGeo, Math.random() > 0.5 ? matLilac : matWhite);
    d.position.set(1 + Math.random() * 6.5, -3 + Math.random() * 7, -4 + Math.random() * 3);
    dots.add(d);
  }
  group.add(dots);

  /* Parallax de mouse */
  let targetRX = 0, targetRY = 0, curRX = 0, curRY = 0;
  window.addEventListener('pointermove', e => {
    const nx = (e.clientX / window.innerWidth - 0.5) * 2;
    const ny = (e.clientY / window.innerHeight - 0.5) * 2;
    targetRY = nx * 0.22;
    targetRX = ny * 0.14;
  }, { passive: true });

  /* Parallax de rolagem */
  let scrollY = 0;
  window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

  function resize() {
    const hero = canvas.parentElement;
    const w = hero.clientWidth, h = hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  /* Pausa quando fora da tela ou aba oculta */
  let visible = true;
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; }, { threshold: 0 })
    .observe(canvas);

  const clock = new THREE.Clock();
  (function tick() {
    requestAnimationFrame(tick);
    if (!visible || document.hidden) return;
    const t = clock.getElapsedTime();

    floaters.forEach(m => {
      const u = m.userData;
      m.position.y = u.baseY + Math.sin(t * u.speed + u.phase) * u.amp;
      m.rotation.x = t * u.rot;
      m.rotation.y = t * u.rot * 0.8;
    });

    dots.rotation.y = t * 0.03;
    group.position.y = scrollY * 0.0012;

    curRX += (targetRX - curRX) * 0.04;
    curRY += (targetRY - curRY) * 0.04;
    group.rotation.x = curRX;
    group.rotation.y = curRY;

    renderer.render(scene, camera);
  })();
})();

/* =========================================================
   ANIMAÇÕES — GSAP
   ========================================================= */
(function initAnimations() {
  if (reduceMotion || typeof gsap === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  /* Entrada do hero */
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.from('.topbar', { y: -30, opacity: 0, duration: 0.7 })
    .from('.hero .eyebrow', { y: 18, opacity: 0, duration: 0.6 }, '-=0.35')
    .from('.hero .kicker', { y: 18, opacity: 0, duration: 0.6 }, '-=0.45')
    .from('.hero h1 .h-line', { y: 46, opacity: 0, duration: 0.9, stagger: 0.12 }, '-=0.4')
    .from('.hero-text', { y: 22, opacity: 0, duration: 0.7 }, '-=0.55')
    .from('.hero-actions', { y: 20, opacity: 0, duration: 0.7 }, '-=0.5')
    .from('.hero-note', { opacity: 0, duration: 0.8 }, '-=0.4')
    .from('#profile-card', { y: 60, opacity: 0, rotate: 5, duration: 1.05, ease: 'power4.out' }, '-=1.1');

  /* Card da foto: micro-parallax de mouse */
  const card = $('#profile-card');
  if (card && !isMobile()) {
    const qx = gsap.quickTo(card, 'rotationY', { duration: 0.6, ease: 'power3.out' });
    const qy = gsap.quickTo(card, 'rotationX', { duration: 0.6, ease: 'power3.out' });
    gsap.set(card, { transformPerspective: 900 });
    window.addEventListener('pointermove', e => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      qx(nx * 3.5);
      qy(-ny * 2.5);
    }, { passive: true });
  }

  /* Revelações de rolagem */
  $$('[data-anim="fade"]').forEach(el => {
    gsap.from(el, {
      y: 34, opacity: 0, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 86%' }
    });
  });
  $$('[data-anim="rise"]').forEach((el, i) => {
    gsap.from(el, {
      y: 40, opacity: 0, duration: 0.85, delay: (i % 3) * 0.1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%' }
    });
  });

  /* Cards de serviço: entrada escalonada + tilt no hover */
  if ($('.service-card')) {
    gsap.from('.service-card', {
      y: 50, opacity: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out',
      scrollTrigger: { trigger: '#service-grid', start: 'top 82%' }
    });
    $$('.service-card[data-tilt]').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(el, { rotationY: px * 6, rotationX: -py * 6, transformPerspective: 800, duration: 0.4, ease: 'power2.out' });
      });
      el.addEventListener('pointerleave', () => {
        gsap.to(el, { rotationY: 0, rotationX: 0, duration: 0.6, ease: 'power3.out' });
      });
    });
  }

  /* Fechamento */
  gsap.from('.closing', {
    y: 44, opacity: 0, duration: 1, ease: 'power3.out',
    scrollTrigger: { trigger: '.closing', start: 'top 85%' }
  });
})();

})();

/* =========================================================
   BOTÃO FLUTUANTE — ARRASTÁVEL COM MOUSE E TOQUE
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  const floatingButton = document.querySelector('.floating-contact');
  if (!floatingButton) return;

  let dragging = false;
  let moved = false;
  let startX = 0, startY = 0, startLeft = 0, startTop = 0;

  floatingButton.addEventListener('pointerdown', event => {
    dragging = true;
    moved = false;
    const rect = floatingButton.getBoundingClientRect();
    startX = event.clientX;
    startY = event.clientY;
    startLeft = rect.left;
    startTop = rect.top;
    floatingButton.classList.add('is-dragging');
    floatingButton.setPointerCapture(event.pointerId);
    event.preventDefault();
  });

  floatingButton.addEventListener('pointermove', event => {
    if (!dragging) return;
    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;
    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) moved = true;
    const maxLeft = Math.max(0, window.innerWidth - floatingButton.offsetWidth);
    const maxTop = Math.max(0, window.innerHeight - floatingButton.offsetHeight);
    const newLeft = Math.min(Math.max(0, startLeft + deltaX), maxLeft);
    const newTop = Math.min(Math.max(0, startTop + deltaY), maxTop);
    floatingButton.style.left = newLeft + 'px';
    floatingButton.style.top = newTop + 'px';
    floatingButton.style.right = 'auto';
    floatingButton.style.bottom = 'auto';
  });

  const stopDragging = event => {
    dragging = false;
    floatingButton.classList.remove('is-dragging');
    if (event && floatingButton.hasPointerCapture?.(event.pointerId)) {
      floatingButton.releasePointerCapture(event.pointerId);
    }
  };

  floatingButton.addEventListener('pointerup', stopDragging);
  floatingButton.addEventListener('pointercancel', stopDragging);
  floatingButton.addEventListener('click', event => {
    if (moved) { event.preventDefault(); event.stopPropagation(); moved = false; }
  });
});
