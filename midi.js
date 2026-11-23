'use strict';
/* =====================================================================
   MIDI KEYBOARD INPUT (Web MIDI: Chrome, Edge and other Chromium browsers)
   - Every note sounds and lights up on the on-screen piano.
   - In "play this" questions: play the notes together as a chord and release
     to submit it, or play single notes one at a time to build the answer.
   - Elsewhere, the piano strip names the chord or interval you're holding.
   ===================================================================== */
const Midi = (() => {
  const held = new Set(); let gesture = new Set(), maxHeld = 0, access = null, devices = [];
  const fold = m => { while (m < LO) m += 12; while (m > HI) m -= 12; return m; };
  const piano = () => TAB === 'quiz' ? quizPiano : exPiano;
  const inPianoQ = () => TAB === 'quiz' && S.q && S.q.type === 'piano' && !S.answered && !$('#play').classList.contains('hidden');

  function setSelection(ms) {
    quizPiano.selected.forEach(x => quizPiano.keys[x].el.classList.remove('sel', 'wrong'));
    quizPiano.selected.clear();
    ms.forEach(x => { quizPiano.selected.add(x); quizPiano.keys[x].el.classList.add('sel'); });
  }
  function nameHeld() {
    const pcs = new Set([...held].map(m => m % 12)); if (pcs.size < 2) return;
    let name;
    if (pcs.size === 2) { const lo = Math.min(...held), hi = Math.max(...held), it = INTS.find(x => x.s === (hi - lo) % 12 || (x.s === 12 && (hi - lo) % 12 === 0)); name = it ? it.name : ''; }
    else { const f = findChords(pcs); name = f.length ? `${f[0].name} <span class="muted">(${f[0].full})</span>` : ''; }
    if (name) $('#dockNote').innerHTML = `🎹 You're playing: <b>${name}</b>`;
  }
  function noteOn(m) {
    Snd.ensure(); Snd.tone(m, 0, 0.6, 0.28);
    const f = fold(m), k = piano().keys[f]; if (k) k.el.classList.add('active');
    if (!held.size) { gesture = new Set(); maxHeld = 0; }
    held.add(m); gesture.add(f); maxHeld = Math.max(maxHeld, held.size);
    if (!inPianoQ() && !(TAB === 'quiz' && S.q && !S.answered && /^ear/.test(S.q.topic))) nameHeld();
  }
  function noteOff(m) {
    held.delete(m);
    const f = fold(m); if (![...held].some(h => fold(h) === f)) { for (const P of [quizPiano, exPiano]) if (P.keys[f]) P.keys[f].el.classList.remove('active'); }
    if (held.size || !inPianoQ()) return;
    // gesture finished inside a "play this" question
    const single = S.q.target.size === 1;
    if (maxHeld >= 2 || single) { setSelection(single ? [[...gesture].pop()] : [...gesture]); submitPiano(); }
    else { const n = [...gesture][0], sel = new Set(quizPiano.selected); sel.has(n) ? sel.delete(n) : sel.add(n); setSelection([...sel]); }
  }
  function onMsg(e) {
    const [st, d1, d2] = e.data, cmd = st & 0xf0;
    if (cmd === 0x90 && d2 > 0) noteOn(d1); else if (cmd === 0x80 || (cmd === 0x90 && d2 === 0)) noteOff(d1);
  }
  function status(text, on, title) {
    $$('.midi-btn').forEach(b => { b.textContent = b.id === 'midiBtn' ? (on ? '🎹 MIDI ✓' : '🎹 MIDI') : text; b.classList.toggle('on', !!on); b.title = title || text; });
    const h = $('#pianoHint'); if (h) h.textContent = on ? '🎹 Play the notes on your MIDI keyboard (together as a chord to submit), or click the keys.' : '🎹 Click keys on the piano to select them.';
  }
  function bind() {
    devices = []; access.inputs.forEach(inp => { inp.onmidimessage = onMsg; devices.push(inp.name); });
    if (devices.length) status(`🎹 Connected: ${devices[0]}`, true, `MIDI connected: ${devices.join(', ')}`);
    else status('🎹 No MIDI keyboard found. Plug one in.', false);
  }
  async function connect() {
    if (!navigator.requestMIDIAccess) return status('🎹 MIDI needs Chrome or Edge', false);
    try { access = await navigator.requestMIDIAccess(); } catch (e) { return status('🎹 MIDI permission was blocked', false); }
    store.set('midi', true); bind(); access.onstatechange = bind;
  }
  $$('.midi-btn').forEach(b => b.onclick = () => connect());
  if (store.get('midi', false) && navigator.requestMIDIAccess) connect(); // permission is remembered by the browser
  return { noteOn, noteOff, connect, connected: () => devices.length > 0 };
})();
