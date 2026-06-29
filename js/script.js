/* =========================================================
   Girlhood Universe — script.js
   Vanilla JS, localStorage-backed, no dependencies.
   ========================================================= */
(() => {
  'use strict';

  /* ---------- Storage helpers ---------- */
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
      catch { return fallback; }
    },
    set(key, val) {
      try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { console.warn('storage full', e); }
    }
  };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const $ = (sel) => document.querySelector(sel);

  /* ---------- Magical background ---------- */
  function buildSparkles(count = 40) {
    const wrap = $('#sparkles');
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const s = document.createElement('span');
      s.className = 'sparkle';
      s.style.left = Math.random() * 100 + 'vw';
      s.style.top = Math.random() * 100 + 'vh';
      s.style.animationDelay = (Math.random() * 3) + 's';
      s.style.animationDuration = (2 + Math.random() * 3) + 's';
      frag.appendChild(s);
    }
    wrap.appendChild(frag);
  }
  function buildButterflies(count = 6) {
    const wrap = $('#butterflies');
    const emojis = ['🦋', '✿', '❀'];
    for (let i = 0; i < count; i++) {
      const b = document.createElement('span');
      b.className = 'butterfly';
      b.textContent = emojis[i % emojis.length];
      b.style.top = (10 + Math.random() * 80) + 'vh';
      b.style.animationDuration = (20 + Math.random() * 20) + 's, ' + (3 + Math.random() * 3) + 's';
      b.style.animationDelay = (-Math.random() * 20) + 's, 0s';
      wrap.appendChild(b);
    }
  }
  function buildClouds(count = 4) {
    const wrap = $('#clouds');
    for (let i = 0; i < count; i++) {
      const c = document.createElement('span');
      c.className = 'cloud';
      c.textContent = '☁';
      c.style.top = (5 + Math.random() * 70) + 'vh';
      c.style.animationDuration = (50 + Math.random() * 40) + 's';
      c.style.animationDelay = (-Math.random() * 50) + 's';
      wrap.appendChild(c);
    }
  }
  function initCursorGlow() {
    const glow = $('#cursorGlow');
    let x = window.innerWidth / 2, y = window.innerHeight / 2, tx = x, ty = y;
    window.addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; });
    (function tick() {
      x += (tx - x) * 0.12; y += (ty - y) * 0.12;
      glow.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      requestAnimationFrame(tick);
    })();
  }

  /* ---------- Mobile nav ---------- */
  function initNav() {
    const toggle = $('#menuToggle');
    const links = document.querySelector('.nav-links');
    toggle?.addEventListener('click', () => links.classList.toggle('open'));
    links?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
  }

  /* ---------- Dreams & Goals (shared list pattern) ---------- */
  function makeList({ key, listEl, formEl, inputEl, placeholder }) {
    let items = store.get(key, []);

    function render() {
      listEl.innerHTML = '';
      if (items.length === 0) {
        listEl.innerHTML = `<li class="card" style="opacity:.7"><p>${placeholder}</p></li>`;
        return;
      }
      items.forEach(item => {
        const li = document.createElement('li');
        li.className = 'card';
        li.innerHTML = `
          <p class="item-text"></p>
          <div class="card-actions">
            <button class="icon-btn" data-act="edit">✎ Edit</button>
            <button class="icon-btn" data-act="del">✕ Remove</button>
          </div>`;
        li.querySelector('.item-text').textContent = item.text;
        li.querySelector('[data-act="edit"]').addEventListener('click', () => {
          const next = prompt('Edit:', item.text);
          if (next && next.trim()) { item.text = next.trim(); save(); }
        });
        li.querySelector('[data-act="del"]').addEventListener('click', () => {
          items = items.filter(i => i.id !== item.id); save();
        });
        listEl.appendChild(li);
      });
    }
    function save() { store.set(key, items); render(); }

    formEl.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = inputEl.value.trim(); if (!text) return;
      items.unshift({ id: uid(), text }); inputEl.value = ''; save();
    });
    render();
  }

  /* ---------- Memories (polaroids w/ optional image) ---------- */
  function initMemories() {
    const KEY = 'gu:memories';
    let items = store.get(KEY, []);
    const list = $('#memoriesList');
    const form = $('#memoryForm');
    const titleEl = $('#memoryTitle');
    const noteEl = $('#memoryNote');
    const imgEl = $('#memoryImage');

    function render() {
      list.innerHTML = '';
      if (!items.length) {
        list.innerHTML = `<p class="muted">Your polaroid gallery is empty — add your first memory ✿</p>`;
        return;
      }
      items.forEach((m, i) => {
        const card = document.createElement('div');
        card.className = 'polaroid';
        card.style.setProperty('--rot', ((i % 2 === 0 ? -1 : 1) * (1 + Math.random() * 3)).toFixed(1) + 'deg');
        const photo = m.image
          ? `<img class="photo" src="${m.image}" alt="${escapeHtml(m.title)}" />`
          : `<div class="photo">✿</div>`;
        card.innerHTML = `
          <button class="del" title="Remove">✕</button>
          ${photo}
          <h4></h4>
          <p></p>`;
        card.querySelector('h4').textContent = m.title;
        card.querySelector('p').textContent = m.note || '';
        card.querySelector('.del').addEventListener('click', () => {
          items = items.filter(x => x.id !== m.id); save();
        });
        list.appendChild(card);
      });
    }
    function save() { store.set(KEY, items); render(); }

    function readFile(file) {
      return new Promise((res, rej) => {
        if (!file) return res(null);
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = titleEl.value.trim(); if (!title) return;
      const image = await readFile(imgEl.files[0]);
      items.unshift({ id: uid(), title, note: noteEl.value.trim(), image });
      form.reset(); save();
    });
    render();
  }

  /* ---------- Journal ---------- */
  function initJournal() {
    const KEY = 'gu:journal';
    let items = store.get(KEY, []);
    const list = $('#journalList');
    const form = $('#journalForm');
    const titleEl = $('#journalTitle');
    const bodyEl = $('#journalBody');

    function render() {
      list.innerHTML = '';
      if (!items.length) {
        list.innerHTML = `<li class="journal-entry muted">No entries yet. The page is waiting ✿</li>`;
        return;
      }
      items.forEach(e => {
        const li = document.createElement('li');
        li.className = 'journal-entry';
        li.innerHTML = `
          <h4></h4>
          <time></time>
          <p></p>
          <div class="card-actions">
            <button class="icon-btn" data-act="edit">✎ Edit</button>
            <button class="icon-btn" data-act="del">✕ Remove</button>
          </div>`;
        li.querySelector('h4').textContent = e.title;
        li.querySelector('time').textContent = new Date(e.date).toLocaleString();
        li.querySelector('p').textContent = e.body;
        li.querySelector('[data-act="edit"]').addEventListener('click', () => {
          const t = prompt('Title:', e.title); if (!t) return;
          const b = prompt('Entry:', e.body); if (b == null) return;
          e.title = t.trim(); e.body = b; e.date = Date.now(); save();
        });
        li.querySelector('[data-act="del"]').addEventListener('click', () => {
          items = items.filter(x => x.id !== e.id); save();
        });
        list.appendChild(li);
      });
    }
    function save() { store.set(KEY, items); render(); }

    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const title = titleEl.value.trim(), body = bodyEl.value.trim();
      if (!title || !body) return;
      items.unshift({ id: uid(), title, body, date: Date.now() });
      form.reset(); save();
    });
    render();
  }

  /* ---------- Quotes ---------- */
  const QUOTES = [
    { t: "You are the universe experiencing itself.", a: "Alan Watts" },
    { t: "She wore her scars as her best attire.", a: "Anne Sexton" },
    { t: "And still, I rise.", a: "Maya Angelou" },
    { t: "You are allowed to be both a masterpiece and a work in progress.", a: "Sophia Bush" },
    { t: "Be soft. Do not let the world make you hard.", a: "Iain Thomas" },
    { t: "I am my own muse.", a: "Frida Kahlo" },
    { t: "She remembered who she was and the game changed.", a: "Lalah Delia" },
    { t: "Stars can't shine without darkness.", a: "Unknown" },
    { t: "You are made of stardust and dreams.", a: "Unknown" },
    { t: "Bloom where you are planted.", a: "Mary Engelbreit" },
    { t: "She believed she could, so she did.", a: "R.S. Grey" },
    { t: "Wear your heart on your skin in this life.", a: "Sylvia Plath" },
    { t: "Love yourself first and everything else falls in line.", a: "Lucille Ball" },
    { t: "You are your own home.", a: "Unknown" },
    { t: "Soft seasons are still growth.", a: "Unknown" },
    { t: "She is water — soft enough to offer life, tough enough to drown it away.", a: "Adrian Michael" },
    { t: "I am the storm.", a: "Unknown" },
    { t: "Magic is something you make.", a: "Bill Hicks" },
    { t: "Let her be. Let her live. Let her bloom.", a: "Unknown" },
    { t: "Your softness is your superpower.", a: "Unknown" },
    { t: "Wildflowers don't ask permission to bloom.", a: "Unknown" },
    { t: "Trust the magic of new beginnings.", a: "Meister Eckhart" },
    { t: "She had a galaxy in her eyes.", a: "Unknown" },
    { t: "Be the girl you needed when you were younger.", a: "Unknown" },
    { t: "You are a poem the world hasn't read yet.", a: "Unknown" },
    { t: "Honey, you are a thousand spring days.", a: "Unknown" },
    { t: "Dream in soft pinks and golden hours.", a: "Unknown" },
    { t: "She turned her pain into pearls.", a: "Unknown" },
  ];

  function initQuotes() {
    const KEY = 'gu:savedQuotes';
    let saved = store.get(KEY, []);
    const text = $('#quoteText'), author = $('#quoteAuthor');
    const list = $('#savedQuotes');
    let current = null;

    function show() {
      current = QUOTES[Math.floor(Math.random() * QUOTES.length)];
      text.textContent = '“' + current.t + '”';
      author.textContent = '— ' + current.a;
    }
    function renderSaved() {
      list.innerHTML = '';
      if (!saved.length) {
        list.innerHTML = `<li class="muted" style="grid-column:1/-1;text-align:center">No saved quotes yet ♡</li>`;
        return;
      }
      saved.forEach(q => {
        const li = document.createElement('li');
        li.className = 'quote-card';
        li.innerHTML = `<blockquote></blockquote><cite></cite>
          <button class="icon-btn del">✕ Remove</button>`;
        li.querySelector('blockquote').textContent = '“' + q.t + '”';
        li.querySelector('cite').textContent = '— ' + q.a;
        li.querySelector('.del').addEventListener('click', () => {
          saved = saved.filter(x => x.id !== q.id); persist();
        });
        list.appendChild(li);
      });
    }
    function persist() { store.set(KEY, saved); renderSaved(); }

    $('#newQuoteBtn').addEventListener('click', show);
    $('#saveQuoteBtn').addEventListener('click', () => {
      if (!current) return;
      if (saved.some(q => q.t === current.t)) return;
      saved.unshift({ id: uid(), ...current }); persist();
    });
    show(); renderSaved();
  }

  /* ---------- Future-self letter ---------- */
  function initLetter() {
    const KEY = 'gu:letter';
    const form = $('#letterForm'), body = $('#letterBody'), info = $('#letterSaved');
    const data = store.get(KEY, null);
    if (data) { body.value = data.body; info.textContent = 'Last saved ' + new Date(data.date).toLocaleString(); }
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const payload = { body: body.value, date: Date.now() };
      store.set(KEY, payload);
      info.textContent = 'Saved ' + new Date(payload.date).toLocaleString() + ' ✿';
    });
  }

  /* ---------- Utils ---------- */
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  /* ---------- Boot ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    buildSparkles(); buildButterflies(); buildClouds(); initCursorGlow(); initNav();
    makeList({
      key: 'gu:dreams', listEl: $('#dreamsList'), formEl: $('#dreamForm'),
      inputEl: $('#dreamInput'), placeholder: 'No dreams yet — whisper your first ✿'
    });
    makeList({
      key: 'gu:goals', listEl: $('#goalsList'), formEl: $('#goalForm'),
      inputEl: $('#goalInput'), placeholder: 'No goals yet — pick a star to chase ✦'
    });
    initMemories(); initJournal(); initQuotes(); initLetter();
  });
})();
