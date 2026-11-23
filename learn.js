'use strict';
/* =====================================================================
   LEARN: course map + card-by-card lesson reader
   ===================================================================== */
const Learn = (() => {
  let learned = new Set(store.get('learned', []));
  const L = { id: null, i: 0 };
  const order = TOPICS.map(t => t.id);
  const isOpen = () => !!L.id && TAB === 'learn';

  // ---------- course map ----------
  function renderMap() {
    const done = order.filter(id => learned.has(id)).length;
    $('#learnProgress').innerHTML = `<b>${done}</b> of ${order.length} lessons read`;
    const next = order.find(id => !learned.has(id));
    $('#learnParts').innerHTML = [1, 2, 3, 4].map(p => `
      <div class="lpart"><div class="lpart-title">${PART_NAMES[p]}</div><div class="lgrid">
      ${TOPICS.filter(t => t.part === p).map(t => {
        const c = COURSE[t.id], read = learned.has(t.id), b = Coach.box(t.id);
        return `<button class="lcard ${read ? 'read' : ''} ${t.id === next ? 'next' : ''}" data-t="${t.id}">
          <span class="lc-top"><span class="lc-num">${order.indexOf(t.id) + 1}</span>${read ? '<span class="lc-done">✓ read</span>' : t.id === next ? '<span class="lc-next">Up next</span>' : ''}</span>
          <span class="lc-name">${t.name}</span>
          <span class="lc-meta">${c.book} · ${c.mins} min · ${c.cards.length} cards</span>
          <span class="bars">${[1, 2, 3, 4, 5].map(k => `<b class="${b >= k ? 'f' : ''}"></b>`).join('')}</span>
        </button>`;
      }).join('')}</div></div>`).join('');
    $$('#learnParts .lcard').forEach(b => b.onclick = () => open(b.dataset.t));
  }

  // ---------- reader ----------
  function libTable() {
    return `<div class="libtable">${PROG_LIB.map((p, i) => `<div class="librow"><div><b>${p.name}</b> <span class="chip">${p.mood}</span> <span class="muted small">${p.mode}</span><div class="lr">${progLabel(p.romans)}</div><div class="muted small">${p.why}</div></div><button class="sm" data-lib="${i}">▶ Open in Create</button></div>`).join('')}</div>`;
  }
  function playEx(e) {
    const [, how, notes] = e; exPiano.clear(); exPiano.setHidden(false);
    if (how === 'seq') {
      const vs = notes.map(g => voice(g)); Snd.play(EV.seq(vs.map(mids), 0, 1.0));
      vs.forEach((v, i) => setTimeout(() => { if (!isOpen()) return; exPiano.clear(); exPiano.mark(v, 'ans'); }, i * 1000));
    } else {
      let v = voice(notes, 60); if (Math.max(...mids(v)) > HI) v = voice(notes, 48);
      exPiano.mark(v, 'ans'); Snd.play(how === 'arp' ? EV.arp(mids(v), 0, 0.26, 0.45) : EV.chord(mids(v)));
    }
  }
  function render() {
    const c = COURSE[L.id], t = TOPICS.find(x => x.id === L.id), total = c.cards.length + 1, last = L.i === c.cards.length;
    let body;
    if (!last) {
      const k = c.cards[L.i];
      body = `<h2 class="card-title">${k.t}</h2><div class="card-body">${k.b.replace('__LIB__', 'Each of these loops is built for a mood. Open one in Create and listen.' + libTable())}</div>
        ${k.ex ? `<div class="exrow">${k.ex.map((e, j) => `<button class="exbtn" data-ex="${j}">▶ ${e[0]}</button>`).join('')}</div>` : ''}
        ${k.create ? `<button class="sm create-link" id="lCreate">🎹 Try it in Create: ${progLabel(k.create.romans)}</button>` : ''}`;
    } else {
      body = `<h2 class="card-title">Wrap-up</h2>
        <div class="wrap-grid">
          <div class="wbox daw"><div class="wb-t">🎧 In your DAW</div><p>${c.daw}</p></div>
          <div class="wbox oops"><div class="wb-t">⚠ Common mistakes</div><ul>${c.mistakes.map(m => `<li>${m}</li>`).join('')}</ul></div>
        </div>
        <div class="wbox links"><div class="wb-t">📚 Go deeper</div>${c.links.map(([n, u]) => `<a href="${u}" target="_blank" rel="noopener noreferrer">${n} ↗</a>`).join('')}<div class="muted small" style="margin-top:6px">Also: ${c.book} of J. Anthony Allen's <i>Music Theory for Electronic Music Producers</i>.</div></div>
        <div class="btnrow wrap-cta"><button class="primary lg" id="lPractice">▶ Practise this topic (8 questions)</button>${nextId() ? `<button id="lNext">Next lesson: ${topicName(nextId())} →</button>` : ''}</div>`;
      if (!learned.has(L.id)) { learned.add(L.id); store.set('learned', [...learned]); const lv = Coach.addXP(15); body = `<div class="lesson-done">✓ Lesson complete <span class="xp-pop">+15 XP</span>${lv ? `<span class="lvl-pop">Level ${lv}!</span>` : ''}</div>` + body; if ($('#sfx').checked) sfx('first'); }
    }
    $('#learnReader').innerHTML = `
      <div class="reader-head">
        <button class="ghost sm" id="lBack">← All lessons</button>
        <span class="muted small">${PART_NAMES[t.part]} · ${c.book} · ${c.mins} min</span>
      </div>
      <div class="reader-title"><h1>${t.name}</h1></div>
      <div class="dots">${range(0, total - 1).map(i => `<button class="dot ${i === L.i ? 'on' : ''} ${i < L.i ? 'past' : ''}" data-i="${i}" aria-label="Card ${i + 1}"></button>`).join('')}</div>
      <div class="panel reader-card">${body}</div>
      <div class="reader-nav">
        <button id="lPrev" ${L.i === 0 ? 'disabled' : ''}>← Back</button>
        <span class="muted small">${L.i + 1} / ${total} · use ← → keys</span>
        ${last ? '<span></span>' : '<button id="lFwd" class="primary">Next →</button>'}
      </div>`;
    const k = c.cards[L.i];
    $$('#learnReader .exbtn').forEach(b => b.onclick = () => playEx(k.ex[+b.dataset.ex]));
    $$('#learnReader [data-lib]').forEach(b => b.onclick = () => { const p = PROG_LIB[+b.dataset.lib]; Create.load({ tonic: p.mode === 'minor' ? 'A' : 'C', mode: p.mode, romans: p.romans }); });
    if ($('#lCreate')) $('#lCreate').onclick = () => Create.load(k.create);
    $$('#learnReader .dot').forEach(b => b.onclick = () => go(+b.dataset.i));
    $('#lBack').onclick = () => close();
    $('#lPrev').onclick = () => go(L.i - 1);
    if ($('#lFwd')) $('#lFwd').onclick = () => go(L.i + 1);
    if ($('#lPractice')) $('#lPractice').onclick = () => { const id = L.id; close(); startTopic(id); };
    if ($('#lNext')) $('#lNext').onclick = () => open(nextId());
    exPiano.clear();
    setDock(k && k.ex ? 'Press an ▶ example to hear it and see it here' : 'Free play: click any key', ['ans']);
    $('#main').scrollTop = 0;
  }
  const nextId = () => order[order.indexOf(L.id) + 1];
  function go(i) { const n = COURSE[L.id].cards.length; if (i < 0 || i > n) return; L.i = i; render(); }
  function open(id) {
    L.id = id; L.i = 0;
    $('#learnMap').classList.add('hidden'); $('#learnReader').classList.remove('hidden');
    if (TAB !== 'learn') showTab('learn'); else updateDockVisibility();
    render(); updateDockVisibility();
  }
  function close() {
    L.id = null; $('#learnReader').classList.add('hidden'); $('#learnMap').classList.remove('hidden');
    renderMap(); updateDockVisibility(); $('#main').scrollTop = 0;
  }

  document.addEventListener('keydown', e => {
    if (!isOpen() || ['SELECT', 'INPUT', 'TEXTAREA'].includes(e.target.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); go(L.i + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(L.i - 1); }
    else if (e.key === 'Escape') close();
  });
  $$('.tab').forEach(b => b.addEventListener('click', () => { if (b.dataset.tab === 'learn' && !L.id) renderMap(); }));

  renderMap();
  return { open, isOpen, isLearned: id => learned.has(id), renderMap, reset: () => { learned = new Set(); store.set('learned', []); renderMap(); } };
})();
