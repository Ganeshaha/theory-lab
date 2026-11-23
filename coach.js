'use strict';
/* =====================================================================
   COACH: spaced repetition, adaptive daily plans, XP & practice days.
   Pure logic + localStorage. No DOM.

   Design notes (from learning research):
   - Spacing: each topic sits in a "box" 0..5. Two first-try correct answers in a
     row promote it; the next review is due 0/1/2/4/7/15 days later. Misses drop it a box.
   - ~85% success target: if recent accuracy is low, the daily plan adds no new
     topics (review day); if it's high, it introduces more.
   - New topics: mini-lesson first (worked example), then 3 blocked questions,
     then they join the interleaved mix.
   - Motivation without shame: XP rewards effort (even revealed answers earn a
     little), and we count total practice days instead of a streak that resets.
   ===================================================================== */
const Coach = (() => {
  const K = k => 'theorylab.' + k;
  const get = (k, d) => { try { const v = localStorage.getItem(K(k)); return v === null ? d : JSON.parse(v); } catch (e) { return d; } };
  const set = (k, v) => { try { localStorage.setItem(K(k), JSON.stringify(v)); } catch (e) { } };
  const DAY = 864e5, INTERVALS = [0, 1, 2, 4, 7, 15];
  const dateKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const ORDER = TOPICS.map(t => t.id);

  let srs = get('srs', null), xp = get('xp', 0), days = get('days', {}), recent = get('recent', []);

  // First run: seed from any existing per-topic stats so earlier practice counts.
  if (!srs) {
    srs = {}; const stats = get('stats', {}), now = Date.now();
    for (const [id, s] of Object.entries(stats)) {
      if (!s.t || !ORDER.includes(id)) continue;
      const a = s.c / s.t; srs[id] = { box: s.t >= 5 && a >= 0.8 ? 2 : a >= 0.6 ? 1 : 0, due: now, run: 0 };
    }
    set('srs', srs);
  }
  const save = () => { set('srs', srs); set('xp', xp); set('days', days); set('recent', recent); };

  function level(x = xp) {
    let lv = 1, need = 100, base = 0;
    while (x >= base + need) { base += need; lv++; need = 100 + (lv - 1) * 50; }
    return { lv, into: x - base, need };
  }
  function status(id) {
    const e = srs[id]; if (!e) return 'new';
    if (e.due <= Date.now()) return 'due';
    return e.box >= 4 ? 'strong' : 'learning';
  }
  const box = id => srs[id] ? srs[id].box : -1;
  const recentAcc = () => recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : null;

  function onResult(topic, result) {
    const now = Date.now(), e = srs[topic] || (srs[topic] = { box: 0, due: now, run: 0 });
    const before = level().lv; let boxUp = false;
    if (result === 'first') {
      e.run++;
      if (e.run >= 2) { e.box = Math.min(5, e.box + 1); e.run = 0; e.due = now + INTERVALS[e.box] * DAY; boxUp = true; }
    } else { e.run = 0; e.box = Math.max(0, e.box - 1); e.due = now; }
    const gain = { first: 10, later: 6, revealed: 2, wrong: 2 }[result] || 0;
    xp += gain; const d = dateKey(); days[d] = (days[d] || 0) + 1;
    recent.push(result === 'first' ? 1 : 0); if (recent.length > 30) recent.shift();
    save();
    return { gain, boxUp, box: e.box, levelUp: level().lv > before ? level().lv : 0 };
  }
  function addXP(n) { const before = level().lv; xp += n; save(); return level().lv > before ? level().lv : 0; }

  // Build today's plan: an array of { topic, lesson? } question slots.
  function buildPlan(n = 10) {
    const now = Date.now(), acc = recentAcc();
    const introduced = ORDER.filter(id => srs[id]);
    const fresh = ORDER.filter(id => !srs[id] && id !== 'ear');
    const due = introduced.filter(id => srs[id].due <= now).sort((a, b) => srs[a].box - srs[b].box || srs[a].due - srs[b].due);

    let newCount = introduced.length < 2 ? 2 : 1, mode = 'normal';
    if (acc !== null && recent.length >= 10) {
      if (acc < 0.65) { newCount = 0; mode = 'review'; }
      else if (acc > 0.9 && due.length < 3) { newCount = 2; mode = 'stretch'; }
    }
    if (due.length >= 6) newCount = Math.min(newCount, 1);
    if (!introduced.length && !fresh.length) newCount = 0;
    const news = fresh.slice(0, newCount);

    const plan = [];
    news.forEach(id => plan.push({ topic: id, lesson: true }, { topic: id }, { topic: id }));
    let pool = due.slice(0, 6);
    if (pool.length < 3) pool = pool.concat(introduced.filter(id => !pool.includes(id)).sort((a, b) => srs[a].box - srs[b].box).slice(0, 4 - pool.length));
    pool = pool.concat(news);
    if (!pool.length) pool = [ORDER[0]];
    let last = plan.length ? plan[plan.length - 1].topic : null;
    while (plan.length < n) {
      const opts = pool.filter(id => id !== last), id = opts.length ? opts[Math.floor(Math.random() * opts.length)] : pool[0];
      plan.push({ topic: id }); last = id;
    }
    return { plan: plan.slice(0, n), news, due: due.slice(0, 6), review: pool.filter(id => !news.includes(id)), mode };
  }

  function week() {
    const out = [], d = new Date();
    for (let i = 6; i >= 0; i--) { const x = new Date(d); x.setDate(d.getDate() - i); out.push({ key: dateKey(x), label: 'SMTWTFS'[x.getDay()], n: days[dateKey(x)] || 0, today: i === 0 }); }
    return out;
  }
  return {
    onResult, addXP, buildPlan, level, status, box, recentAcc, week,
    xp: () => xp, totalDays: () => Object.keys(days).length, today: () => days[dateKey()] || 0,
    goal: () => get('goal', 15), setGoal: g => set('goal', g),
    nextNew: () => ORDER.find(id => !srs[id] && id !== 'ear'),
    reset: () => { srs = {}; xp = 0; days = {}; recent = []; save(); },
  };
})();
