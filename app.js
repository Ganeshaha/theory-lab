'use strict';
/* =====================================================================
   UI: synth, piano dock, practice flow, explorer, progress
   ===================================================================== */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const store = {
  get: (k, d) => { try { const v = localStorage.getItem('theorylab.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set: (k, v) => { try { localStorage.setItem('theorylab.' + k, JSON.stringify(v)); } catch (e) { } },
};

// ---------------- synth ----------------
const Snd = {
  ctx: null, master: null, voices: [],
  ensure() {
    if (!this.ctx) {
      const C = window.AudioContext || window.webkitAudioContext; this.ctx = new C();
      const comp = this.ctx.createDynamicsCompressor(); this.master = this.ctx.createGain(); this.master.gain.value = store.get('vol', 0.7);
      this.master.connect(comp); comp.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },
  tone(midi, when, dur, vol) {
    const c = this.ensure(), t = c.currentTime + when + 0.02, f = 440 * Math.pow(2, (midi - 69) / 12);
    dur = Math.max(dur, 0.45);
    const o1 = c.createOscillator(), o2 = c.createOscillator(), mix2 = c.createGain(), filt = c.createBiquadFilter(), g = c.createGain();
    o1.type = 'triangle'; o2.type = 'sawtooth'; o1.frequency.value = f; o2.frequency.value = f; o2.detune.value = 7; mix2.gain.value = 0.12;
    filt.type = 'lowpass'; filt.Q.value = 0.7;
    filt.frequency.setValueAtTime(Math.min(f * 8, 9000), t); filt.frequency.exponentialRampToValueAtTime(Math.max(f * 2, 400), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(vol * 0.45, t + 0.35); g.gain.setValueAtTime(vol * 0.45, t + dur);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.35);
    o1.connect(filt); o2.connect(mix2); mix2.connect(filt); filt.connect(g); g.connect(this.master);
    o1.start(t); o2.start(t); o1.stop(t + dur + 0.4); o2.stop(t + dur + 0.4);
    this.voices.push(o1, o2);
  },
  stop() { for (const v of this.voices) { try { v.stop(); } catch (e) { } } this.voices = []; },
  play(events) {
    if (!events) return; this.stop();
    for (const e of events) { const v = 0.32 / Math.sqrt(e.notes.length); e.notes.forEach(m => this.tone(m, e.t, e.d, v)); }
  },
  note(m) { this.tone(m, 0, 0.6, 0.3); },
};

// ---------------- shared key (highlighted on the keyboard and the piano roll) ----------------
const KEYSEL = Object.assign({ root: 'C', type: 'off' }, store.get('pianoKey', {}));
let KEY_READY = false; // set at the end of the script, once every helper exists
const DEG_SEMI = { 0: '1', 1: '♭2', 2: '2', 3: '♭3', 4: '3', 5: '4', 6: '♯4', 7: '5', 8: '♭6', 9: '6', 10: '♭7', 11: '7' };
function keyInfo() {
  if (!KEY_READY || KEYSEL.type === 'off' || !SCALES[KEYSEL.type]) return null;
  const notes = scaleNotes(KEYSEL.root, KEYSEL.type), r = pc(KEYSEL.root), byPc = {};
  notes.forEach((n, i) => { const iv = SCALES[KEYSEL.type].iv[i]; byPc[pc(n)] = { name: n, deg: (typeof DEG !== 'undefined' && DEG[iv]) || DEG_SEMI[(pc(n) - r + 12) % 12] }; });
  return { notes, byPc, root: r };
}

// ---------------- piano ----------------
let LABEL_MODE = store.get('labels', 'both');
const ALL_PIANOS = [];
// Right-click a key to leave it marked (on every keyboard) until it is right-clicked again. Marks survive questions and page changes.
const PINS = new Set();
function syncPins() { ALL_PIANOS.forEach(p => p.refresh()); const b = $('#dkUnpin'); b.classList.toggle('hidden', !PINS.size); b.textContent = `Clear marks (${PINS.size})`; }
function togglePin(m) { if (PINS.has(m)) PINS.delete(m); else { PINS.add(m); Snd.note(m); } syncPins(); }
class Piano {
  constructor(el) { this.el = el; this.selectable = false; this.selected = new Set(); this.keys = {}; this.hidden = false; this.build(); ALL_PIANOS.push(this); }
  build() {
    this.el.innerHTML = ''; this.el.classList.add('piano');
    const ww = 100 / range(LO, HI).filter(m => !isBlackPc(m)).length; let wi = 0;
    for (let m = LO; m <= HI; m++) {
      const k = document.createElement('div'), lbl = document.createElement('span'), deg = document.createElement('i'); lbl.className = 'lbl'; deg.className = 'deg'; k.appendChild(deg); k.appendChild(lbl);
      if (isBlackPc(m)) { k.className = 'key black'; k.style.left = (wi * ww - ww * 0.31) + '%'; k.style.width = (ww * 0.62) + '%'; }
      else { k.className = 'key white'; k.style.left = (wi * ww) + '%'; k.style.width = ww + '%'; wi++; }
      if (m === 60) { k.classList.add('middle-c'); k.title = 'Middle C (C4; Ableton calls it C3)'; }
      k.addEventListener('pointerdown', e => { e.preventDefault(); if (e.button === 0) this.press(m); });
      k.addEventListener('contextmenu', e => { e.preventDefault(); togglePin(m); });
      this.el.appendChild(k); this.keys[m] = { el: k, lbl, deg, name: null, sub: null };
    }
    this.refresh();
  }
  defaultLabel(m) {
    const p = m % 12, oct = Math.floor(m / 12) - 1;
    if (!isBlackPc(p)) return SHARP_NAMES[p] + (p === 0 ? `<sub>${oct}</sub>` : '');
    if (LABEL_MODE === 'sharp') return disp(SHARP_NAMES[p]);
    if (LABEL_MODE === 'flat') return disp(FLAT_NAMES[p]);
    return `${disp(SHARP_NAMES[p])}<br>${disp(FLAT_NAMES[p])}`;
  }
  refresh() {
    this.el.classList.toggle('hide-labels', this.hidden || LABEL_MODE === 'off');
    const K = keyInfo();
    for (const [m, k] of Object.entries(this.keys)) {
      const p = +m % 12, info = K && K.byPc[p], spelled = info && (isBlackPc(p) || info.name !== SHARP_NAMES[p]) ? disp(info.name) + (p === 0 ? `<sub>${Math.floor(m / 12) - 1}</sub>` : '') : null;
      k.lbl.innerHTML = (k.name ? disp(k.name) : spelled || this.defaultLabel(+m)) + (k.sub ? `<em>${k.sub}</em>` : '');
      k.el.classList.toggle('pin', PINS.has(+m)); k.el.classList.toggle('inkey', !!info); k.el.classList.toggle('keyroot', !!info && p === K.root); k.deg.textContent = info ? info.deg : '';
    }
  }
  setHidden(h) { this.hidden = h; this.refresh(); }
  clear() {
    for (const k of Object.values(this.keys)) { k.el.classList.remove('q', 'ans', 'sel', 'wrong', 'hint', 'root'); k.name = k.sub = null; }
    this.selected.clear(); this.refresh();
  }
  mark(list, cls) {
    for (const x of list || []) { const k = this.keys[x.midi]; if (!k) continue; k.el.classList.add(cls); if (x.label) k.name = x.label; if (x.sub) k.sub = x.sub; }
    this.refresh(); this.scrollToMarks();
  }
  scrollToMarks() {
    const sc = this.el.parentElement; if (!sc || sc.scrollWidth <= sc.clientWidth + 2) return;
    const marked = Object.values(this.keys).filter(k => /\b(q|ans|hint|sel)\b/.test(k.el.className)).map(k => k.el);
    if (!marked.length) return;
    const l = Math.min(...marked.map(e => e.offsetLeft)), r = Math.max(...marked.map(e => e.offsetLeft + e.offsetWidth));
    sc.scrollTo({ left: Math.max(0, (l + r) / 2 - sc.clientWidth / 2), behavior: 'smooth' });
  }
  press(m) {
    Snd.note(m); const k = this.keys[m].el; k.classList.add('active'); setTimeout(() => k.classList.remove('active'), 180);
    if (this.selectable) { if (this.selected.has(m)) { this.selected.delete(m); k.classList.remove('sel', 'wrong'); } else { this.selected.add(m); k.classList.add('sel'); } }
    if (this.onPress) this.onPress(m);
  }
}

// ---------------- dock (shared piano area) ----------------
const LEGEND = { q: ['#f5c542', 'Question'], ans: ['#4ade80', 'Answer / notes'], sel: ['#67d5f5', 'Your picks'], wrong: ['#f87171', 'Wrong pick'], hint: ['#b3a3ff', 'Missed'] };
// The dock can collapse to a thin strip. user = explicit choice (remembered); otherwise on small
// screens it collapses itself whenever the piano isn't needed. force = content needs the keys.
const DOCK = { user: store.get('dockCollapsed', null), idle: false, force: false };
const smallScreen = () => window.innerWidth <= 680 || window.innerHeight <= 620;
function applyDock() {
  const collapsed = DOCK.force ? false : DOCK.user !== null ? DOCK.user : (smallScreen() && DOCK.idle);
  $('#dock').classList.toggle('collapsed', collapsed);
  const b = $('#dockToggle'); b.textContent = collapsed ? '▴ Piano' : '▾ Hide'; b.setAttribute('aria-expanded', String(!collapsed));
}
function setDock(note, legend = [], idle = false, force = false) {
  $('#dockNote').innerHTML = note;
  $('#legend').innerHTML = legend.filter(k => k !== 'ans').map(k => `<span><i style="background:${LEGEND[k][0]}"></i>${LEGEND[k][1]}</span>`).join('');
  $('#dock').classList.toggle('idle', idle);
  DOCK.idle = idle; DOCK.force = force; applyDock();
}
function dockWake() { DOCK.idle = false; DOCK.force = true; $('#dock').classList.remove('idle'); applyDock(); }
$('#dockToggle').onclick = () => { DOCK.force = false; DOCK.user = !$('#dock').classList.contains('collapsed'); store.set('dockCollapsed', DOCK.user); applyDock(); };
window.addEventListener('resize', applyDock);

// ---------------- stats ----------------
let STATS = store.get('stats', {});
function record(topic, ok) { const s = STATS[topic] || (STATS[topic] = { c: 0, t: 0 }); s.t++; if (ok) s.c++; store.set('stats', STATS); }
const acc = t => STATS[t] && STATS[t].t ? STATS[t].c / STATS[t].t : null;
const topicName = id => (TOPICS.find(t => t.id === id) || { name: id }).name;
const PART_NAMES = { 1: 'Part 1 · Foundations', 2: 'Part 2 · Minor, songs & writing', 3: 'Part 3 · Advanced harmony', 4: 'Part 4 · Producer toolkit' };
const accColor = a => a >= 0.8 ? 'var(--good)' : a >= 0.5 ? 'var(--warn)' : 'var(--bad)';
const meter = a => `<div class="meter"><div style="width:${Math.round(a * 100)}%;background:${accColor(a)}"></div></div>`;
// ---- lessons switched off: right-click a lesson or topic. They stay readable but are skipped by the daily plan and the course flow. ----
let OFF = new Set(store.get('off', []).filter(id => TOPICS.some(t => t.id === id)));
const isOff = id => OFF.has(id);
function toggleOff(id) {
  OFF.has(id) ? OFF.delete(id) : OFF.add(id); store.set('off', [...OFF]);
  if (OFF.has(id)) SELECTED.delete(id);
  renderSetup(); renderHome(); Learn.renderMap();
}
function weakest(n) {
  return TOPICS.filter(t => !isOff(t.id)).map(t => ({ id: t.id, a: acc(t.id) })).sort((x, y) => (x.a === null ? 0.55 : x.a) - (y.a === null ? 0.55 : y.a)).slice(0, n).map(x => x.id);
}

// ---------------- tabs & labels ----------------
let TAB = 'quiz';
const TOOLS = Object.assign({ piano: true, roll: false, circle: false, finder: false, tempo: false, cheat: false }, store.get('tools', {}));
// The piano dock only appears where it's used: in the Explorer, and during a quiz when the Piano tool is on
// (or when the question needs you to play notes).
function updateDockVisibility() {
  const inQuiz = TAB === 'quiz' && !$('#play').classList.contains('hidden');
  const needed = inQuiz && S.q && S.q.type === 'piano' && !S.answered;
  const reading = TAB === 'learn' && typeof Learn !== 'undefined' && Learn.isOpen();
  $('#dock').classList.toggle('hidden', !((inQuiz && (TOOLS.piano || needed)) || TAB === 'explore' || TAB === 'create' || reading));
}
function showTab(name) {
  TAB = name;
  if (typeof seqStop === 'function') seqStop();
  $$('.tab').forEach(x => x.classList.toggle('active', x.dataset.tab === name));
  $$('.tabpane').forEach(p => p.classList.toggle('active', p.id === 'tab-' + name));
  updateDockVisibility();
  $('#quizPiano').classList.toggle('hidden', name !== 'quiz');
  $('#explorePiano').classList.toggle('hidden', !['explore', 'create', 'learn'].includes(name));
  if (name === 'stats') renderStats();
  if (name === 'explore') setDock('', []);
  if (name === 'create') setDock('', [], smallScreen());
  if (name === 'quiz') quizDockNote();
  $('#main').scrollTop = 0; syncHash();
}
// ---- address bar: #learn, #learn/<topic>, #create ... so Back/Forward work and a reload keeps your place ----
let ROUTING = false;
function syncHash() {
  if (ROUTING || typeof Learn === 'undefined') return;
  const h = TAB === 'quiz' ? '' : TAB === 'learn' && Learn.topic() ? 'learn/' + Learn.topic() : TAB;
  if (decodeURIComponent(location.hash.slice(1)) === h) return;
  try { history.pushState(null, '', h ? '#' + h : location.pathname + location.search); } catch (e) { }
}
function route() {
  const [tab, id] = decodeURIComponent(location.hash.slice(1)).split('/'), name = ['learn', 'create', 'explore', 'stats'].includes(tab) ? tab : 'quiz';
  ROUTING = true;
  try {
    if (name === 'learn' && id && COURSE[id] && Learn.topic() !== id) Learn.open(id);
    else { if (name === 'learn' && !id && Learn.topic()) Learn.close(); if (TAB !== name) $(`.tab[data-tab=${name}]`).click(); }
  } finally { ROUTING = false; }
}
window.addEventListener('popstate', route); window.addEventListener('DOMContentLoaded', route);
$$('.tab').forEach(b => b.onclick = () => showTab(b.dataset.tab));
$('#labelMode').value = LABEL_MODE;
$('#labelMode').onchange = e => { LABEL_MODE = e.target.value; store.set('labels', LABEL_MODE); ALL_PIANOS.forEach(p => p.refresh()); };

// =====================================================================
//  PRACTICE: setup
// =====================================================================
const quizPiano = new Piano($('#quizPiano'));
let SELECTED = new Set(store.get('topics', TOPICS.filter(t => t.part < 4 || t.id === 'rhythm').map(t => t.id)).filter(id => TOPICS.some(t => t.id === id)));
let QCOUNT = store.get('qcount', 20);

function renderSetup() {
  const wrap = $('#topicGroups'); wrap.innerHTML = '';
  for (const part of [1, 2, 3, 4]) {
    const ts = TOPICS.filter(x => x.part === part);
    const g = document.createElement('div'); g.className = 'part';
    g.innerHTML = `<div class="part-head"><b>${PART_NAMES[part]}</b><button class="ghost" data-toggle="${part}">toggle</button></div>` + ts.map(t => {
      const a = acc(t.id);
      return `<label class="topic"><input type="checkbox" value="${t.id}" ${SELECTED.has(t.id) ? 'checked' : ''}><span>${t.name}</span><span class="acc">${a === null ? '' : Math.round(a * 100) + '%'}</span>${a === null ? '' : `<span class="mini"><div style="width:${Math.round(a * 100)}%;background:${accColor(a)}"></div></span>`}</label>`;
    }).join('');
    wrap.appendChild(g);
  }
  wrap.querySelectorAll('input').forEach(i => i.onchange = () => { i.checked ? SELECTED.add(i.value) : SELECTED.delete(i.value); updateCount(); });
  wrap.querySelectorAll('[data-toggle]').forEach(b => b.onclick = () => {
    const ids = TOPICS.filter(t => t.part === +b.dataset.toggle).map(t => t.id), allOn = ids.every(id => SELECTED.has(id));
    ids.forEach(id => allOn ? SELECTED.delete(id) : SELECTED.add(id)); renderSetup();
  });
  $$('#qCount button').forEach(b => b.classList.toggle('active', +b.dataset.n === QCOUNT));
  updateCount();
}
function updateCount() { $('#selCount').textContent = SELECTED.size; $('#startBtn').disabled = !SELECTED.size; store.set('topics', [...SELECTED]); }
$$('#presets button').forEach(b => b.onclick = () => {
  const p = b.dataset.preset;
  SELECTED = new Set((p === 'all' ? TOPICS.map(t => t.id) : p === 'none' ? [] : p === 'weak' ? weakest(5) : TOPICS.filter(t => t.part === +p).map(t => t.id)).filter(id => !isOff(id)));
  renderSetup();
});
$$('#qCount button').forEach(b => b.onclick = () => { QCOUNT = +b.dataset.n; store.set('qcount', QCOUNT); renderSetup(); });
$('#autoPlay').checked = store.get('autoplay', true); $('#autoPlay').onchange = e => store.set('autoplay', e.target.checked);
renderSetup();

// =====================================================================
//  PRACTICE: play
// =====================================================================
const S = {
  topics: [], total: 0, idx: 0, score: 0, streak: 0, best: 0, q: null, answered: false, hist: [], seen: new Set(), weak: false, retry: [],
  learn: true, tries: 0, hints: 0, plan: null, planPos: 0, lessonsShown: new Set(), start: 0, xp: 0, boxUps: [], levelUps: [], breakShown: false, inLesson: null, kind: 'custom',
};
$('#learnMode').checked = store.get('learn', true); $('#learnMode').onchange = e => store.set('learn', e.target.checked);
$('#sfx').checked = store.get('sfx', true); $('#sfx').onchange = e => store.set('sfx', e.target.checked);
$('#goalSel').value = String(Coach.goal()); $('#goalSel').onchange = e => { Coach.setGoal(+e.target.value); renderHome(); };

// ---- small reward sounds (separate from the music voices so they never cut a chord off) ----
function blip(freq, when, dur, vol, type = 'sine') {
  const c = Snd.ensure(), t = c.currentTime + when, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.value = freq; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(Snd.master); o.start(t); o.stop(t + dur + 0.05);
}
function sfx(kind) {
  if (!$('#sfx').checked) return;
  if (kind === 'first') { blip(1046.5, 0.05, 0.18, 0.08); blip(1568, 0.13, 0.32, 0.08); }
  else if (kind === 'later') blip(1046.5, 0.05, 0.25, 0.07);
  else if (kind === 'try') blip(330, 0, 0.14, 0.05, 'triangle');
  else if (kind === 'level') [784, 988, 1175, 1568].forEach((f, i) => blip(f, 0.1 + i * 0.09, 0.3, 0.07));
}

// ---- topic picking: retry queue → plan → (weighted) random ----
function pickTopic() {
  const due = S.retry.findIndex(r => r.due <= S.idx);
  if (due >= 0) return { topic: S.retry.splice(due, 1)[0].topic, retry: true };
  if (S.plan && S.planPos < S.plan.length) { const it = S.plan[S.planPos++]; return { topic: it.topic, lesson: !!it.lesson }; }
  if (!S.weak) return { topic: R.pick(S.topics) };
  const w = S.topics.map(t => { const a = acc(t); return a === null ? 1 : 0.15 + (1 - a); });
  let r = Math.random() * w.reduce((x, y) => x + y, 0);
  for (let i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0) return { topic: S.topics[i] }; }
  return { topic: S.topics[S.topics.length - 1] };
}
function freshQuestion(pick) {
  let q;
  for (let i = 0; i < 25; i++) { q = makeQuestion(pick.topic); const k = q.prompt + '|' + (q.options || []).join(); if (!S.seen.has(k)) { S.seen.add(k); break; } }
  q.retry = !!pick.retry; return q;
}
function startQuiz(topics, opts = {}) {
  S.topics = topics || [...SELECTED]; if (!S.topics.length) return;
  Object.assign(S, {
    total: opts.total !== undefined ? opts.total : QCOUNT, idx: 0, score: 0, streak: 0, best: 0, hist: [], seen: new Set(),
    weak: opts.plan ? false : $('#weakFirst').checked, retry: [], learn: $('#learnMode').checked,
    plan: opts.plan || null, planPos: 0, lessonsShown: new Set(), start: Date.now(), xp: 0, boxUps: [], levelUps: [], breakShown: false, kind: opts.kind || 'custom',
  });
  Snd.ensure();
  $('#setup').classList.add('hidden'); $('#summary').classList.add('hidden'); $('#play').classList.remove('hidden'); $('#breakBanner').classList.add('hidden');
  showTab('quiz'); applyTools(); nextQuestion();
}
function startDaily() { const P = Coach.buildPlan(10); startQuiz([...new Set(P.plan.map(x => x.topic))], { plan: P.plan, total: 10, kind: 'daily' }); }
function startTopic(id) { startQuiz([id], { total: 8, plan: [{ topic: id, lesson: Coach.status(id) === 'new' }], kind: 'topic' }); }

$('#startBtn').onclick = () => startQuiz();
$('#endBtn').onclick = () => finish();
$('#nextBtn').onclick = () => advance();
$('#replayBtn').onclick = () => Snd.play(S.q && S.q.audio);
$('#pClear').onclick = () => { quizPiano.selected.forEach(m => quizPiano.keys[m].el.classList.remove('sel', 'wrong')); quizPiano.selected.clear(); };
$('#pSubmit').onclick = () => submitPiano();
$('#hintBtn').onclick = () => hint();
$('#showBtn').onclick = () => showAnswer();
$('#lessonBtn').onclick = () => toggleLessonPeek();

function advance() { if (S.total && S.idx >= S.total) finish(); else nextQuestion(); }
function scoreHTML() { return `<span class="ok">✓ ${S.score}</span><span class="muted">/${S.hist.length}</span> · ⚡ ${S.xp} XP`; }
function tryMsg(t, info) { const el = $('#tryMsg'); el.innerHTML = t || ''; el.classList.toggle('info', !!info); }
function quizDockNote() {
  updateDockVisibility();
  if ($('#play').classList.contains('hidden')) { setDock('', []); return; }
  if (S.inLesson) { setDock('', [], true); return; }
  if (!S.q) return;
  const q = S.q;
  if (S.answered) { const has = q.type === 'piano' || q.reveal || (q.show && q.show.length); setDock('', !has ? [] : q.type === 'piano' ? ['ans', 'wrong', 'hint'] : ['ans'], !has); }
  else if (q.type === 'piano') setDock('', ['sel', 'wrong', 'hint'], false, true);
  else if (q.show && q.show.length) setDock(q.hideLabels ? 'Labels hidden' : '', ['q'], false, true);
  else setDock('', [], true);
}

// ---- explanations: lead with one sentence, rest behind "More" (less to read at once) ----
function chunk(html) {
  if (html.length < 170) return html;
  const m = /([.!?])\s(?=[A-Z0-9(“"<])|<br>/.exec(html);
  if (!m || m.index < 25 || m.index > html.length - 40) return html;
  const cut = m.index + (m[0] === '<br>' ? 0 : 1);
  return `${html.slice(0, cut)} <details class="more"><summary>More ▾</summary>${html.slice(cut).replace(/^<br>/, '')}</details>`;
}

// ---- mini-lessons ----
function lessonHTML(id, kicker) {
  const L = LESSONS[id]; if (!L) return '';
  return `<div class="lesson"><div class="lesson-kicker">${kicker} · ${topicName(id)}</div><div class="lesson-idea">${L.idea}</div>
    <ul>${L.points.map(p => `<li>${p}</li>`).join('')}</ul>${L.tip ? `<div class="lesson-tip">${L.tip}</div>` : ''}</div>`;
}
function playDemo(id) {
  const d = LESSONS[id] && LESSONS[id].demo; if (!d) return;
  quizPiano.clear(); quizPiano.setHidden(false); dockWake();
  if (d.seq) {
    const vs = d.seq.map(g => voice(g)); Snd.play(EV.seq(vs.map(mids), 0, 1.0));
    vs.forEach((v, i) => setTimeout(() => { if (!S.inLesson && !S.peek) return; quizPiano.clear(); quizPiano.mark(v, 'ans'); }, i * 1000));
  } else {
    const v = d.mel ? melodyVoice(d.mel) : voice(d.arp || d.chord); quizPiano.mark(v, 'ans');
    Snd.play(d.chord ? EV.chord(mids(v)) : EV.arp(mids(v), 0, d.mel ? 0.32 : 0.25, 0.4));
  }
}
function showLesson(id, cb) {
  S.q = null; S.inLesson = cb; S.peek = false;
  $('#qProg').textContent = 'Mini-lesson'; $('#qTopic').textContent = topicName(id); $('#qRetry').classList.add('hidden');
  $('#lessonPeek').classList.add('hidden');
  $('#qPrompt').innerHTML = lessonHTML(id, 'New topic');
  seqStop(); ['#replayBtn', '#qFeedback', '#qPianoCtl', '#learnRow', '#qSeq'].forEach(s => $(s).classList.add('hidden'));
  const o = $('#qOpts'); o.classList.remove('hidden');
  o.innerHTML = `<div class="lesson-actions">${LESSONS[id].demo ? '<button id="demoBtn">▶ Hear it</button>' : ''}<button id="lessonGo" class="primary">Got it, try a question <kbd>Enter</kbd></button><button id="fullLesson" class="ghost">Read the full lesson</button></div>`;
  quizPiano.clear(); quizPiano.selectable = false; quizDockNote();
  if ($('#demoBtn')) $('#demoBtn').onclick = () => playDemo(id);
  $('#lessonGo').onclick = () => lessonDone();
  $('#fullLesson').onclick = () => Learn.open(id);
  $('#main').scrollTop = 0;
  if (LESSONS[id].demo && $('#autoPlay').checked) setTimeout(() => S.inLesson && playDemo(id), 300);
}
function lessonDone() {
  const cb = S.inLesson; if (!cb) return;
  S.inLesson = null; S.xp += 5; const lv = Coach.addXP(5); if (lv) S.levelUps.push(lv);
  cb();
}
function toggleLessonPeek() {
  const el = $('#lessonPeek'); if (!S.q || !LESSONS[S.q.topic]) return;
  const open = el.classList.contains('hidden');
  el.classList.toggle('hidden', !open); S.peek = open;
  if (open) {
    el.innerHTML = lessonHTML(S.q.topic, 'Lesson') + (LESSONS[S.q.topic].demo ? '<div class="btnrow" style="margin-top:10px"><button class="sm" id="peekDemo">▶ Hear it</button><button class="sm ghost" id="peekClose">Close</button></div>' : '<div class="btnrow" style="margin-top:10px"><button class="sm ghost" id="peekClose">Close</button></div>');
    if ($('#peekDemo')) $('#peekDemo').onclick = () => playDemo(S.q.topic);
    $('#peekClose').onclick = () => toggleLessonPeek();
    $('#peekClose').insertAdjacentHTML('beforebegin', '<button class="sm ghost" id="peekFull">Full lesson</button>'); $('#peekFull').onclick = () => Learn.open(S.q.topic);
  } else if (S.q) { quizPiano.clear(); quizPiano.mark(S.q.show, 'q'); if (S.answered && S.q.reveal) quizPiano.mark(S.q.reveal, 'ans'); }
}

// ---- break nudge (after ~12 min of continuous practice) ----
function checkBreak() {
  if (S.breakShown || Date.now() - S.start < 12 * 60e3) return;
  S.breakShown = true; const b = $('#breakBanner');
  b.innerHTML = `<span>⏸ <b>12 minutes of focus. Nice!</b> A 2-minute stretch or water break helps it stick.</span><span class="grow"></span><button class="sm" id="brKeep">Keep going</button><button class="sm primary" id="brStop">Finish here</button>`;
  b.classList.remove('hidden');
  $('#brKeep').onclick = () => b.classList.add('hidden');
  $('#brStop').onclick = () => { b.classList.add('hidden'); finish(); };
}

// Which reference tool is most useful for each topic (shown as a small dot on its chip).
const TOOL_HINT = { circle: 'circle', minor: 'circle', diatonic: 'circle', camelot: 'circle', advanced: 'circle', mediants: 'circle', progressions: 'circle', fifth: 'circle', modes: 'cheat', exotic: 'cheat', intervals: 'cheat', sevenths: 'cheat', extensions: 'cheat', penta: 'cheat', voicing: 'cheat', triads: 'finder', bass: 'finder', rhythm: 'tempo', structure: 'tempo' };
function nextQuestion() {
  if (S.total && S.idx >= S.total) return finish();
  const pick = pickTopic();
  const needsLesson = (pick.lesson || Coach.status(pick.topic) === 'new') && LESSONS[pick.topic] && !S.lessonsShown.has(pick.topic) && !Learn.isLearned(pick.topic);
  if (needsLesson) { S.lessonsShown.add(pick.topic); return showLesson(pick.topic, () => renderQuestion(pick)); }
  renderQuestion(pick);
}
function renderQuestion(pick) {
  S.inLesson = null; S.peek = false;
  const q = S.q = freshQuestion(pick); S.answered = false; S.idx++; S.tries = 0; S.hints = 0;
  $('#qProg').textContent = S.total ? `Question ${S.idx} of ${S.total}` : `Question ${S.idx}`;
  $('#qTopic').textContent = topicName(q.topic);
  $('#qRetry').classList.toggle('hidden', !q.retry);
  $('#qScore').innerHTML = scoreHTML();
  $('#qBar').style.width = S.total ? ((S.idx - 1) / S.total * 100) + '%' : '0';
  $('#qPrompt').innerHTML = q.prompt;
  $('#lessonPeek').classList.add('hidden');
  $('#qFeedback').classList.add('hidden');
  $('#replayBtn').classList.toggle('hidden', !q.audio);
  $('#learnRow').classList.toggle('hidden', !S.learn); $('#lessonBtn').classList.toggle('hidden', !LESSONS[q.topic]); tryMsg('');

  quizPiano.clear(); quizPiano.setHidden(!!q.hideLabels); quizPiano.mark(q.show, 'q');
  const opts = $('#qOpts'); opts.innerHTML = '';
  if (q.type === 'mc') {
    quizPiano.selectable = false; $('#qPianoCtl').classList.add('hidden'); opts.classList.remove('hidden');
    q.options.forEach((o, i) => {
      const b = document.createElement('button'); b.innerHTML = `<span class="n">${i + 1}</span><span>${o}</span><span class="ic"></span>`;
      b.onclick = () => answerMC(i); opts.appendChild(b);
    });
  } else if (q.type === 'seq') {
    quizPiano.selectable = false; $('#qPianoCtl').classList.add('hidden'); opts.classList.add('hidden'); seqRender();
  } else {
    quizPiano.selectable = true; $('#qPianoCtl').classList.remove('hidden'); opts.classList.add('hidden');
  }
  $('#qSeq').classList.toggle('hidden', q.type !== 'seq'); if (q.type !== 'seq') seqStop();
  quizDockNote(); Tools.onQuestion(q); checkBreak();
  $$('#toolbar button[data-tool]').forEach(b => { const on = (TOOL_HINT[q.topic] || 'cheat') === b.dataset.tool && !TOOLS[b.dataset.tool]; b.classList.toggle('suggest', on); b.title = on ? 'Handy for this question' : ''; });
  $('#main').scrollTop = 0;
  if (q.audio && $('#autoPlay').checked) setTimeout(() => Snd.play(q.audio), 150);
}

// ---- answering (learning mode = retry until correct) ----
const resultOf = () => S.tries === 0 && S.hints === 0 ? 'first' : 'later';
function answerMC(i) {
  if (S.answered) return;
  const q = S.q, btns = $$('#qOpts button');
  if (i === q.answer) return finalizeMC(i, resultOf());
  S.tries++;
  if (!S.learn) return finalizeMC(i, 'wrong');
  const b = btns[i]; b.classList.add('tried'); b.disabled = true; b.querySelector('.ic').textContent = '✗'; sfx('try');
  const left = btns.filter(x => !x.disabled);
  if (left.length === 1) return finalizeMC(q.answer, 'later');
  tryMsg(R.pick(['Not quite, try again.', 'Close! Have another go.', 'Nope, try another one.']) + (S.tries >= 2 ? ' Stuck? Try Hint or Lesson.' : ''));
}
function finalizeMC(pick, result) {
  S.answered = true; const q = S.q;
  $$('#qOpts button').forEach((b, j) => {
    b.disabled = true;
    if (j === q.answer) { b.classList.remove('elim'); b.classList.add('correct'); b.querySelector('.ic').textContent = '✓'; }
    else if (j === pick && result === 'wrong') { b.classList.add('wrong'); b.querySelector('.ic').textContent = '✗'; }
  });
  quizPiano.setHidden(false);
  if (q.reveal) { quizPiano.clear(); quizPiano.mark(q.reveal, 'ans'); } else if (q.show.length) quizPiano.mark(q.show, 'ans');
  conclude(result, q.options[q.answer]);
}
function pianoResult(sel) {
  const q = S.q; quizPiano.clear();
  sel.forEach(m => quizPiano.keys[m].el.classList.add(q.target.has(m % 12) ? 'ans' : 'wrong'));
  const covered = new Set(sel.filter(m => q.target.has(m % 12)).map(m => m % 12));
  quizPiano.mark(q.reveal.filter(x => !covered.has(x.midi % 12)), 'hint');
  sel.forEach(m => { const r = q.reveal.find(x => x.midi % 12 === m % 12); if (r) quizPiano.keys[m].name = r.label; }); quizPiano.refresh();
  Snd.play(EV.chord(mids(q.reveal)));
}
function submitPiano() {
  if (S.answered || !S.q || S.q.type !== 'piano') return;
  const q = S.q, sel = [...quizPiano.selected], selPcs = new Set(sel.map(m => m % 12));
  if (!sel.length) return tryMsg('Select some keys first.', true);
  const ok = selPcs.size === q.target.size && [...q.target].every(p => selPcs.has(p));
  if (!ok) {
    S.tries++;
    if (S.learn) {
      const right = [...q.target].filter(p => selPcs.has(p)).length, extra = [...selPcs].filter(p => !q.target.has(p)).length;
      sel.forEach(m => quizPiano.keys[m].el.classList.toggle('wrong', !q.target.has(m % 12)));
      Snd.play(EV.chord(sel.slice().sort((a, b) => a - b))); sfx('try');
      return tryMsg(`${right} of ${q.target.size} notes right${extra ? `, ${extra} not in the chord (red)` : ''}${right < q.target.size ? ', and something is missing' : ''}. Adjust and resubmit.`);
    }
  }
  S.answered = true; $('#qPianoCtl').classList.add('hidden'); quizPiano.selectable = false;
  pianoResult(sel);
  conclude(ok ? resultOf() : 'wrong', listFmt(q.reveal.map(x => x.label)), ok ? '' : '<div class="fb-legend">On the keyboard: green = correct picks · red = not in the chord · purple = notes you missed. Any octave or inversion counts.</div>');
}
function hint() {
  if (S.answered || !S.learn || !S.q) return;
  const q = S.q;
  if (q.type === 'seq') return seqHint();
  if (q.type === 'mc') {
    const cands = $$('#qOpts button').map((b, j) => ({ b, j })).filter(x => x.j !== q.answer && !x.b.disabled);
    if (cands.length <= 1) return tryMsg('No more hints. It\'s one of the two left!', true);
    const x = R.pick(cands); x.b.classList.add('elim'); x.b.disabled = true; S.hints++;
    tryMsg(`Removed one wrong answer.${cands.length - 1 > 1 ? ' Ask again to remove another.' : ''}`, true);
  } else {
    const selPcs = new Set([...quizPiano.selected].map(m => m % 12));
    const hinted = new Set(Object.entries(quizPiano.keys).filter(([, k]) => k.el.classList.contains('hint')).map(([m]) => +m % 12));
    const next = q.reveal.find(x => !selPcs.has(x.midi % 12) && !hinted.has(x.midi % 12));
    if (!next) return tryMsg('You already have every note. Remove any red ones and submit.', true);
    S.hints++; quizPiano.mark([next], 'hint'); tryMsg(`${disp(next.label)} is in the chord (purple). Click it to add it.`, true);
  }
}
function showAnswer() {
  if (S.answered || !S.q) return;
  const q = S.q; S.tries++;
  if (q.type === 'mc') return finalizeMC(-1, 'revealed');
  if (q.type === 'seq') return finalizeSeq('revealed');
  S.answered = true; $('#qPianoCtl').classList.add('hidden'); quizPiano.selectable = false;
  pianoResult([...quizPiano.selected].filter(m => q.target.has(m % 12)));
  conclude('revealed', listFmt(q.reveal.map(x => x.label)));
}
function conclude(result, answerText, extra = '') {
  const q = S.q, ok = result === 'first'; record(q.topic, ok);
  const r = Coach.onResult(q.topic, result); S.xp += r.gain; renderStatus();
  if (r.boxUp && !S.boxUps.includes(q.topic)) S.boxUps.push(q.topic);
  if (r.levelUp) S.levelUps.push(r.levelUp);
  if (ok) { S.score++; S.streak++; S.best = Math.max(S.best, S.streak); }
  else { S.streak = 0; if (!q.retry) S.retry.push({ topic: q.topic, due: S.idx + 3 }); }
  S.hist.push({ topic: q.topic, ok, prompt: q.prompt, answer: answerText }); if (!ok) noteMiss(q, answerText);
  sfx(r.levelUp ? 'level' : result === 'first' ? 'first' : result === 'later' ? 'later' : 'none');
  $('#qScore').innerHTML = scoreHTML();
  $('#qBar').style.width = S.total ? (S.idx / S.total * 100) + '%' : '0';
  $('#learnRow').classList.add('hidden'); $('#lessonPeek').classList.add('hidden');
  $('#nextBtn').innerHTML = (S.total && S.idx >= S.total ? 'Finish' : 'Next') + ' <kbd>Enter</kbd>';
  const fb = $('#qFeedback'); fb.className = 'feedback ' + (result === 'first' || result === 'later' ? 'good' : 'bad');
  const title = {
    first: S.streak >= 3 ? `✓ Correct! ${S.streak} in a row` : R.pick(['✓ Correct!', '✓ Nice!', '✓ Yes!', '✓ Spot on!']),
    later: `✓ Got it${S.tries ? ` on try ${S.tries + 1}` : ''}${S.hints ? ` with ${S.hints} hint${S.hints > 1 ? 's' : ''}` : ''}: ${answerText}`,
    revealed: `Answer: ${answerText}`, wrong: `✗ Answer: ${answerText}`,
  }[result];
  $('#fbTitle').innerHTML = `${title}<span class="xp-pop">+${r.gain} XP</span>${r.levelUp ? `<span class="lvl-pop">Level ${r.levelUp}!</span>` : ''}${r.boxUp ? '<span class="xp-pop" title="This topic moved up a mastery level">▲ topic up</span>' : ''}`;
  $('#fbBody').innerHTML = chunk(q.explain) + extra + (!ok && !q.retry ? '<div class="fb-legend">↻ This topic comes back in a few questions. Repetition is how it sticks.</div>' : '');
  if (q.create) { $('#fbBody').insertAdjacentHTML('beforeend', '<div class="fb-create"><button class="sm" id="toCreate">Try this progression in Create</button></div>'); $('#toCreate').onclick = () => Create.load(q.create); }
  $('#nextBtn').innerHTML = (S.total && S.idx >= S.total ? 'See results' : 'Next') + ' <kbd>Enter</kbd>';
  quizDockNote(); Tools.onAnswer(q);
  requestAnimationFrame(() => { fb.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); $('#nextBtn').focus({ preventScroll: true }); });
}

function finish() {
  Tools.stop(); seqStop(); S.inLesson = null;
  $('#play').classList.add('hidden'); quizPiano.clear(); quizPiano.setHidden(false); quizPiano.selectable = false; S.q = null;
  const n = S.hist.length, pct = n ? Math.round(S.score / n * 100) : 0, mins = Math.max(1, Math.round((Date.now() - S.start) / 60000));
  const by = {}; S.hist.forEach(h => { const b = by[h.topic] || (by[h.topic] = { c: 0, t: 0 }); b.t++; if (h.ok) b.c++; });
  const rows = Object.entries(by).sort((a, b) => a[1].c / a[1].t - b[1].c / b[1].t).map(([t, v]) => `<div class="srow"><span>${topicName(t)}</span><span class="n">${v.c}/${v.t}</span><span class="n">${Math.round(v.c / v.t * 100)}%</span>${meter(v.c / v.t)}</div>`).join('');
  const missed = S.hist.filter(h => !h.ok), missedTopics = [...new Set(missed.map(h => h.topic))];
  const head = n === 0 ? 'Every bit counts' : pct >= 85 ? 'Great session!' : pct >= 60 ? 'Good work. That\'s real progress.' : 'You showed up, and that\'s the hard part.';
  const goalHit = Coach.today() >= Coach.goal();
  // What to do next: after a shaky single-topic session, repeat it; otherwise move along the course.
  const topics = S.topics, kind = S.kind, again = () => kind === 'daily' ? startDaily() : kind === 'topic' ? startTopic(topics[0]) : startQuiz(topics);
  const againLabel = kind === 'topic' ? `One more round: ${topicName(topics[0])}` : kind === 'daily' ? 'Another 5-minute round' : 'One more round';
  const course = Flow.course(), shaky = kind === 'topic' && n > 0 && pct < 60;
  const nextStep = (!shaky && course) || { kind: 'again', icon: '↻', title: againLabel, sub: shaky ? 'A second pass right away is where it starts to stick.' : 'Fresh questions on the same topics.', go: again };
  $('#summary').innerHTML = `
    <div class="panel">
      <div class="sum-hero">
        <div class="ring" style="--p:${pct};--c:${accColor(pct / 100)}"><div>${pct}%</div></div>
        <div><h1>${head}</h1>
          <div class="sum-stats"><div><b>⚡ ${S.xp}</b>XP earned</div><div><b>${mins} min</b>practised</div><div><b>${S.score}/${n}</b>first try</div><div><b>${Coach.today()}/${Coach.goal()}</b>today's goal${goalHit ? ' ✓' : ''}</div></div>
          ${S.levelUps.length ? `<p style="margin-top:10px"><span class="lvl-pop">Level ${S.levelUps[S.levelUps.length - 1]} reached!</span></p>` : ''}
          ${S.boxUps.length ? `<div class="upchips"><span class="muted small">Moved up:</span>${S.boxUps.map(t => `<span class="chip">▲ ${topicName(t)}</span>`).join('')}</div>` : ''}
          </div>
      </div>
      <div class="nextup">
        <div class="kicker">Up next</div>
        <button class="step now" id="nextStepBtn"><span class="num">${nextStep.icon}</span><span class="st"><span class="st-t">${nextStep.title}</span><span class="st-s">${nextStep.sub}</span></span><span class="go">Go <kbd>Enter</kbd></span></button>
        <div class="btnrow">
          ${nextStep.kind === 'again' ? (course ? `<button id="sumCourse">${course.icon} ${course.title}</button>` : '') : `<button id="againBtn">↻ ${againLabel}</button>`}
          ${missedTopics.length ? `<button id="missBtn">Drill what I missed (${missedTopics.length} topic${missedTopics.length > 1 ? 's' : ''})</button>` : ''}
          ${goalHit ? '<button id="sumCreate">Make a loop</button>' : ''}
          <button class="ghost" id="homeBtn">Home</button>
        </div>
      </div>
    </div>
    ${n ? `<div class="panel"><div class="panel-title">By topic (first-try accuracy)</div>${rows}</div>` : ''}
    ${missed.length ? `<div class="panel"><div class="panel-title">Worth another look</div><ul class="missed">${missed.map(h => `<li>${h.prompt}<div class="a">→ ${h.answer}</div></li>`).join('')}</ul></div>` : ''}`;
  $('#summary').classList.remove('hidden'); $('#main').scrollTop = 0;
  $('#nextStepBtn').onclick = () => { $('#summary').classList.add('hidden'); nextStep.go(); };
  if ($('#againBtn')) $('#againBtn').onclick = again;
  if ($('#sumCourse')) $('#sumCourse').onclick = () => { $('#summary').classList.add('hidden'); course.go(); };
  if ($('#sumCreate')) $('#sumCreate').onclick = () => { goHome(); showTab('create'); };
  if ($('#missBtn')) $('#missBtn').onclick = () => startQuiz(missedTopics, { total: 8, kind: 'custom' });
  $('#homeBtn').onclick = () => goHome();
  quizDockNote();
}
$('.brand').onclick = () => { Tools.stop(); seqStop(); Snd.stop(); S.q = null; S.inLesson = null; goHome(); $('#main').scrollTop = 0; };
function goHome() { $('#summary').classList.add('hidden'); $('#play').classList.add('hidden'); renderSetup(); renderHome(); $('#setup').classList.remove('hidden'); showTab('quiz'); }

// ---- flow: what should happen next (shared by the home screen, session wrap-up and lessons) ----
// The loop is: daily practice -> read the next lesson -> practise it -> use it in Create.
const Flow = {
  read: id => store.get('learned', []).includes(id),
  // The next step on the course: the first topic whose lesson is unread or that hasn't been practised (lesson first, then its questions).
  course() {
    const first = TOPICS.find(t => !isOff(t.id) && (!Flow.read(t.id) || Coach.status(t.id) === 'new')), id = first && first.id, unread = null;
    if (id) {
      const t = TOPICS.find(x => x.id === id), n = TOPICS.indexOf(t) + 1;
      return Flow.read(id)
        ? { topic: id, kind: 'practise', icon: '▶', title: `Practise: ${t.name}`, sub: 'You read the lesson. 8 questions to make it stick.', go: () => startTopic(id) }
        : { topic: id, kind: 'lesson', icon: '→', title: `Lesson ${n}: ${t.name}`, sub: `${COURSE[id].mins} min read with examples, then practise it`, go: () => Learn.open(id) };
    }
    if (unread) return { kind: 'lesson', icon: '→', title: `Lesson ${TOPICS.indexOf(unread) + 1}: ${unread.name}`, sub: `${COURSE[unread.id].mins} min read with examples`, go: () => Learn.open(unread.id) };
    return null;
  },
  steps() {
    const P = Coach.buildPlan(10), done = Coach.today() >= Coach.goal(), names = ts => ts.map(topicName).join(', ');
    const bits = [P.news.length ? `New: ${names(P.news)}` : '', P.review.length ? `Review: ${names(P.review.slice(0, 3))}${P.review.length > 3 ? '…' : ''}` : ''].filter(Boolean);
    const out = [{ id: 'dailyBtn', icon: '▶', done, title: done ? 'Daily practice done. Bonus round?' : '5-minute practice', sub: bits.join(' · ') || '10 questions · retry freely · stop anytime', go: () => startDaily() }];
    const c = Flow.course(); if (c) out.push(Object.assign({ id: 'studyBtn' }, c));
    out.push({ id: 'makeBtn', icon: '♪', title: 'Make a loop', sub: 'Use it for real: build a progression and melody in Create', go: () => showTab('create') });
    return out;
  },
};

// ---- mistakes notebook: the last 40 questions missed on the first try ----
let MISSES = store.get('misses', []);
function noteMiss(q, answerText) {
  MISSES = MISSES.filter(m => m.p !== q.prompt); MISSES.unshift({ t: q.topic, p: q.prompt, a: answerText, d: Date.now() });
  MISSES = MISSES.slice(0, 40); store.set('misses', MISSES);
}

// ---- status pill in the top bar ----
function renderStatus() {
  const L = Coach.level(), t = Coach.today(), g = Coach.goal();
  $('#statusPill').innerHTML = `<span class="lv">${L.lv}</span><span><b>${L.into}</b>/${L.need} XP</span><span class="sep"></span><span>Today <b>${Math.min(t, g)}/${g}</b></span><span class="bar ${t >= g ? 'done' : ''}"><i style="width:${Math.min(100, t / g * 100)}%"></i></span>`;
}
$('#statusPill').onclick = () => $('.tab[data-tab=stats]').click();

// ---- settings (gear in the top bar) ----
$('#volSel').value = store.get('vol', 0.7);
$('#volSel').oninput = e => { const v = +e.target.value; store.set('vol', v); if (Snd.master) Snd.master.gain.value = v; };
$('#volSel').onchange = () => Snd.note(60);
function setGear(on) { $('#settingsPop').classList.toggle('hidden', !on); $('#gearBtn').setAttribute('aria-expanded', on ? 'true' : 'false'); }
$('#gearBtn').onclick = e => { e.stopPropagation(); setGear($('#settingsPop').classList.contains('hidden')); };
document.addEventListener('pointerdown', e => { if (!e.target.closest('#settingsPop, #gearBtn')) setGear(false); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#settingsPop').classList.contains('hidden')) { e.stopPropagation(); setGear(false); $('#gearBtn').focus(); } }, true);

// ---- home ----
function renderHome() {
  renderStatus();
  const P = Coach.buildPlan(10), L = Coach.level(), today = Coach.today(), goal = Coach.goal(), first = !Object.keys(STATS).length && !Coach.xp();
  $('#heroKicker').textContent = first ? 'Welcome' : 'Today';
  $('#heroTitle').textContent = first ? 'Start with a 5-minute session' : P.mode === 'review' ? 'Review day: let\'s lock in what you know' : today >= goal ? 'Goal done. Bonus round?' : 'Ready when you are';
  const steps = Flow.steps(), now = steps.find(s => !s.done);
  $('#heroSteps').innerHTML = steps.map((s, k) => `<button class="step ${s === now ? 'now' : ''} ${s.done ? 'done' : ''}" id="${s.id}"><span class="num">${s.done ? '✓' : k + 1}</span><span class="st"><span class="st-t">${s.title}</span><span class="st-s">${s.sub}</span></span><span class="go">${s === now ? 'Start →' : '→'}</span></button>`).join('');
  steps.forEach(s => $('#' + s.id).onclick = s.go);
  $('#lvlRing').style.setProperty('--p', Math.round(L.into / L.need * 100)); $('#lvlNum').textContent = L.lv;
  $('#lvlText').innerHTML = `${L.into}/${L.need} XP<br><span class="muted small">${Coach.xp()} total</span>`;
  $('#goalRing').style.setProperty('--p', Math.min(100, Math.round(today / goal * 100))); $('#goalRing').style.setProperty('--c', today >= goal ? 'var(--good)' : 'var(--accent2)');
  $('#goalNum').textContent = today >= goal ? '✓' : today;
  $('#goalText').innerHTML = `${Math.min(today, goal)}/${goal} answers<br><span class="muted small">${today >= goal ? 'goal reached!' : 'daily goal'}</span>`;
  $('#weekDots').innerHTML = Coach.week().map(d => `<span class="${d.n ? 'on' : ''} ${d.today ? 'today' : ''}" title="${d.key}: ${d.n} answers"><i></i>${d.label}</span>`).join('');
  const td = Coach.totalDays(); $('#daysTotal').textContent = td ? `${td} practice day${td > 1 ? 's' : ''} in total` : 'Your first day starts now';
  const next = (Flow.course() || {}).topic;
  const node = t => {
    const st = Coach.status(t.id), b = Coach.box(t.id), off = isOff(t.id), tag = off ? 'Off' : t.id === next ? 'Up next' : st === 'due' ? 'Review' : st === 'strong' ? '★' : '';
    return `<button class="pnode ${st} ${t.id === next ? 'next' : ''} ${off ? 'off' : ''}" data-t="${t.id}" title="${t.name}: ${off ? 'off' : st}. Right-click to turn ${off ? 'on' : 'off'}."><span class="pt"><span class="dot st-${st}"></span><span class="pn">${TOPICS.indexOf(t) + 1}</span>${t.name}<span class="tag">${tag}</span></span><span class="bars">${[1, 2, 3, 4, 5].map(k => `<b class="${b >= k ? 'f' : ''}"></b>`).join('')}</span></button>`;
  };
  // One group per Part; only the Parts you're working in are open, to keep the page calm.
  $('#path').innerHTML = [1, 2, 3, 4].map(p => {
    const ts = TOPICS.filter(t => t.part === p), started = ts.filter(t => Coach.status(t.id) !== 'new').length, due = ts.filter(t => Coach.status(t.id) === 'due' && !isOff(t.id)).length;
    const was = $(`#path .pgroup[data-p="${p}"]`), open = was ? was.open : ts.some(t => t.id === next) || due > 0;
    return `<details class="pgroup" data-p="${p}" ${open ? 'open' : ''}><summary><b>${PART_NAMES[p]}</b><span class="muted small">${started}/${ts.length} started${due ? ` · <span class="duetxt">${due} to review</span>` : ''}</span><span class="pmini">${ts.map(t => `<i class="st-${Coach.status(t.id)}"></i>`).join('')}</span></summary><div class="path">${ts.map(node).join('')}</div></details>`;
  }).join('');
  $$('#path .pnode').forEach(b => { b.onclick = () => startTopic(b.dataset.t); b.oncontextmenu = e => { e.preventDefault(); toggleOff(b.dataset.t); }; });
}

// ---- focus mode ----
function setFocus(on) { document.body.classList.toggle('focus', on); $('#focusBtn').setAttribute('aria-pressed', on ? 'true' : 'false'); store.set('focus', on); if (typeof layoutTools === 'function') layoutTools(); }
$('#focusBtn').onclick = () => setFocus(!document.body.classList.contains('focus'));

document.addEventListener('keydown', e => {
  if (TAB === 'quiz' && e.key === 'Enter' && !$('#summary').classList.contains('hidden') && $('#nextStepBtn') && e.target.tagName !== 'BUTTON') { e.preventDefault(); return $('#nextStepBtn').click(); }
  if (TAB !== 'quiz' || $('#play').classList.contains('hidden')) return;
  if (['SELECT', 'INPUT', 'TEXTAREA'].includes(e.target.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key.toLowerCase();
  if (k === 'f') return setFocus(!document.body.classList.contains('focus'));
  if (S.inLesson) { if (k === 'enter') { e.preventDefault(); lessonDone(); } return; }
  if (!S.q) return;
  if (/^[1-6]$/.test(k) && S.q.type === 'mc' && !S.answered) { const i = +k - 1, b = $$('#qOpts button')[i]; if (b && !b.disabled) answerMC(i); }
  else if (k === 'enter') { e.preventDefault(); if (S.answered) advance(); else if (S.q.type === 'piano') submitPiano(); else if (S.q.type === 'seq') submitSeq(); }
  else if (k === ' ' && S.q.type === 'seq') { e.preventDefault(); seqPlay(); }
  else if (k === 'r') Snd.play(S.q.audio);
  else if (k === 'h') hint();
  else if (k === 'l') toggleLessonPeek();
  else if (k === 'k') { if (TOOLS.roll) roll.keyFromQuestion(); else $('#dkFromQ').click(); }
});

// =====================================================================
//  PROGRESS
// =====================================================================
function renderStats() {
  const all = Object.values(STATS).reduce((a, s) => ({ c: a.c + s.c, t: a.t + s.t }), { c: 0, t: 0 });
  const tried = TOPICS.filter(t => acc(t.id) !== null), mastered = tried.filter(t => acc(t.id) >= 0.8 && STATS[t.id].t >= 10);
  const ranked = tried.slice().sort((a, b) => acc(a.id) - acc(b.id));
  const tiles = `<div class="stat-tiles">
    <div class="tile"><div class="k">Answered</div><div class="v">${all.t}</div></div>
    <div class="tile"><div class="k">Accuracy</div><div class="v">${all.t ? Math.round(all.c / all.t * 100) + '%' : '–'}</div></div>
    <div class="tile"><div class="k">Topics tried</div><div class="v">${tried.length}/${TOPICS.length}</div></div>
    <div class="tile"><div class="k">Mastered <span title="80%+ over at least 10 questions">ⓘ</span></div><div class="v">${mastered.length}</div></div>
    <div class="tile"><div class="k">Weakest</div><div class="v sm">${ranked.length ? ranked[0].name : '–'}</div></div></div>`;
  const parts = [1, 2, 3, 4].map(p => `<div class="panel"><div class="panel-title">${PART_NAMES[p]}</div>${TOPICS.filter(t => t.part === p).map(t => {
    const s = STATS[t.id];
    const d = Coach.dueIn(t.id), strong = Coach.box(t.id) >= 4;
    const rv = d === null ? '' : d <= 0 ? '<small class="rv due">review due</small>' : `<small class="rv">${strong ? '★ strong · ' : ''}next review in ${d} day${d > 1 ? 's' : ''}</small>`;
    return s ? `<div class="srow"><span>${t.name}${rv}</span><span class="n">${s.c}/${s.t}</span><span class="n">${Math.round(s.c / s.t * 100)}%</span>${meter(s.c / s.t)}</div>`
      : `<div class="srow"><span>${t.name}</span><span class="n">–</span><span class="n"></span><span class="muted small">not tried</span></div>`;
  }).join('')}</div>`).join('');
  const heat = `<div class="panel"><div class="panel-title">Last 5 weeks</div><div class="heat">${Coach.history(35).map(d => `<i class="h${d.n === 0 ? 0 : d.n < 10 ? 1 : d.n < 25 ? 2 : 3}" title="${d.key}: ${d.n} answers"></i>`).join('')}</div><div class="muted small">${Coach.totalDays()} practice day${Coach.totalDays() === 1 ? '' : 's'}.<br>No streak to break.</div></div>`;
  const mt = [...new Set(MISSES.map(m => m.t))].filter(t => TOPICS.some(x => x.id === t));
  const misses = MISSES.length ? `<details class="panel misses" open><summary><span class="panel-title">Recent mistakes</span><span class="muted small">${MISSES.length} question${MISSES.length > 1 ? 's' : ''} · ${mt.length} topic${mt.length > 1 ? 's' : ''}</span><span class="grow"></span><button class="sm primary" id="missDrill">Practise these topics</button><button class="sm ghost" id="missClear">Clear</button></summary>
    <ul class="missed">${MISSES.slice(0, 12).map(m => `<li><span class="chip">${topicName(m.t)}</span> ${m.p}<div class="a">→ ${m.a}</div></li>`).join('')}</ul></details>` : '';
  $('#statsBody').innerHTML = `<div class="stats-top">${tiles}${heat}</div>${misses}<div class="stats-parts">${parts}</div>`;
  if ($('#missDrill')) {
    $('#missDrill').onclick = e => { e.preventDefault(); showTab('quiz'); startQuiz(mt.slice(0, 6), { total: 10, kind: 'custom' }); };
    $('#missClear').onclick = e => { e.preventDefault(); MISSES = []; store.set('misses', MISSES); renderStats(); };
  }
}
$('#resetStats').onclick = () => { if (confirm('Reset all progress?')) { STATS = {}; store.set('stats', STATS); MISSES = []; store.set('misses', MISSES); Coach.reset(); Learn.reset(); renderStats(); renderSetup(); renderHome(); } };
$('#practiseWeak').onclick = () => startQuiz(weakest(5));
// Backup / restore: progress lives in this browser only, so this moves it between devices or addresses.
$('#exportProg').onclick = () => {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith('theorylab.')) data[k] = localStorage.getItem(k); }
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: 'application/json' }));
  a.download = `theory-lab-progress-${new Date().toISOString().slice(0, 10)}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
};
$('#importProg').onclick = () => $('#importFile').click();
$('#importFile').onchange = async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try {
    const data = JSON.parse(await f.text()), keys = Object.keys(data).filter(k => k.startsWith('theorylab.') && typeof data[k] === 'string');
    if (!keys.length) throw new Error('empty');
    if (!confirm("Replace this browser's progress with the backup?")) return;
    keys.forEach(k => localStorage.setItem(k, data[k])); location.reload();
  } catch (err) { alert('That file is not a Theory Lab backup.'); }
};

// =====================================================================
//  EXPLORER
// =====================================================================
const exPiano = new Piano($('#explorePiano'));
const EX = { root: 'C', spell: 'sharp', view: 'key', keyType: 'major', sevenths: false, scale: 'major', chord: 'maj', inv: 0, active: null, last: null };
const KEY_TYPES = ['major', 'minor', 'harmonicMinor', 'melodicMinor', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'locrian'];
const DEG = { P1: '1', m2: '♭2', M2: '2', A2: '♯2', m3: '♭3', M3: '3', P4: '4', A4: '♯4', d5: '♭5', P5: '5', A5: '♯5', m6: '♭6', M6: '6', d7: '𝄫7', m7: '♭7', M7: '7', M9: '9', P11: '11', M13: '13' };
const FUNC = [['T', 'Tonic', 'var(--fT)'], ['S', 'Subdominant', 'var(--fS)'], ['T', 'Tonic', 'var(--fT)'], ['S', 'Subdominant', 'var(--fS)'], ['D', 'Dominant', 'var(--fD)'], ['T', 'Tonic', 'var(--fT)'], ['D', 'Dominant', 'var(--fD)']];
const fillSel = (sel, items) => { sel.innerHTML = items.map(([v, t]) => `<option value="${v}">${t}</option>`).join(''); };
fillSel($('#exKeyType'), KEY_TYPES.map(k => [k, SCALES[k].name]));
fillSel($('#exScale'), Object.entries(SCALES).map(([k, s]) => [k, s.name]));
fillSel($('#exChord'), Object.entries(CHORDS).map(([k, c]) => [k, `${c.sym || 'maj'}: ${c.name}`]));
function fillInv() { const n = CHORDS[EX.chord].iv.length; fillSel($('#exInv'), range(0, n - 1).map(i => [i, INV_NAMES[i] || `${i}th inversion`])); if (EX.inv >= n) EX.inv = 0; $('#exInv').value = EX.inv; }
fillInv();

function renderRoots() {
  const names = EX.spell === 'flat' ? FLAT_NAMES : SHARP_NAMES;
  $('#exRoots').innerHTML = names.map((n, p) => `<button data-r="${n}" class="${isBlackPc(p) ? 'blk' : ''} ${pc(EX.root) === p ? 'active' : ''}">${disp(n)}</button>`).join('');
  $$('#exRoots button').forEach(b => b.onclick = () => { EX.root = b.dataset.r; EX.active = null; renderEx(); });
  $$('#exSpell button').forEach(b => b.classList.toggle('active', b.dataset.s === EX.spell));
}
$$('#exSpell button').forEach(b => b.onclick = () => {
  EX.spell = b.dataset.s; const p = pc(EX.root);
  if (isBlackPc(p)) EX.root = (EX.spell === 'flat' ? FLAT_NAMES : SHARP_NAMES)[p];
  renderEx();
});
$('#exKeyType').onchange = e => { EX.keyType = e.target.value; EX.active = null; renderEx(); };
$('#exSevenths').onchange = e => { EX.sevenths = e.target.checked; EX.active = null; renderEx(); };
$('#exScale').onchange = e => { EX.scale = e.target.value; renderEx(); };
$('#exChord').onchange = e => { EX.chord = e.target.value; fillInv(); renderEx(); };
$('#exInv').onchange = e => { EX.inv = +e.target.value; renderEx(); };
$$('#exView button').forEach(b => b.onclick = () => { EX.view = b.dataset.v; EX.active = null; renderEx(); });
$('#exPlay').onclick = () => { if (EX.last) Snd.play(EX.view === 'chord' || EX.active !== null ? EV.chord(EX.last) : EV.arp(EX.last, 0, 0.22, 0.4)); };
$('#exArp').onclick = () => { if (EX.last) Snd.play(EV.arp(EX.last, 0, 0.22, 0.45)); };

const chips = (names, subs) => `<div class="notes">${names.map((n, i) => `<div class="note">${disp(n)}<small>${subs[i]}</small></div>`).join('')}</div>`;

function renderEx() {
  $$('#exView button').forEach(b => b.classList.toggle('active', b.dataset.v === EX.view));
  $('#exKeyCtl').classList.toggle('hidden', EX.view !== 'key');
  $('#exScaleCtl').classList.toggle('hidden', EX.view !== 'scale');
  $('#exChordCtl').classList.toggle('hidden', EX.view !== 'chord');
  $('#exKeyType').value = EX.keyType; $('#exScale').value = EX.scale; $('#exChord').value = EX.chord; $('#exSevenths').checked = EX.sevenths;
  renderRoots();
  exPiano.clear(); $('#exDiatonic').innerHTML = '';
  const R0 = EX.root;
  if (EX.view === 'chord') {
    const ivs = CHORDS[EX.chord].iv, n = chordNotes(R0, EX.chord), subs = ivs.map(i => i === 'P1' ? 'R' : DEG[i] || i);
    const rot = n.slice(EX.inv).concat(n.slice(0, EX.inv)), rsub = subs.slice(EX.inv).concat(subs.slice(0, EX.inv)), v = voice(rot);
    v.forEach((x, i) => x.sub = rsub[i]);
    exPiano.mark(v, 'ans'); exPiano.mark([v[rot.indexOf(R0)]], 'root'); EX.last = mids(v);
    $('#exInfo').innerHTML = `<div class="ex-title">${chordSym(R0, EX.chord)}${EX.inv ? '/' + disp(rot[0]) : ''}<small>${CHORDS[EX.chord].name}</small></div>${chips(n, subs)}
      <div class="facts"><span>Semitones from root: <b>${ivs.map(i => IV[i][0]).join(' · ')}</b></span>${EX.inv ? `<span>${INV_NAMES[EX.inv] || ''}: <b>${disp(rot[0])}</b> in the bass</span>` : ''}</div>`;
  } else {
    const id = EX.view === 'key' ? EX.keyType : EX.scale, n = scaleNotes(R0, id), subs = SCALES[id].iv.map(i => DEG[i]);
    const v = voice(n.concat([R0])); v.forEach((x, i) => x.sub = i < subs.length ? subs[i] : '1');
    exPiano.mark(v, 'ans'); exPiano.mark([v[0], v[v.length - 1]], 'root'); EX.last = mids(v);
    const facts = [`<span>Steps: <b>${stepPattern(id)}</b></span>`];
    if (id === 'major') facts.push(`<span>Key signature: <b>${keySig(R0)}</b> · relative minor: <b>${disp(tr(R0, 'M6'))} minor</b> · Camelot <b>${camOf(R0, 'B')}</b></span>`);
    if (id === 'minor') facts.push(`<span>Key signature: <b>${keySig(tr(R0, 'm3'))}</b> · relative major: <b>${disp(tr(R0, 'm3'))} major</b> · Camelot <b>${camOf(R0, 'A')}</b></span>`);
    if (MODES.includes(id) && id !== 'major' && id !== 'minor') facts.push(`<span>${MODE_NAMES[id]} = ${MODE_DESC[id]} · same notes as <b>${disp(tr(R0, INV_PAIR[MODE_OFFSET[id]]))} major</b></span>`);
    $('#exInfo').innerHTML = `<div class="ex-title">${disp(R0)} ${SCALES[id].name}</div>${chips(n, subs)}<div class="facts">${facts.join('')}</div>`;
    if (EX.view === 'key' && n.length === 7) renderDiatonic(R0, id);
  }
  renderCircle();
}
function camOf(root, l) { const c = camKeys.find(x => x.l === l && pc(x.k) === pc(root)); return c ? camCode(c) : '–'; }

function renderDiatonic(R0, id) {
  const d = diatonic(R0, id, EX.sevenths);
  $('#exDiatonic').innerHTML = `<div class="dhead"><b>Diatonic chords</b><span class="flegend"><span><i style="background:var(--fT)"></i>Tonic (home)</span><span><i style="background:var(--fS)"></i>Subdominant (away)</span><span><i style="background:var(--fD)"></i>Dominant (tension)</span></span></div>
    <div class="dchords">${d.map((c, i) => `<button data-i="${i}" style="--fc:${FUNC[i][2]}" title="${FUNC[i][1]} function" class="${EX.active === i ? 'active' : ''}"><b>${c.roman}</b><span>${chordSym(c.root, c.type)}</span></button>`).join('')}</div>`;
  const show = i => {
    const c = d[i], iv = CHORDS[c.type].iv, v = voice(c.notes); v.forEach((x, k) => x.sub = k === 0 ? 'R' : DEG[iv[k]]);
    exPiano.clear(); exPiano.mark(v, 'ans'); exPiano.mark([v[0]], 'root'); EX.last = mids(v);
  };
  $$('#exDiatonic button').forEach(b => b.onclick = () => {
    EX.active = +b.dataset.i; $$('#exDiatonic button').forEach(x => x.classList.toggle('active', x === b));
    show(EX.active); Snd.play(EV.chord(EX.last));
  });
  if (EX.active !== null) show(EX.active);
}

// ---- circle of fifths ----
const COF_MAJ = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];
const COF_MIN = ['A', 'E', 'B', 'F#', 'C#', 'G#', 'Eb', 'Bb', 'F', 'C', 'G', 'D'];
const COF_SIG = ['', '1♯', '2♯', '3♯', '4♯', '5♯', '6♯/6♭', '5♭', '4♭', '3♭', '2♭', '1♭'];
const COF_MAJ_LBL = ['C', 'G', 'D', 'A', 'E', 'B', 'F♯/G♭', 'D♭', 'A♭', 'E♭', 'B♭', 'F'];
const COF_MIN_LBL = ['Am', 'Em', 'Bm', 'F♯m', 'C♯m', 'G♯m', 'E♭m', 'B♭m', 'Fm', 'Cm', 'Gm', 'Dm'];
function arcPath(r1, r2, a0, a1) {
  const p = (r, a) => [160 + r * Math.cos(a), 160 + r * Math.sin(a)].map(x => x.toFixed(2)).join(' ');
  return `M ${p(r2, a0)} A ${r2} ${r2} 0 0 1 ${p(r2, a1)} L ${p(r1, a1)} A ${r1} ${r1} 0 0 0 ${p(r1, a0)} Z`;
}
// Draws an interactive circle of fifths into `container`. onPick(root, 'major'|'minor') fires on click.
function drawCircle(container, root, type, onPick) {
  const onMaj = type === 'major' ? COF_MAJ.findIndex(k => pc(k) === pc(root)) : -1;
  const onMin = type === 'minor' ? COF_MIN.findIndex(k => pc(k) === pc(root)) : -1;
  const on = onMaj >= 0 ? onMaj : onMin, near = i => on >= 0 && [(on + 1) % 12, (on + 11) % 12].includes(i);
  let s = '<svg viewBox="0 0 320 320" class="cof" role="img" aria-label="Circle of fifths">';
  for (let i = 0; i < 12; i++) {
    const a0 = (i * 30 - 105) * Math.PI / 180, a1 = (i * 30 - 75) * Math.PI / 180, am = (i * 30 - 90) * Math.PI / 180;
    const rel = i === on; // relative major/minor share a slice
    s += `<path class="maj ${i === onMaj ? 'on' : (near(i) && onMaj >= 0) || (rel && onMin >= 0) ? 'near' : ''}" d="${arcPath(100, 155, a0, a1)}" data-maj="${i}"><title>${COF_MAJ_LBL[i]} major</title></path>`;
    s += `<path class="min ${i === onMin ? 'on' : (near(i) && onMin >= 0) || (rel && onMaj >= 0) ? 'near' : ''}" d="${arcPath(58, 98, a0, a1)}" data-min="${i}"><title>${COF_MIN_LBL[i]}</title></path>`;
    s += `<text x="${160 + 133 * Math.cos(am)}" y="${160 + 133 * Math.sin(am)}">${COF_MAJ_LBL[i]}</text>`;
    s += `<text class="sig" x="${160 + 111 * Math.cos(am)}" y="${160 + 111 * Math.sin(am)}">${COF_SIG[i]}</text>`;
    s += `<text class="mi" x="${160 + 78 * Math.cos(am)}" y="${160 + 78 * Math.sin(am)}">${COF_MIN_LBL[i]}</text>`;
  }
  const info = onMaj >= 0 ? `${COF_MAJ_LBL[onMaj]} major` : onMin >= 0 ? COF_MIN_LBL[onMin] : 'Pick a key';
  const sub = on >= 0 ? keySig(COF_MAJ[on]) : 'major / minor';
  s += `<text class="ctr" x="160" y="152">${info}</text><text class="ctr2" x="160" y="170">${sub}</text></svg>`;
  container.innerHTML = s;
  container.querySelectorAll('path').forEach(p => p.onclick = () => {
    if (p.dataset.maj !== undefined) onPick(COF_MAJ[+p.dataset.maj], 'major'); else onPick(COF_MIN[+p.dataset.min], 'minor');
  });
}
function renderCircle() {
  drawCircle($('#circle'), EX.root, EX.view === 'key' ? EX.keyType : null, (root, type) => {
    EX.view = 'key'; EX.active = null; EX.root = root; EX.keyType = type;
    renderEx(); Snd.play(EV.chord(mids(voice(chordNotes(root, type === 'major' ? 'maj' : 'min'))), 0, 1.2));
  });
}
renderEx();

// ---- tempo calculator ----
function renderBpm() {
  const bpm = +$('#bpmIn').value; if (!(bpm >= 20 && bpm <= 400)) return;
  const q = 60000 / bpm;
  $('#bpmOut').innerHTML = SUBDIV.map(([n, b]) => `<div class="tile"><div class="k">${n}</div><div class="v">${(q * b).toFixed(1)}<span class="muted small"> ms</span></div><div class="hz">${(1000 / (q * b)).toFixed(2)} Hz</div></div>`).join('');
  $('#bpmExtra').innerHTML = [8, 16, 32].map(b => `${b} bars = <b>${(b * 4 * q / 1000).toFixed(1)} s</b>`).join(' · ') + `<br>Half-time feel ${r1(bpm / 2)} BPM · double-time ${bpm * 2} BPM`;
}
$('#bpmIn').oninput = renderBpm; renderBpm();

// =====================================================================
//  LEARNING TOOLS (available during practice)
// =====================================================================
const dockPiano = () => TAB === 'quiz' ? quizPiano : exPiano;
function flashKeys(ms, dur = 700) {
  ms.forEach(m => { const k = dockPiano().keys[m]; if (k) { k.el.classList.add('active'); setTimeout(() => k.el.classList.remove('active'), dur); } });
}

// ---- piano roll ----
// Name a set of MIDI notes sounding together: a note, an interval, or a chord (with its inversion). Spelled in the selected key when there is one.
function nameNotes(ms) {
  ms = [...new Set(ms)].sort((x, y) => x - y); if (!ms.length) return null;
  const K = keyInfo(), nm = p => disp(K && K.byPc[p % 12] ? K.byPc[p % 12].name : DEFAULT_NAMES[p % 12]), pcs = new Set(ms.map(m => m % 12)), bass = ms[0] % 12;
  const spelled = [...new Set(ms.map(m => nm(m)))].join(' – ');
  if (pcs.size === 1) return { name: nm(bass) + (ms.length > 1 ? ' in octaves' : ''), detail: ms.length > 1 ? '' : 'single note' };
  if (pcs.size === 2) {
    const top = ms.find(m => m % 12 !== bass), d = ms.length === 2 ? ms[1] - ms[0] : top - ms[0], s = d > 12 ? d % 12 || 12 : d, it = INTS.find(x => x.s === s);
    return { name: it.name.replace(/ \(.*\)/, '') + (d > 12 ? ' + octave' : ''), detail: `${nm(bass)} up to ${nm(top)} · ${d} semitone${d > 1 ? 's' : ''}` };
  }
  const all = findChords(pcs), c = all.find(x => x.r === bass) || all[0];
  if (!c) return { name: 'No common name', detail: spelled };
  const tones = CHORDS[c.id].iv.map(i => (c.r + IV[i][0]) % 12), inv = tones.indexOf(bass);
  return { name: nm(c.r) + CHORDS[c.id].sym + (inv > 0 ? '/' + nm(bass) : ''), detail: `${nm(c.r)} ${c.full.replace(/ \(.*\)/, '')}${inv > 0 ? ` · ${ORD[inv - 1]} inversion` : ''} · ${spelled}` };
}
class PianoRoll {
  constructor(el) {
    this.el = el; this.cols = 32; this.notes = []; this.len = 4; this.timer = null; this.step = 0; this.cells = {};
    this.follow = store.get('rollFollow', true); this.sroot = 'C'; this.stype = 'off';
    const stypes = ['off', ...Object.keys(SCALES)];
    el.innerHTML = `<div class="pr-ctl">
        <button data-a="play" class="primary">▶ Play</button>
        <button data-a="clear">Clear</button>
        <button data-a="load" title="Put the current question's notes into the grid">⤓ Load question</button>
        <label title="Automatically load each question's notes (and the answer once you've answered)"><input type="checkbox" data-a="follow" ${this.follow ? 'checked' : ''}> Follow quiz</label>
        <label>Note <select data-a="len"><option value="1">1/16</option><option value="2">1/8</option><option value="4" selected>1/4</option><option value="8">1/2</option><option value="16">1 bar</option></select></label>
        <label>BPM <input type="number" data-a="bpm" value="120" min="40" max="240"></label>
        <label title="Highlight the notes of a key or scale, like Ableton's Scale mode">Key <select data-a="sroot">${ROLL_ROOTS.map(r => `<option value="${r}">${disp(r)}</option>`).join('')}</select><select data-a="stype">${stypes.map(s => `<option value="${s}">${s === 'off' ? 'off' : SCALES[s].name}</option>`).join('')}</select></label>
        <button data-a="qkey" class="qkey" title="Set the scale to the current question's key (K)">Question key <kbd>K</kbd></button>
      </div>
      <div class="pr-info"><div class="pr-name" aria-live="polite"></div><div class="pr-keyinfo"></div></div>
      <div class="pr-scroll"><div class="pr-grid"></div></div>
      <div class="pr-hint"></div>`;
    const grid = el.querySelector('.pr-grid'); let html = '';
    for (let m = HI; m >= LO; m--) {
      const p = m % 12, blk = isBlackPc(p);
      html += `<div class="pr-key ${blk ? 'b' : 'w'} ${p === 0 ? 'c' : ''}" data-m="${m}">${p === 0 ? 'C' + (Math.floor(m / 12) - 1) : disp(DEFAULT_NAMES[p])}</div>`;
      for (let c = 0; c < this.cols; c++) html += `<div class="pr-cell ${blk ? 'bk' : ''} ${c % 16 === 0 ? 'bar' : c % 4 === 0 ? 'beat' : ''}" data-m="${m}" data-c="${c}"></div>`;
    }
    grid.innerHTML = html + '<div class="pr-head hidden"></div>';
    grid.querySelectorAll('.pr-cell').forEach(d => { (this.cells[d.dataset.m] = this.cells[d.dataset.m] || [])[+d.dataset.c] = d; });
    this.keyEls = {}; this.keyText = {}; grid.querySelectorAll('.pr-key').forEach(k => { this.keyEls[k.dataset.m] = k; this.keyText[k.dataset.m] = k.textContent; });
    this.keyTitle = el.querySelector('.pr-keyinfo'); this.nameEl = el.querySelector('.pr-name'); this.focusC = 0;
    this.head = grid.querySelector('.pr-head'); this.scroller = el.querySelector('.pr-scroll'); this.hintEl = el.querySelector('.pr-hint'); this.hintText = this.hintEl.innerHTML;
    grid.addEventListener('pointerdown', e => {
      const t = e.target; if (t.classList.contains('pr-key')) return Snd.note(+t.dataset.m);
      if (t.classList.contains('pr-cell')) { e.preventDefault(); this.toggle(+t.dataset.m, +t.dataset.c); }
    });
    const ctl = a => el.querySelector(`[data-a="${a}"]`);
    ctl('play').onclick = () => this.timer ? this.stop() : this.play();
    ctl('clear').onclick = () => { this.notes = []; this.render(); };
    ctl('load').onclick = () => S.q && this.load(S.q, S.answered, true);
    ctl('follow').onchange = e => { this.follow = e.target.checked; store.set('rollFollow', this.follow); };
    ctl('len').onchange = e => this.len = +e.target.value;
    ctl('bpm').onchange = () => { if (this.timer) { this.stop(); this.play(); } };
    ctl('sroot').onchange = e => setKey(e.target.value, this.stype === 'off' ? 'major' : this.stype);
    ctl('stype').onchange = e => setKey(this.sroot, e.target.value);
    ctl('qkey').onclick = () => this.keyFromQuestion();
    this.bpmEl = ctl('bpm'); this.playBtn = ctl('play'); this.applyScale();
  }
  msg(t) { this.hintEl.innerHTML = t; clearTimeout(this.mt); this.mt = setTimeout(() => this.hintEl.innerHTML = this.hintText, 3500); }
  toggle(m, c) {
    const i = this.notes.findIndex(n => n.m === m && c >= n.c && c < n.c + n.len);
    if (i >= 0) this.notes.splice(i, 1);
    else { this.notes.push({ m, c, len: Math.min(this.len, this.cols - c) }); Snd.note(m); }
    this.focusC = c; this.render();
  }
  render() {
    Object.values(this.cells).forEach(row => row.forEach(d => d.classList.remove('on', 'cont', 'ghost')));
    for (const n of this.notes) for (let k = 0; k < n.len; k++) {
      const d = this.cells[n.m] && this.cells[n.m][n.c + k]; if (!d) continue;
      d.classList.add('on'); if (k) d.classList.add('cont'); if (n.ghost) d.classList.add('ghost');
    }
    this.showName();
  }
  // What the notes spell: one name per group of notes that start together, the one under the last click (or the playhead) in full.
  // Hidden while an unanswered question's own notes are in the grid, so it never gives the answer away.
  showName() {
    if (!this.nameEl) return;
    const spoiler = S.q && !S.answered && TAB === 'quiz' && !$('#play').classList.contains('hidden') && this.notes.some(n => n.ghost);
    const at = c => this.notes.filter(n => c >= n.c && c < n.c + n.len).map(n => n.m);
    const onsets = spoiler ? [] : [...new Set(this.notes.map(n => n.c))].sort((x, y) => x - y);
    const here = this.timer ? (this.step + this.cols - 1) % this.cols : this.focusC;
    let cur = onsets.filter(c => c <= here).pop(); if (cur === undefined) cur = onsets[0];
    const key = onsets.join() + '|' + cur + '|' + this.notes.length + '|' + this.notes.reduce((s, n) => s + n.m * (n.c + 1) + n.len, 0) + '|' + KEYSEL.root + KEYSEL.type;
    if (key === this.nameKey) return; this.nameKey = key;
    const i = onsets.indexOf(cur), from = Math.max(0, Math.min(i - 3, onsets.length - 8)), shown = onsets.slice(from, from + 8);
    this.nameEl.innerHTML = (from ? '<span class="pr-more">…</span>' : '') + shown.map(c => { const n = nameNotes(at(c)); return n ? `<span class="pr-ch ${c === cur ? 'on' : ''}"><b>${n.name}</b>${c === cur && n.detail ? `<small>${n.detail}</small>` : ''}</span>` : ''; }).join('<span class="pr-more">→</span>') + (from + 8 < onsets.length ? '<span class="pr-more">…</span>' : '');
  }
  applyScale() {
    const on = this.stype !== 'off', notes = on ? scaleNotes(this.sroot, this.stype) : [], pcs = new Set(notes.map(pc)), r = pc(this.sroot);
    const deg = on ? Object.fromEntries(notes.map((n, i) => [pc(n), DEG[SCALES[this.stype].iv[i]] || i + 1])) : {};
    this.el.querySelector('.pr-grid').classList.toggle('scaled', on);
    for (const [m, row] of Object.entries(this.cells)) {
      const p = +m % 12, ins = pcs.has(p), root = on && p === r;
      row.forEach(d => { d.classList.toggle('inscale', ins); d.classList.toggle('sroot', root); });
      const k = this.keyEls[m]; k.classList.toggle('inscale', ins); k.classList.toggle('sroot', root);
      k.textContent = ins && p !== 0 ? disp(notes.find(n => pc(n) === p)) : this.keyText[m]; if (ins) k.dataset.deg = deg[p]; else delete k.dataset.deg;
    }
    this.keyTitle.textContent = on ? `${disp(this.sroot)} ${SCALES[this.stype].name}: ${notes.map(disp).join(' ')}` : 'No key selected: pick one to highlight its notes';
  }
  keyFromQuestion() {
    const r = applyQuestionKey(); if (!r.ok) return this.msg(r.msg);
    const row = this.cells[Object.keys(this.cells).map(Number).filter(m => m % 12 === pc(this.sroot) && m >= 60).sort((x, y) => x - y)[0]];
    if (row) this.scroller.scrollTo({ top: Math.max(0, row[0].offsetTop - 120), behavior: 'smooth' });
  }
  setScale(root, type) {
    this.sroot = ROLL_ROOTS.includes(root) ? root : DEFAULT_NAMES[pc(root)]; this.stype = type;
    this.el.querySelector('[data-a="sroot"]').value = this.sroot; this.el.querySelector('[data-a="stype"]').value = type; this.applyScale(); this.showName();
  }
  load(q, answered, manual) {
    let evs = null;
    if (/^ear/.test(q.topic) && !answered) { this.notes = []; this.render(); if (manual) this.msg('Ear-training question: answer first (loading the notes would give it away).'); return; }
    if (q.audio) evs = q.audio;
    else { const src = answered ? (q.reveal || q.show) : q.show; if (src && src.length) evs = [{ t: 0, notes: mids(src), d: 1 }]; }
    this.notes = [];
    if (evs) for (const e of evs) {
      const c = Math.round(e.t * 8); if (c >= this.cols) continue;
      const len = Math.max(1, Math.min(this.cols - c, Math.round(e.d * 8)));
      e.notes.filter(m => m >= LO && m <= HI).forEach(m => { if (!this.notes.some(n => n.m === m && n.c === c)) this.notes.push({ m, c, len, ghost: true }); });
    }
    this.focusC = 0; this.render();
    if (!this.notes.length) { if (manual) this.msg('Nothing to show for this question yet. Answer it first, or draw your own notes.'); return; }
    this.bpmEl.value = 120;
    const top = Math.max(...this.notes.map(n => n.m)), row = this.cells[top][0];
    this.scroller.scrollTo({ top: Math.max(0, row.offsetTop - 40), behavior: 'smooth' });
  }
  play() {
    Snd.ensure(); this.step = 0; const stepMs = 60000 / (+this.bpmEl.value || 120) / 4;
    this.head.classList.remove('hidden'); this.playBtn.textContent = '■ Stop';
    const tick = () => {
      this.notes.filter(n => n.c === this.step).forEach(n => Snd.tone(n.m, 0, n.len * stepMs / 1000 * 0.92, 0.16));
      this.head.style.left = `calc(46px + (100% - 46px) * ${this.step / this.cols})`; this.head.style.width = `calc((100% - 46px) / ${this.cols})`;
      this.step = (this.step + 1) % this.cols; this.showName();
    };
    tick(); this.timer = setInterval(tick, stepMs);
  }
  stop() { clearInterval(this.timer); this.timer = null; this.head.classList.add('hidden'); this.playBtn.textContent = '▶ Play'; this.showName(); }
}

// ---- key of a question (for the "Question key" buttons) ----
// 1) a key named in the prompt ("in E♭ major", "key is C minor", "D Dorian"), preferring phrases that set a key;
// 2) once answered, a key named in the correct option; 3) otherwise the scale that best fits the question's notes.
// Ear-training notes are never used before you answer, so the button can't give the answer away.
const KEY_WORDS = [['natural minor', 'minor'], ['harmonic minor', 'harmonicMinor'], ['melodic minor', 'melodicMinor'], ['major pentatonic', 'majorPent'], ['minor pentatonic', 'minorPent'],
  ['phrygian dominant', 'phrygianDominant'], ['hungarian minor', 'hungarianMinor'], ['double harmonic', 'doubleHarmonic'], ['whole tone', 'wholeTone'], ['whole-tone', 'wholeTone'],
  ['blues scale', 'blues'], ['blues', 'blues'], ['hirajoshi', 'hirajoshi'], ['dorian', 'dorian'], ['phrygian', 'phrygian'], ['lydian', 'lydian'], ['mixolydian', 'mixolydian'],
  ['locrian', 'locrian'], ['ionian', 'major'], ['aeolian', 'minor'], ['major', 'major'], ['minor', 'minor']];
const KEY_RE = new RegExp(`(^|[^A-Za-z])([A-G])([♯♭#b]?)\\s+(${KEY_WORDS.map(([w]) => w.replace(/(^|[\s-])([a-z])/g, (m, s, c) => `${s}[${c.toUpperCase()}${c}]`)).join('|')})(?![A-Za-z])(?!\\s+\\d)`, 'g');
const plain = h => String(h || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&');
function keysInText(text) {
  const out = [], t = plain(text); let m; KEY_RE.lastIndex = 0;
  while ((m = KEY_RE.exec(t))) {
    const word = m[4].toLowerCase(), type = KEY_WORDS.find(([w]) => w === word)[1];
    const before = t.slice(0, m.index + m[1].length), root = m[2] + m[3].replace('♯', '#').replace('♭', 'b');
    out.push({ root, type, strong: /(\bin(\s+the\s+key\s+of)?|\bkey\s+(of|is)|\binto|\()\)?\s*$/i.test(before) || !['major', 'minor'].includes(type) });
  }
  return out;
}
function fitKey(evs) {
  const all = evs.flatMap(e => e.notes), pcs = new Set(all.map(m => m % 12)); if (pcs.size < 2) return null;
  const bass = Math.min(...all) % 12, first = Math.min(...evs[0].notes) % 12, isScale = pcs.size >= 5;
  if (pcs.size <= 4) { // a chord: use its root
    const c = findChords(pcs)[0];
    if (c) { const type = CHORDS[c.id].iv.includes('m3') ? 'minor' : 'major'; if ([...pcs].every(p => scaleSemis(type).includes((p - c.r + 12) % 12))) return { root: DEFAULT_NAMES[c.r], type }; }
  }
  const ORDERED = ['major', 'minor', 'harmonicMinor', 'melodicMinor', 'dorian', 'mixolydian', 'phrygian', 'lydian', 'locrian', 'majorPent', 'minorPent', 'blues', ...Object.keys(SCALES)].filter((x, i, a) => a.indexOf(x) === i).slice(0, isScale ? 99 : 3); // a chord or interval: stick to major / minor keys
  let best = null;
  for (let r = 0; r < 12; r++) ORDERED.forEach((type, ti) => {
    const set = scaleSemis(type).map(s => (s + r) % 12); if (![...pcs].every(p => set.includes(p))) return;
    const score = (set.length === pcs.size ? 1000 : 0) - set.length * 20 + (isScale && r === first ? 300 : 0) - ti * 10 + (pcs.has(r) ? 40 : 0) + (r === bass ? 25 : 0) + (r === first ? 10 : 0);
    if (!best || score > best.score) best = { root: DEFAULT_NAMES[r], type, score };
  });
  return best && { root: best.root, type: best.type };
}
const ROLL_ROOTS = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];
function questionKey(q, answered) {
  const ks = keysInText(q.prompt), strong = ks.find(k => k.strong);
  if (strong) return Object.assign(strong, { src: 'question' });
  if (answered && q.type === 'mc' && q.options) { const a = keysInText(q.options[q.answer])[0]; if (a) return Object.assign(a, { src: 'answer' }); }
  if (ks.length) return Object.assign(ks[0], { src: 'question' });
  if (/^ear/.test(q.topic) && !answered) return { ear: true };
  let evs = q.audio ? q.audio.slice() : [];
  const add = src => { if (src && src.length) evs.push({ t: 0, notes: mids(src), d: 1 }); };
  add(q.show); if (answered) add(q.reveal);
  evs = evs.filter(e => e.notes && e.notes.length);
  const k = evs.length && fitKey(evs);
  if (k) { const named = [...(q.show || []), ...(answered && q.reveal ? q.reveal : [])].map(n => typeof n === 'string' ? n : n.label).concat((plain(q.prompt).match(/[A-G][♯♭]?(?![a-z])/g) || []).map(n => n.replace('♯', '#').replace('♭', 'b'))).find(n => n && pc(n) === pc(k.root)); if (named) k.root = named.replace(/\d+$/, ''); }
  return k ? Object.assign(k, { src: 'notes' }) : null;
}

function applyQuestionKey() {
  if (!S.q || $('#play').classList.contains('hidden')) return { msg: 'Start a question first.' };
  const k = questionKey(S.q, S.answered);
  if (k && k.ear) return { msg: 'Ear-training question: answer first (the key would give it away).' };
  if (!k) return { msg: 'This question isn\'t in a particular key. Pick one yourself, or answer first and try again.' };
  setKey(k.root, k.type, true);
  const how = { question: 'named in the question', answer: 'from the answer', notes: 'best fit for the question\'s notes' }[k.src];
  return { ok: true, msg: `Key set to <b>${disp(KEYSEL.root)} ${SCALES[k.type].name}</b> (${how}).` };
}
// Auto: show each question's key as it loads. Before you answer, only a key the question itself names is used
// (the notes could give the answer away); once answered, the key is also worked out from the answer and notes.
let KEY_AUTO = store.get('keyAuto', true);
function autoKey(q, answered) {
  if (!KEY_AUTO) return;
  const k = questionKey(q, answered);
  if (k && !k.ear && (answered || k.src === 'question')) setKey(k.root, k.type, true);
  else if (!answered && KEYSEL.type !== 'off') setKey(KEYSEL.root, 'off');
}
function setKey(root, type, fromQuestion = false) {
  KEYSEL.q = fromQuestion; // a key that came from a question is cleared when you leave Practice
  KEYSEL.root = ROLL_ROOTS.includes(root) ? root : DEFAULT_NAMES[pc(root)]; KEYSEL.type = type; store.set('pianoKey', KEYSEL);
  $('#dkRoot').value = KEYSEL.root; $('#dkType').value = type; $('#dock').classList.toggle('keyed', type !== 'off');
  ALL_PIANOS.forEach(p => p.refresh());
  if (typeof roll !== 'undefined' && (roll.sroot !== KEYSEL.root || roll.stype !== type)) roll.setScale(KEYSEL.root, type);
}
let dkMsgT = 0;
function dockMsg(html) {
  const el = $('#dkMsg'); el.innerHTML = html; el.classList.remove('hidden'); clearTimeout(dkMsgT); dkMsgT = setTimeout(() => el.classList.add('hidden'), 4000);
}

// ---- circle & keys tool ----
const TK = { root: 'C', type: 'major' };
function renderKeyTool() {
  drawCircle($('#tkCircle'), TK.root, TK.type, (root, type) => {
    TK.root = root; TK.type = type; renderKeyTool();
    Snd.play(EV.chord(mids(voice(chordNotes(root, type === 'major' ? 'maj' : 'min'))), 0, 1.2));
  });
  const sid = TK.type === 'major' ? 'major' : 'minor', s = scaleNotes(TK.root, sid), d = diatonic(TK.root, sid), rel = TK.type === 'major' ? tr(TK.root, 'M6') : tr(TK.root, 'm3');
  const cam = camOf(TK.root, TK.type === 'major' ? 'B' : 'A');
  $('#tkInfo').innerHTML = `<div class="notes">${s.map((n, i) => `<div class="note">${disp(n)}<small>${SCALES[sid].iv.map(x => DEG[x])[i]}</small></div>`).join('')}</div>
    <div class="facts"><span>Relative ${TK.type === 'major' ? 'minor' : 'major'}: <b>${disp(rel)} ${TK.type === 'major' ? 'minor' : 'major'}</b> · Camelot <b>${cam}</b></span>
    <span>Neighbours: <b>${disp(tr(TK.root, 'P4'))}</b> &amp; <b>${disp(tr(TK.root, 'P5'))}</b> ${TK.type}</span></div>
    <div class="tkchords">${d.map((c, i) => `<button data-i="${i}" style="--fc:${FUNC[i][2]}" title="${FUNC[i][1]}"><b>${c.roman}</b><span>${chordSym(c.root, c.type)}</span></button>`).join('')}</div>
    <div class="row2"><button class="sm" id="tkScale">▶ Scale</button><button class="sm" id="tkRoll" title="Shade these notes in the piano roll">▦ Show in piano roll</button></div>`;
  $$('#tkInfo .tkchords button').forEach(b => b.onclick = () => { const v = mids(voice(d[+b.dataset.i].notes)); Snd.play(EV.chord(v)); flashKeys(v); });
  $('#tkScale').onclick = () => { const v = mids(voice(s.concat([TK.root]))); Snd.play(EV.arp(v, 0, 0.2, 0.35)); flashKeys(v, 1800); };
  $('#tkRoll').onclick = () => { TOOLS.roll = true; applyTools(); setKey(TK.root, sid); };
}

// ---- chord finder ----
const CF = new Set();
function findChords(pcs) {
  const out = [];
  for (const r of pcs) for (const [id, c] of Object.entries(CHORDS)) {
    const set = new Set(c.iv.map(i => (r + IV[i][0]) % 12));
    if (set.size === pcs.size && [...set].every(p => pcs.has(p))) out.push({ r, id, name: disp(DEFAULT_NAMES[r]) + c.sym, full: c.name });
  }
  return out;
}
function renderFinder() {
  $('#cfGrid').innerHTML = DEFAULT_NAMES.map((n, p) => `<button data-p="${p}" class="${isBlackPc(p) ? 'blk' : ''} ${CF.has(p) ? 'on' : ''}">${disp(n)}</button>`).join('');
  $$('#cfGrid button').forEach(b => b.onclick = () => { const p = +b.dataset.p; CF.has(p) ? CF.delete(p) : (CF.add(p), Snd.note(60 + p)); renderFinder(); });
  const pcs = [...CF].sort((a, b) => a - b); let res = '';
  if (pcs.length === 0) res = '';
  else if (pcs.length === 1) res = `<div class="big">${disp(DEFAULT_NAMES[pcs[0]])}</div>`;
  else if (pcs.length === 2) {
    const d = pcs[1] - pcs[0], it = INTS.find(x => x.s === d), inv = INTS.find(x => x.s === 12 - d);
    res = `<div class="big">${it.name}</div><span class="alt">${disp(DEFAULT_NAMES[pcs[0]])} up to ${disp(DEFAULT_NAMES[pcs[1]])} = ${d} semitones (or a ${inv.name} the other way)</span>`;
  } else {
    const m = findChords(CF);
    res = m.length ? `<div class="big">${m[0].name}</div><span class="alt">${m[0].full}${m.length > 1 ? ` · also: ${m.slice(1).map(x => x.name).join(', ')}` : ''}</span>`
      : `<div class="big">No common name</div><span class="alt">Could be a cluster or an extended/altered chord.</span>`;
  }
  const fits = pcs.length < 2 ? [] : MAJOR_KEYS.filter(k => { const s = new Set(scaleNotes(k, 'major').map(pc)); return pcs.every(p => s.has(p)); });
  if (fits.length) res += `<div class="cf-keys"><span class="muted small">In the key of</span>${fits.map(k => `<button class="sm" data-k="${k}" title="Highlight this key on the piano">${disp(k)} / ${disp(tr(k, 'M6'))}m</button>`).join('')}</div>`;
  else if (pcs.length > 2) res += '<div class="cf-keys"><span class="muted small">Not in one major or natural minor key</span></div>';
  $('#cfOut').innerHTML = res + `<div class="btnrow" style="margin-top:10px"><button class="sm" id="cfPlay">▶ Play</button><button class="sm" id="cfFrom" title="Copy the highlighted or selected keys from the piano">⤓ From piano</button><button class="sm ghost" id="cfClear">Clear</button></div>`;
  $('#cfPlay').onclick = () => { const v = pcs.map(p => 60 + p); Snd.play(EV.arpChord(v)); flashKeys(v); };
  $('#cfClear').onclick = () => { CF.clear(); renderFinder(); };
  $$('#cfOut [data-k]').forEach(b => b.onclick = () => setKey(b.dataset.k, 'major'));
  $('#cfFrom').onclick = () => {
    CF.clear(); Object.entries(dockPiano().keys).forEach(([m, k]) => { if (/\b(q|ans|sel|hint|pin)\b/.test(k.el.className)) CF.add(+m % 12); });
    renderFinder();
  };
}

// ---- tempo tool ----
function renderTempoTool() {
  const bpm = +$('#tBpm').value; if (!(bpm >= 20 && bpm <= 400)) return;
  const q = 60000 / bpm, list = SUBDIV.filter(([n]) => !['1/2 note', '1/4 triplet', 'dotted 1/4'].includes(n));
  $('#tBpmOut').innerHTML = list.map(([n, b]) => `<div class="tile"><div class="k">${n.replace(' (1 beat)', '')}</div><div class="v">${(q * b).toFixed(1)}<span class="muted small"> ms</span></div></div>`).join('');
  $('#tBpmExtra').innerHTML = `8 bars = <b>${(32 * q / 1000).toFixed(1)} s</b> · 16 bars = <b>${(64 * q / 1000).toFixed(1)} s</b><br>Half-time ${r1(bpm / 2)} · double-time ${bpm * 2} BPM`;
}
$('#tBpm').oninput = renderTempoTool;

// ---- cheat sheet ----
// Every term a question can ask about should be findable here. Each topic opens on its own tab.
let CS_TAB = 'int', CS_LAST_TOPIC = null;
const CS_TOPIC_TAB = { keyboard: 'int', intervals: 'int', ear: 'int', triads: 'chord', sevenths: 'chord', extensions: 'chord', bass: 'chord', voicing: 'chord',
  minor: 'scale', modes: 'scale', penta: 'scale', exotic: 'scale', fifth: 'key', diatonic: 'key', circle: 'key', camelot: 'key', earkey: 'key',
  melody: 'harm', chromatic: 'harm', songs: 'harm', mediants: 'harm', advanced: 'harm', progressions: 'harm', rhythm: 'rhythm', structure: 'rhythm', tuning: 'sound' };
function cheatForTopic(topic) {
  if (topic === CS_LAST_TOPIC) return; CS_LAST_TOPIC = topic;
  const tab = CS_TOPIC_TAB[topic]; if (!tab || tab === CS_TAB) return;
  CS_TAB = tab; renderCheat(); if (TOOLS.cheat) layoutTools();
}
// Search: typing searches every tab; clicking a tab narrows the results to that tab (click it again for all tabs). The text stays until it is cleared.
let CS_Q = '', CS_SCOPE = false;
function renderCheat() {
  const tabs = $$('#csTabs button');
  tabs.forEach(b => { b.classList.toggle('active', b.dataset.cs === CS_TAB); b.classList.remove('nohit'); });
  $('#csTabs').classList.toggle('searching', !!CS_Q && !CS_SCOPE);
  if (!CS_Q) { $('#csBody').innerHTML = cheatHTML(CS_TAB); return; }
  // Keep matching rows under their tab and section names. A matching section title keeps the whole section.
  const q = CS_Q.toLowerCase(), has = el => el.textContent.toLowerCase().includes(q), tmp = document.createElement('div'); let out = '';
  $$('#csTabs button').forEach(b => {
    tmp.innerHTML = cheatHTML(b.dataset.cs); let head = '', whole = false, part = '';
    [...tmp.children].forEach(el => {
      if (el.tagName === 'H4') { head = el.outerHTML; whole = has(el); return; }
      let hit = '';
      if (whole) hit = el.outerHTML;
      else if (el.tagName === 'TABLE') {
        const rows = [...el.rows].filter(r => r.cells[0].tagName !== 'TH' && has(r)), th = el.rows[0].cells[0].tagName === 'TH' ? el.rows[0].outerHTML : '';
        if (rows.length) hit = `<table class="${el.className}">${th}${rows.map(r => r.outerHTML).join('')}</table>`;
      } else if (has(el)) hit = el.outerHTML;
      if (hit) { part += head + hit; head = ''; }
    });
    b.classList.toggle('nohit', !part);
    if (part && (!CS_SCOPE || b.dataset.cs === CS_TAB)) out += `<div class="cs-from">${b.textContent}</div>${part}`;
  });
  const others = tabs.filter(b => !b.classList.contains('nohit')).map(b => b.textContent);
  $('#csBody').innerHTML = out || `<p>Nothing found${CS_SCOPE ? ` in ${$('#csTabs button.active').textContent}${others.length ? `. Matches in: ${others.join(', ')}` : ''}` : ''}.</p>`;
}
function cheatHTML(CS_TAB) {
  const fm = ivs => ivs.map(i => i === 'P1' ? 'R' : DEG[i] || i).join(' ');
  const semis = ivs => ivs.map(i => IV[i][0]), stack = ivs => semis(ivs).slice(1).map((s, k) => s - semis(ivs)[k]).join(' + ');
  const short = n => n.replace(/ \(.*\)/, '');
  const qualRows = ids => ids.map(id => { const c = CHORDS[id]; return `<tr><td>${short(c.name)} <span class="muted">C${c.sym}</span></td><td class="mono">${stack(c.iv)}</td><td class="mono">${semis(c.iv).join(' ')}</td></tr>`; }).join('');
  const H = t => `<h4>${t}</h4>`, rows = list => list.map(r => `<tr>${r.map((c, i) => `<td${i && r.mono && r.mono.includes(i) ? ' class="mono"' : ''}>${c}</td>`).join('')}</tr>`).join('');
  const dl = list => `<table class="cs-dl">${list.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</table>`;
  let h = '';
  if (CS_TAB === 'int') h = `<table><tr><th>Interval</th><th>Semis</th><th>From C</th></tr>${INTS.map(it => `<tr><td>${it.name}</td><td class="mono">${it.s}</td><td>${disp(tr('C', it.id === 'P8' ? 'P1' : it.id))}</td></tr>`).join('')}</table>
    ${H('Words')}${dl([['Semitone', 'One key to the very next key, black or white. Also called a half step.'], ['Whole step', '2 semitones (a tone).'], ['Octave', '12 semitones: the same note name, higher or lower.'],
      ['Tritone', '6 semitones, exactly half an octave. The most tense interval.'], ['Perfect', 'Unison, 4th, 5th and octave. They have no major/minor version.'], ['Inverting', 'Move the bottom note up an octave. Numbers add to 9 (3rd ↔ 6th), major ↔ minor, perfect stays perfect.'],
      ['Compound', '9th = 2nd, 11th = 4th, 13th = 6th, each an octave higher.']])}`;
  if (CS_TAB === 'chord') h = `<table class="cs-qual"><tr><th>Triad</th><th>Half steps</th><th>From root</th></tr>${qualRows(TRIADS)}
      <tr><th>7th chord</th><th>Half steps</th><th>From root</th></tr>${qualRows(SEVENTHS)}</table>
    <p>Major 3rd = 4 half steps, minor 3rd = 3. A triad is two 3rds stacked; a 7th chord adds a third 3rd on top.</p>
    ${H('Every chord: symbol, name, formula')}
    <table class="cs-all"><tr><th>Symbol</th><th>Name</th><th>Formula</th><th>Half steps</th></tr>${Object.values(CHORDS).map(c => `<tr><td>C${c.sym}</td><td>${short(c.name)}</td><td class="mono">${fm(c.iv)}</td><td class="mono">${stack(c.iv)}</td></tr>`).join('')}</table>
    ${H('Reading symbols')}${dl([['m', 'minor (Cm). No letter after the root means major.'], ['°', 'diminished (C°): minor 3rd + flat 5th.'], ['ø', 'half-diminished (Cø7), also written m7♭5.'], ['+', 'augmented (C+): major 3rd + sharp 5th.'],
      ['7', 'dominant 7th: major triad + ♭7. "maj7" uses the natural 7th instead.'], ['sus', 'the 3rd is replaced by the 2nd (sus2) or 4th (sus4).'], ['add9', 'triad + 9th, no 7th. A plain "9" chord includes the ♭7.'], ['5', 'power chord: root and 5th only.']])}
    ${H('Inversions and slash chords')}
    <table><tr><th>Position</th><th>In the bass</th><th>C major</th><th>Written</th></tr>${rows([['Root position', 'root', 'C – E – G', 'C'], ['1st inversion', '3rd', 'E – G – C', 'C/E'], ['2nd inversion', '5th', 'G – C – E', 'C/G'], ['3rd inversion', '7th (7th chords)', 'B♭ – C – E – G', 'C7/B♭']])}</table>
    <p>A slash chord X/Y is chord X played over bass note Y.</p>
    ${H('Voicing')}${dl([['Closed', 'All the notes fit inside one octave.'], ['Open', 'The notes are spread over more than an octave.'], ['Common tones', 'Notes two chords share. Hold them and move the rest by step for smooth voice leading.'],
      ['Low register', 'Below about C3, 3rds and other close intervals sound muddy. Use octaves and 5ths down there.']])}`;
  if (CS_TAB === 'scale') h = `<table><tr><th>Scale</th><th>Steps</th><th>Formula</th></tr>${Object.entries(SCALES).map(([id, s]) => `<tr><td>${s.name}</td><td class="mono">${stepPattern(id)}</td><td class="mono">${s.iv.map(i => DEG[i]).join(' ')}</td></tr>`).join('')}</table>
    <p>W = whole step (2 semitones), H = half step (1), W+H = 3 semitones.</p>
    ${H('Modes')}
    <table><tr><th>Mode</th><th>Starts on</th><th>What it is</th><th>Same notes</th></tr>${MODES.map((m, i) => `<tr><td>${MODE_NAMES[m]}</td><td>${ORD[i]} note</td><td>${MODE_DESC[m].replace(/^(a|the) /, '')}</td><td>${disp(tr('C', MODE_OFFSET[m]))} ${MODE_NAMES[m]} = C major</td></tr>`).join('')}</table>
    <p>The characteristic note is the one that differs from plain major or minor: Dorian ♮6 · Phrygian ♭2 · Lydian ♯4 · Mixolydian ♭7 · Locrian ♭2 ♭5.</p>
    ${H('Minor scales')}${dl([['Natural', 'The plain minor scale (Aeolian).'], ['Harmonic', 'Natural minor with a raised 7th. It makes the V chord major.'], ['Melodic', 'Natural minor with a raised 6th and 7th.'], ['Relative', 'Major and minor keys with the same notes: C major and A minor. The minor starts on the 6th note of the major.'], ['Parallel', 'Same tonic, different notes: C major and C minor.']])}
    ${H('Pentatonic and blues')}${dl([['Major pentatonic', 'Major scale without the 4th and 7th.'], ['Minor pentatonic', 'Natural minor without the 2nd and ♭6th.'], ['Blues', 'Minor pentatonic plus the ♭5 (the "blue note").'], ['Relatives', 'A minor pentatonic has the same notes as C major pentatonic.']])}
    ${H('Exotic scales')}${dl(Object.entries(EXOTIC_FEAT).map(([id, d]) => [SCALES[id].name.replace(/ \(.*\)/, ''), d + '.']))}`;
  if (CS_TAB === 'key') h = `<table>
      <tr><th>Key</th><th>Chords</th></tr>
      <tr><td>Major</td><td>I ii iii IV V vi vii°</td></tr>
      <tr><td>Major 7ths</td><td>Imaj7 ii7 iii7 IVmaj7 V7 vi7 viiø7</td></tr>
      <tr><td>Nat. minor</td><td>i ii° III iv v VI VII</td></tr>
      <tr><td>Minor 7ths</td><td>i7 iiø7 IIImaj7 iv7 v7 VImaj7 VII7</td></tr>
      <tr><td>Harm. minor</td><td>V becomes major, and vii° appears, from the raised 7th</td></tr></table>
    <p>Roman numerals: upper-case = major chord, lower-case = minor, ° = diminished. The number is the scale degree the chord is built on.</p>
    ${H('Scale degrees')}
    <table><tr><th>Degree</th><th>Name</th><th>Chord in major</th></tr>${DEG_NAMES.map((n, i) => `<tr><td>${i + 1}</td><td>${n}${i === 6 ? ' (a half step below the tonic)' : ''}</td><td>${['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'][i]} ${['major', 'minor', 'minor', 'major', 'major', 'minor', 'diminished'][i]}</td></tr>`).join('')}</table>
    ${H('Key signatures')}
    <table><tr><th>Major</th><th>Rel. minor</th><th>Signature</th><th>Camelot</th></tr>${MAJOR_KEYS.map(k => `<tr><td>${disp(k)}</td><td>${disp(tr(k, 'M6'))}m</td><td>${keySig(k).replace('No sharps or flats', 'none')}</td><td class="mono">${camOf(k, 'B')} / ${camOf(tr(k, 'M6'), 'A')}</td></tr>`).join('')}</table>
    ${dl([['Order of sharps', 'F C G D A E B'], ['Order of flats', 'B E A D G C F'], ['Circle of fifths', 'Clockwise = up a 5th = one more sharp. Neighbours differ by one note.'], ['Relative minor', 'The 6th degree of the major key (3 semitones below the tonic).'],
      ['Camelot', 'Same number = relative keys (8B C major, 8A A minor). ±1 with the same letter = a 5th away. Safe mixes: same code, ±1, or switch letter.']])}`;
  if (CS_TAB === 'harm') h = `${H('Chord function')}${dl([['Tonic', 'Home, at rest: I, iii, vi.'], ['Subdominant', 'Moving away: ii, IV.'], ['Dominant', 'Tension that wants to resolve home: V, vii°.'], ['Diatonic', 'Using only notes of the key.'], ['Chromatic', 'A note or chord from outside the key.']])}
    ${H('Cadences (how a phrase ends)')}<table><tr><th>Cadence</th><th>Chords</th><th>Feels like</th></tr>${rows([['Authentic', 'V → I', 'a full stop'], ['Plagal', 'IV → I', 'a gentle "amen"'], ['Half', 'ends on V', 'a comma, unfinished'], ['Deceptive', 'V → vi', 'a surprise']])}</table>
    ${H('Melody')}${dl([['Chord tone', 'A note of the chord playing underneath. The most stable choice.'], ['Passing tone', 'Steps between two chord tones.'], ['Neighbour tone', 'Steps away from a chord tone and straight back.'], ['Step', 'Moving to the next note of the scale (conjunct motion).'],
      ['Leap', 'Jumping a 3rd or more (disjunct motion).'], ['Leading tone', 'The 7th degree, a half step below the tonic. It pulls up to home.'], ['Chromatic passing tone', 'An out-of-key note that fills the gap between two notes a whole step apart.']])}
    ${H('Colour chords')}${dl([['Secondary dominant', 'V7/x: the dominant 7th a 5th above chord x. In C: V7/V = D7, which pulls to G.'], ['Borrowed chord', 'Taken from the parallel minor into a major key: iv, ♭III, ♭VI, ♭VII. In C: Fm, E♭, A♭, B♭.'],
      ['Neapolitan', '♭II: a major chord a half step above the tonic. In C minor: D♭.'], ['Tritone substitute', 'Replace V7 with the dominant 7th a tritone away. In C: G7 → D♭7.'], ['Picardy third', 'A minor-key piece that ends on the major tonic chord.'],
      ['Chromatic mediant', 'A chord a major or minor 3rd away with the same quality. From C: E, E♭, A, A♭. They share just one note.'], ['Harmonic-minor V', 'In a minor key the v chord is made major (V) for a stronger pull home.']])}
    ${H('Common progressions')}<table><tr><th>Name</th><th>Chords</th><th>Mood</th></tr>${PROG_LIB.map(p => `<tr><td>${p.name}</td><td>${progLabel(p.romans)}</td><td>${p.mood} · ${p.mode}</td></tr>`).join('')}</table>`;
  if (CS_TAB === 'rhythm') h = `${H('The 16-step grid (one bar of 4/4)')}
    <table><tr><th>Count</th><th>Steps</th><th>Used for</th></tr>${rows([['Beats 1 2 3 4', '1 · 5 · 9 · 13', 'four-on-the-floor kick'], ['Beats 2 and 4', '5 · 13', 'backbeat clap or snare'], ['The "&"', '3 · 7 · 11 · 15', 'off-beat hats'], ['The "e"', '2 · 6 · 10 · 14', ''], ['The "a"', '4 · 8 · 12 · 16', '']])}</table>
    <p>Each beat is 4 steps, counted "1 e & a".</p>
    ${H('Note lengths')}<table><tr><th>Note</th><th>Per bar</th><th>Steps</th></tr>${rows([['Whole (1 bar)', '1', '16'], ['Half', '2', '8'], ['Quarter (1 beat)', '4', '4'], ['8th', '8', '2'], ['16th', '16', '1']])}</table>
    ${dl([['Dotted', '1.5 × the length.'], ['Triplet', '3 notes in the space of 2.'], ['1 beat in ms', '60 000 ÷ BPM. At 120 BPM a beat is 500 ms.'], ['Bars per minute', 'BPM ÷ 4. Sixteen bars at 128 BPM last 30 s.']])}
    ${H('Feel')}${dl([['Syncopation', 'Accenting the off-beats or weak parts of the bar.'], ['Swing', 'Delaying every second 8th or 16th note for a shuffled feel.'], ['Polyrhythm', 'Two different divisions at once, such as 3 against 4.'], ['Half-time', 'Clap on beat 3 instead of 2 and 4, so it feels half as fast.'], ['Tresillo', 'The 3 + 3 + 2 pattern: steps 1, 4, 7.']])}
    ${H('Typical tempos')}<table><tr><th>Genre</th><th>BPM</th></tr>${rows([['Hip-hop / boom-bap', '85–95'], ['House', '120–128'], ['Dubstep', '~140 (half-time feel)'], ['Drum & bass', '170–176']])}</table>
    ${H('Song sections')}${dl([['Intro / Outro', 'Sparse, mostly drums and simple parts, easy for DJs to mix.'], ['Build-up', 'Rising tension: risers, snare rolls, filter sweeps. The kick often drops out.'], ['Drop', 'The peak: full drums and bass, the main hook.'], ['Breakdown', 'Energy pulls back and the chords and melody are exposed.'],
      ['Lengths', 'Sections usually last 8, 16 or 32 bars. A 32-bar intro plus a 16-bar build puts the drop on bar 49.'], ['Before the drop', 'End the build on the V chord of the drop\'s chord for the strongest pull.']])}`;
  if (CS_TAB === 'sound') h = `${H('Pitch and frequency')}${dl([['Octave', 'Doubles the frequency. A4 = 440 Hz, A3 = 220, A2 = 110, A1 = 55.'], ['Cents', '100 cents = 1 semitone. 1200 cents = 1 octave.'], ['MIDI numbers', '60 = middle C (C4; Ableton calls it C3). 69 = A4. Add 12 for each octave up.'], ['Synth "Semi" knob', 'Transposes in semitones: +12 is an octave up, +7 is a 5th up.']])}
    ${H('Sub and 808 notes')}<table><tr><th>Note</th><th>Hz</th><th>Note</th><th>Hz</th></tr>${range(0, 5).map(i => { const f = m => (440 * Math.pow(2, (m - 69) / 12)).toFixed(1); return `<tr><td>${disp(DEFAULT_NAMES[i])}1</td><td class="mono">${f(24 + i)}</td><td>${disp(DEFAULT_NAMES[i + 6])}1</td><td class="mono">${f(30 + i)}</td></tr>`; }).join('')}</table>
    <p>Double the number for the octave above (E1 41.2 → E2 82.4). Tune the kick or 808 to the root of your key.</p>
    ${H('Harmonics (overtones)')}<table><tr><th>Harmonic</th><th>Frequency</th><th>Pitch above the note</th></tr>${rows([['1', '1×', 'the note itself (fundamental)'], ['2', '2×', '1 octave'], ['3', '3×', 'octave + 5th'], ['4', '4×', '2 octaves'], ['5', '5×', '2 octaves + major 3rd'], ['6', '6×', '2 octaves + 5th'], ['7', '7×', '2 octaves + ♭7 (a little flat)'], ['8', '8×', '3 octaves']])}</table>`;
  return h;
}
$$('#csTabs button').forEach(b => b.onclick = () => { CS_SCOPE = !!CS_Q && !(CS_SCOPE && CS_TAB === b.dataset.cs); CS_TAB = b.dataset.cs; renderCheat(); layoutTools('cheat'); });
$('#csSearch').oninput = e => { CS_Q = e.target.value.trim(); if (!CS_Q) CS_SCOPE = false; renderCheat(); layoutTools('cheat'); };

// ---- tool registry / toggles ----
const roll = new PianoRoll($('#pianoRoll'));
const Tools = {
  onQuestion(q) { if (TOOLS.roll && roll.follow) roll.load(q, false); cheatForTopic(q.topic); autoKey(q, false); },
  onAnswer(q) { if (TOOLS.roll && roll.follow) roll.load(q, true); autoKey(q, true); roll.showName(); },
  stop() { roll.stop(); },
};
// Side tools sit in a sticky column beside the question. Each panel collapses to its title bar;
// when the open ones don't fit, the least recently used collapse automatically (AUTO) and come
// back when there's room. Very wide screens get a second column instead.
const SIDE = ['circle', 'finder', 'tempo', 'cheat'], ALLT = ['roll', ...SIDE];
const TSTATE = Object.assign({ coll: {}, used: [] }, store.get('toolState', {})), AUTO = {};
const toolEl = k => $('#tool-' + k);
const touchTool = k => { const u = TSTATE.used, i = u.indexOf(k); if (i >= 0) u.splice(i, 1); u.push(k); };
function toolSummary(k) {
  if (k === 'circle') return `${disp(TK.root)} ${TK.type}`;
  if (k === 'finder') { const b = $('#cfOut .big'); return b ? b.textContent : 'no notes picked'; }
  if (k === 'tempo') return `${$('#tBpm').value} BPM`;
  if (k === 'cheat') return $('#csTabs button.active').textContent;
  return roll.notes.length ? `${roll.notes.length} note${roll.notes.length > 1 ? 's' : ''}` : 'empty';
}
function toggleTool(k) {
  const c = !toolEl(k).classList.contains('collapsed'); TSTATE.coll[k] = c; AUTO[k] = false;
  if (!c) touchTool(k);
  layoutTools(c ? null : k);
}
ALLT.forEach(k => {
  const el = toolEl(k), head = el.querySelector('.tool-head'), span = head.querySelector('span'), body = document.createElement('div');
  body.className = 'tool-body'; [...el.children].filter(c => c !== head).forEach(c => body.appendChild(c)); el.appendChild(body);
  const t = document.createElement('button'); t.className = 'tool-title'; t.title = 'Collapse or expand';
  t.innerHTML = `<span>${span.innerHTML}</span><span class="tool-sum"></span>`; span.replaceWith(t);
  t.onclick = () => toggleTool(k);
  body.addEventListener('pointerdown', () => touchTool(k), true);
});
function layoutTools(keep) {
  const el = document.activeElement, f = el && el !== document.body && $('#toolsCol').contains(el) ? el : null;
  let sel = null; try { if (f && f.selectionStart != null) sel = [f.selectionStart, f.selectionEnd]; } catch (e) { }
  layoutToolsNow(keep);
  if (f && document.activeElement !== f) { f.focus({ preventScroll: true }); if (sel) try { f.setSelectionRange(sel[0], sel[1]); } catch (e) { } }
}
function layoutToolsNow(keep) {
  const play = $('#play'), main = $('#main'), A = $('#tcolA'), B = $('#tcolB'), open = SIDE.filter(k => TOOLS[k]);
  const inPlay = TAB === 'quiz' && !play.classList.contains('hidden'), float = !inPlay, col = $('#toolsCol');
  const visible = !(inPlay && document.body.classList.contains('focus'));
  const home = float ? $('#toolsFloat') : play.querySelector('.play-layout'); if (col.parentElement !== home) home.appendChild(col);
  document.body.classList.toggle('tools-side', inPlay && visible && open.length > 0 && window.innerWidth >= 900);
  document.body.classList.toggle('tools-float-open', float && open.length > 0);
  if (float) play.classList.remove('two');
  if (visible && open.length) {
    const stacked = inPlay && window.innerWidth < 900, GAP = 12, r = main.getBoundingClientRect();
    const avail = Math.max(120, float ? main.clientHeight - 28 : main.clientHeight - parseFloat(getComputedStyle(play).paddingTop) - 30);
    const bs = document.body.style; bs.setProperty('--side-h', avail + 'px'); bs.setProperty('--tb-h', '10px'); bs.setProperty('--tf-top', (r.top + 14) + 'px');
    play.classList.remove('two'); SIDE.forEach((k, i) => { if (A.children[i] !== toolEl(k)) A.appendChild(toolEl(k)); toolEl(k).classList.remove('collapsed'); toolEl(k).querySelector('.tool-body').style.maxHeight = ''; });
    const first = toolEl(open[0]); first.classList.add('collapsed'); const HEAD = first.offsetHeight; first.classList.remove('collapsed');
    const H = {}; open.forEach(k => { H[k] = toolEl(k).offsetHeight; AUTO[k] = false; });
    const h = k => TSTATE.coll[k] ? HEAD : H[k], sum = ks => ks.reduce((a, k) => a + h(k), 0) + GAP * Math.max(0, ks.length - 1);
    let cols = [open];
    if (inPlay && !stacked && window.innerWidth >= 1760 && open.length > 1 && sum(open) > avail) {
      let best = null;
      for (let mask = 1; mask < (1 << open.length) - 1; mask++) {
        const a = open.filter((_, i) => !(mask >> i & 1)), b = open.filter((_, i) => mask >> i & 1), score = Math.max(sum(a), sum(b));
        if (!best || score < best.score) best = { a, b, score };
      }
      cols = [best.a, best.b]; play.classList.add('two'); best.b.forEach(k => B.appendChild(toolEl(k)));
    }
    const rank = k => TSTATE.used.indexOf(k), expanded = open.filter(k => !TSTATE.coll[k]);
    if (!keep || !expanded.includes(keep)) keep = expanded.slice().sort((x, y) => rank(y) - rank(x))[0];
    for (const c of cols) {
      const lru = c.filter(k => !TSTATE.coll[k] && k !== keep).sort((x, y) => rank(x) - rank(y));
      let total = sum(c); const limit = stacked ? 0 : avail;
      while (total > limit && lru.length) { const k = lru.shift(); AUTO[k] = true; total -= H[k] - HEAD; }
      // still too tall with only one panel open: let that panel scroll inside itself so the collapsed title bars stay visible
      if (!stacked && total > avail && c.includes(keep)) { const b = toolEl(keep).querySelector('.tool-body'); b.style.maxHeight = Math.max(140, b.offsetHeight - (total - avail)) + 'px'; }
    }
  } else if (!open.length) play.classList.remove('two');
  ALLT.forEach(k => {
    const el = toolEl(k), c = !!(TSTATE.coll[k] || (AUTO[k] && k !== 'roll'));
    el.classList.toggle('collapsed', c); el.querySelector('.tool-title').setAttribute('aria-expanded', String(!c));
    if (c) el.querySelector('.tool-sum').textContent = '· ' + toolSummary(k);
  });
  store.set('toolState', TSTATE);
}
function applyTools(keep) {
  $$('#toolbar button[data-tool]').forEach(b => b.setAttribute('aria-pressed', TOOLS[b.dataset.tool] ? 'true' : 'false'));
  ALLT.forEach(k => toolEl(k).classList.toggle('hidden', !TOOLS[k]));
  $('#play').classList.toggle('with-side', SIDE.some(k => TOOLS[k]));
  $('#toolsClose').classList.toggle('hidden', (document.body.classList.contains('in-play') ? ALLT : SIDE).filter(k => TOOLS[k]).length < 2);
  if (!TOOLS.roll) roll.stop();
  updateDockVisibility(); store.set('tools', TOOLS); layoutTools(keep);
}
$$('#toolbar button[data-tool]').forEach(b => b.onclick = () => {
  const k = b.dataset.tool; TOOLS[k] = !TOOLS[k];
  if (TOOLS[k] && k !== 'piano') { TSTATE.coll[k] = false; touchTool(k); }
  applyTools(k);
  if (k === 'roll' && TOOLS.roll && S.q) roll.load(S.q, S.answered);
  if (k === 'cheat' && TOOLS.cheat) { const t = TAB === 'learn' && Learn.topic() ? Learn.topic() : S.q && S.q.topic; if (t) { CS_LAST_TOPIC = null; cheatForTopic(t); } }
  if (TOOLS[k] && k !== 'piano') { const el = toolEl(k); requestAnimationFrame(() => el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })); }
});
$('#toolsClose').onclick = () => { (document.body.classList.contains('in-play') ? ALLT : SIDE).forEach(k => TOOLS[k] = false); applyTools(); };
$$('[data-close]').forEach(b => b.onclick = () => { TOOLS[b.dataset.close] = false; applyTools(); });
// The tools bar lives in the top bar on every page. Piano, Piano roll and Focus only apply during a question session.
let syncKey = '';
const syncToolbar = () => {
  const on = TAB === 'quiz' && !$('#play').classList.contains('hidden');
  if (syncKey === TAB + on) return; syncKey = TAB + on; // layoutTools changes classes too: only react to a real page change
  if (TAB !== 'quiz' && KEYSEL.q && KEYSEL.type !== 'off') setKey(KEYSEL.root, 'off');
  document.body.classList.toggle('in-play', on); document.body.classList.toggle('on-quiz', TAB === 'quiz');
  $('#toolsClose').classList.toggle('hidden', (on ? ALLT : SIDE).filter(k => TOOLS[k]).length < 2);
  layoutTools();
};
new MutationObserver(syncToolbar).observe($('#play'), { attributes: true, attributeFilter: ['class'] });
$$('.tabpane').forEach(p => new MutationObserver(syncToolbar).observe(p, { attributes: true, attributeFilter: ['class'] }));
let toolsRaf = 0;
new ResizeObserver(() => { cancelAnimationFrame(toolsRaf); toolsRaf = requestAnimationFrame(() => layoutTools()); }).observe($('#main'));

$('#dkRoot').innerHTML = ROLL_ROOTS.map(r => `<option value="${r}">${disp(r)}</option>`).join('');
$('#dkType').innerHTML = `<option value="off">Off</option>` + Object.entries(SCALES).map(([id, s]) => `<option value="${id}">${s.name}</option>`).join('');
$('#dkRoot').onchange = e => setKey(e.target.value, KEYSEL.type === 'off' ? 'major' : KEYSEL.type);
$('#dkType').onchange = e => setKey(KEYSEL.root, e.target.value);
$('#dkUnpin').onclick = () => { PINS.clear(); syncPins(); };
$('#dkFromQ').onclick = () => { const r = applyQuestionKey(); if (!r.ok) dockMsg(r.msg); else $('#dkMsg').classList.add('hidden'); };
$('#dkAuto').checked = KEY_AUTO;
$('#dkAuto').onchange = e => { KEY_AUTO = e.target.checked; store.set('keyAuto', KEY_AUTO); if (KEY_AUTO && S.q && !$('#play').classList.contains('hidden')) autoKey(S.q, S.answered); };
KEY_READY = true; setKey(KEYSEL.root, KEYSEL.type); syncToolbar();
renderKeyTool(); renderFinder(); renderTempoTool(); renderCheat(); applyTools();
setFocus(store.get('focus', false)); renderHome();
showTab('quiz');

// =====================================================================
//  INSTALLABLE APP (PWA): offline support on the hosted site
// =====================================================================
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => { });
}
let installEvt = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; $('#installBtn').classList.remove('hidden'); });
$('#installBtn').onclick = async () => { if (!installEvt) return; installEvt.prompt(); await installEvt.userChoice; installEvt = null; $('#installBtn').classList.add('hidden'); };
window.addEventListener('appinstalled', () => $('#installBtn').classList.add('hidden'));
