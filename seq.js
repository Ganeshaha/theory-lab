'use strict';
/* =====================================================================
   STEP SEQUENCER answer type (q.type === 'seq'): program a drum pattern.
   q.target = { kick|clap|hat: [0-based steps] }; rows not listed aren't checked.
   ===================================================================== */
const SEQ = { grid: null, timer: null, step: 0, locked: false };
const SEQ_MIDI = { kick: 36, clap: 39, hat: 42 }, SEQ_ORDER = ['hat', 'clap', 'kick'];
const seqHit = r => { Snd.ensure(); Create.drum(SEQ_MIDI[r], Snd.ctx.currentTime + 0.01); };
const seqBtn = (r, s) => $(`#seqGrid button[data-r="${r}"][data-s="${s}"]`);
const seqText = q => Object.entries(q.target).map(([r, st]) => `${r} on ${st.map(s => s + 1).join(', ')}`).join(' · ');

function seqRender() {
  seqStop(); SEQ.locked = false; SEQ.grid = { kick: Array(16).fill(0), clap: Array(16).fill(0), hat: Array(16).fill(0) };
  $('#qSeq').classList.remove('done');
  $('#seqGrid').innerHTML = `<div class="seq-head"><span></span>${range(0, 15).map(s => `<i class="${s % 4 === 0 ? 'b' : ''}">${s % 4 === 0 ? s / 4 + 1 : ['', 'e', '&', 'a'][s % 4]}</i>`).join('')}</div>`
    + SEQ_ORDER.map(r => `<div class="seq-row"><span>${r}</span>${range(0, 15).map(s => `<button data-r="${r}" data-s="${s}" class="${s % 4 === 0 ? 'b' : ''}" aria-label="${r}, step ${s + 1}" aria-pressed="false"></button>`).join('')}</div>`).join('');
  $$('#seqGrid button').forEach(b => b.onclick = () => {
    if (SEQ.locked) return;
    const r = b.dataset.r, s = +b.dataset.s; SEQ.grid[r][s] ^= 1;
    b.classList.toggle('on', !!SEQ.grid[r][s]); b.classList.remove('bad', 'miss'); b.setAttribute('aria-pressed', String(!!SEQ.grid[r][s]));
    if (SEQ.grid[r][s] && !SEQ.timer) seqHit(r);
  });
}
function seqPlay() {
  if (SEQ.timer) return seqStop();
  Snd.ensure(); SEQ.step = 0; $('#seqPlay').textContent = '■ Stop';
  const heads = $$('#seqGrid .seq-head i');
  const tick = () => {
    const s = SEQ.step; for (const r in SEQ.grid) if (SEQ.grid[r][s]) seqHit(r);
    heads.forEach((el, i) => el.classList.toggle('now', i === s)); SEQ.step = (s + 1) % 16;
  };
  tick(); SEQ.timer = setInterval(tick, 125); // 120 BPM sixteenths
}
function seqStop() {
  clearInterval(SEQ.timer); SEQ.timer = null;
  const b = $('#seqPlay'); if (b) b.textContent = '▶ Play';
  $$('#seqGrid .seq-head i').forEach(el => el.classList.remove('now'));
}
function seqDiff(q) {
  let extra = 0, miss = 0;
  for (const [r, st] of Object.entries(q.target)) for (let s = 0; s < 16; s++) {
    const want = st.includes(s), on = !!SEQ.grid[r][s];
    if (on && !want) extra++; if (!on && want) miss++;
  }
  return { extra, miss };
}
function submitSeq() {
  const q = S.q; if (S.answered || !q || q.type !== 'seq') return;
  if (!Object.keys(q.target).some(r => SEQ.grid[r].some(Boolean))) {
    const any = Object.values(SEQ.grid).some(a => a.some(Boolean));
    return tryMsg(any ? `This one is about the ${Object.keys(q.target).join(' and ')} row${Object.keys(q.target).length > 1 ? 's' : ''}.` : 'Click some steps first.', true);
  }
  const d = seqDiff(q);
  if (d.extra + d.miss === 0) return finalizeSeq(resultOf());
  S.tries++;
  if (!S.learn) return finalizeSeq('wrong');
  for (const [r, st] of Object.entries(q.target)) for (let s = 0; s < 16; s++) seqBtn(r, s).classList.toggle('bad', !!SEQ.grid[r][s] && !st.includes(s));
  sfx('try');
  tryMsg([d.miss ? `${d.miss} step${d.miss > 1 ? 's' : ''} missing` : '', d.extra ? `${d.extra} extra (outlined red)` : ''].filter(Boolean).join(', ') + '. Adjust and resubmit, or press ▶ Play to hear it.');
}
function finalizeSeq(result) {
  const q = S.q; S.answered = true; SEQ.locked = true; $('#qSeq').classList.add('done');
  for (const [r, st] of Object.entries(q.target)) for (let s = 0; s < 16; s++) {
    const want = st.includes(s), on = !!SEQ.grid[r][s], b = seqBtn(r, s);
    b.classList.toggle('on', want); b.classList.toggle('bad', on && !want); b.classList.toggle('miss', !on && want && result !== 'first' && result !== 'later');
    SEQ.grid[r][s] = want ? 1 : 0;
  }
  conclude(result, seqText(q));
  if (!SEQ.timer && $('#autoPlay').checked) seqPlay();
}
function seqHint() {
  const q = S.q, cands = [];
  for (const [r, st] of Object.entries(q.target)) st.forEach(s => { if (!SEQ.grid[r][s] && !seqBtn(r, s).classList.contains('miss')) cands.push([r, s]); });
  if (!cands.length) return tryMsg('Every needed step is already on or hinted. Remove any extras and submit.', true);
  const [r, s] = cands[0]; S.hints++; seqBtn(r, s).classList.add('miss');
  tryMsg(`💡 There's a ${r} on step ${s + 1} (dashed outline). Click it to add it.`, true);
}
$('#seqPlay').onclick = () => seqPlay();
$('#seqClear').onclick = () => { if (!SEQ.locked) seqRender(); };
$('#seqSubmit').onclick = () => submitSeq();
