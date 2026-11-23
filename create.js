'use strict';
/* =====================================================================
   CREATE: chord-loop builder → playback with bass & drums → MIDI export
   ===================================================================== */
const Create = (() => {
  const CR = { root: 'C', mode: 'major', sev: false, slots: [], hist: [], playing: false, timer: null, nodes: [], loops: [], cur: -1, curL: null };

  // Pads: [triad roman, 7th roman, description for colour chords]
  const PADS = {
    major: {
      dia: [['I', 'Imaj7'], ['ii', 'ii7'], ['iii', 'iii7'], ['IV', 'IVmaj7'], ['V', 'V7'], ['vi', 'vi7'], ['vii°', 'viiø7']],
      col: [['iv', 'iv7', 'Borrowed from minor: bittersweet'], ['bVI', 'bVImaj7', 'Borrowed: epic, cinematic'], ['bVII', 'bVII7', 'Borrowed: heroic, rock'], ['bIII', 'bIIImaj7', 'Borrowed: bold'], ['III', 'III7', 'V of vi: pushes into vi'], ['II', 'II7', 'V of V: pushes into V'], ['Isus4', 'Isus4', 'Suspended: floaty, unresolved']],
    },
    minor: {
      dia: [['i', 'i7'], ['ii°', 'iiø7'], ['III', 'IIImaj7'], ['iv', 'iv7'], ['v', 'v7'], ['VI', 'VImaj7'], ['VII', 'VII7']],
      col: [['V', 'V7', 'Harmonic minor: strong pull to i'], ['IV', 'IV7', 'Dorian: brighter, lifted'], ['bII', 'bIImaj7', 'Neapolitan: dark drama'], ['I', 'Imaj7', 'Picardy: surprise major'], ['isus4', 'isus4', 'Suspended: floaty'], ['III+', 'III+', 'Augmented: eerie tension']],
    },
  };
  const FUNC_OF = [['T', 'var(--fT)'], ['S', 'var(--fS)'], ['T', 'var(--fT)'], ['S', 'var(--fS)'], ['D', 'var(--fD)'], ['T', 'var(--fT)'], ['D', 'var(--fD)']];
  const cur = s => CR.sev ? s.r7 : s.r3;
  function pairFor(r) {
    for (const m of ['major', 'minor']) for (const g of ['dia', 'col']) { const p = PADS[m][g].find(x => x[0] === r || x[1] === r); if (p && m === CR.mode) return { r3: p[0], r7: p[1] }; }
    const r3 = r.replace(/maj7$/, '').replace(/ø7$/, '°').replace(/°7$/, '°').replace(/7$/, '');
    const p = PADS[CR.mode].dia.concat(PADS[CR.mode].col).find(x => x[0] === r3);
    return { r3, r7: p ? p[1] : r };
  }
  const chordOf = r => parseRoman(r, CR.root, CR.mode);
  const pushHist = () => { CR.hist.push(JSON.stringify({ slots: CR.slots, sev: CR.sev, mode: CR.mode })); if (CR.hist.length > 40) CR.hist.shift(); };

  // ---------------- voicing ----------------
  function bestVoicing(notes, prev) {
    let best = null;
    for (let k = 0; k < notes.length; k++) {
      const rot = notes.slice(k).concat(notes.slice(0, k));
      for (const base of [48, 60]) {
        const v = mids(voice(rot, base)); if (Math.min(...v) < 50 || Math.max(...v) > 81) continue;
        const cost = v.reduce((s, m) => s + Math.min(...prev.map(p => Math.abs(p - m))), 0) + prev.reduce((s, p) => s + Math.min(...v.map(m => Math.abs(p - m))), 0);
        if (!best || cost < best.cost) best = { v, cost };
      }
    }
    return best ? best.v : mids(voice(notes, 55));
  }
  function voicings() {
    const lead = $('#crLead').checked; let prev = null;
    return CR.slots.map(s => {
      const c = chordOf(cur(s)), n = chordNotes(c.root, c.type);
      const v = !lead || !prev ? mids(voice(n, 55)) : bestVoicing(n, prev);
      prev = v; return { v, c, names: n };
    });
  }

  // ---------------- patterns (positions in 1/16 steps within a bar) ----------------
  const CHORD_RHY = {
    sustain: [[0, 16]], stabs: [[2, 1.5], [6, 1.5], [10, 1.5], [14, 1.5]],
    pulse: [0, 2, 4, 6, 8, 10, 12, 14].map(s => [s, 1.6]), sync: [[0, 3], [3, 3], [6, 4], [10, 2], [12, 4]],
  };
  const BASS_RHY = { root: [[0, 7.5], [8, 7.5]], offbeat: [[2, 1.8], [6, 1.8], [10, 1.8], [14, 1.8]], eighths: [0, 2, 4, 6, 8, 10, 12, 14].map(s => [s, 1.7]), off: [] };
  // Returns note events for one bar: { step, len, midi, track, vel }
  function barEvents(bar, vc) {
    const ev = [], o = bar * 16, rhy = $('#crRhythm').value;
    if (rhy === 'arp') { const up = vc.v.slice().sort((a, b) => a - b); for (let s = 0; s < 16; s++) ev.push({ step: o + s, len: 0.9, midi: up[s % up.length] + (Math.floor(s / up.length) % 2 ? 12 : 0), track: 'chord', vel: 90 }); }
    else for (const [s, l] of CHORD_RHY[rhy]) vc.v.forEach(m => ev.push({ step: o + s, len: l, midi: m, track: 'chord', vel: s % 4 === 0 ? 92 : 80 }));
    const bassM = 36 + pc(vc.c.root);
    for (const [s, l] of BASS_RHY[$('#crBass').value]) ev.push({ step: o + s, len: l, midi: bassM, track: 'bass', vel: 100 });
    if ($('#crDrums').checked) {
      [0, 4, 8, 12].forEach(s => ev.push({ step: o + s, len: 0.5, midi: 36, track: 'drum', vel: 110 }));
      [4, 12].forEach(s => ev.push({ step: o + s, len: 0.5, midi: 39, track: 'drum', vel: 95 }));
      [2, 6, 10, 14].forEach(s => ev.push({ step: o + s, len: 0.5, midi: 42, track: 'drum', vel: 80 }));
    }
    return ev;
  }

  // ---------------- synth ----------------
  let noiseBuf = null;
  function noise() {
    if (!noiseBuf) { const c = Snd.ctx, b = c.createBuffer(1, c.sampleRate * 0.5, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; noiseBuf = b; }
    return noiseBuf;
  }
  const track = (node, end) => CR.nodes.push({ node, end });
  function synth(m, t, dur, vol, kind) {
    const c = Snd.ctx, f = 440 * Math.pow(2, (m - 69) / 12), g = c.createGain(), flt = c.createBiquadFilter(); flt.type = 'lowpass';
    const oscs = [];
    const add = (type, det = 0, gain = 1) => { const o = c.createOscillator(), og = c.createGain(); o.type = type; o.frequency.value = f; o.detune.value = det; og.gain.value = gain; o.connect(og); og.connect(flt); oscs.push(o); };
    let atk = 0.01, rel = 0.25;
    if (kind === 'pad') { add('sawtooth', -9, 0.5); add('sawtooth', 9, 0.5); add('triangle', 0, 0.6); flt.frequency.value = 1700; atk = 0.09; rel = 0.4; }
    else if (kind === 'pluck') { add('square', 0, 0.5); add('sawtooth', 6, 0.4); flt.frequency.setValueAtTime(4500, t); flt.frequency.exponentialRampToValueAtTime(350, t + 0.25); atk = 0.004; dur = Math.min(dur, 0.35); rel = 0.12; }
    else if (kind === 'bass') { add('sine', 0, 1); add('triangle', 0, 0.35); flt.frequency.value = 500; atk = 0.006; rel = 0.08; }
    else { add('triangle', 0, 1); add('sawtooth', 7, 0.12); flt.frequency.setValueAtTime(Math.min(f * 8, 9000), t); flt.frequency.exponentialRampToValueAtTime(Math.max(f * 2, 400), t + Math.max(dur, 0.3)); }
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + atk); g.gain.setValueAtTime(vol, t + Math.max(atk, dur - 0.02)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + rel);
    flt.connect(g); g.connect(Snd.master);
    oscs.forEach(o => { o.start(t); o.stop(t + dur + rel + 0.05); track(o, t + dur + rel + 0.05); });
  }
  function drum(m, t) {
    const c = Snd.ctx;
    if (m === 36) {
      const o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
      g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.35); o.connect(g); g.connect(Snd.master); o.start(t); o.stop(t + 0.4); track(o, t + 0.4);
    } else {
      const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = noise();
      if (m === 42) { f.type = 'highpass'; f.frequency.value = 7500; g.gain.setValueAtTime(0.13, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.07); }
      else { f.type = 'bandpass'; f.frequency.value = 1300; f.Q.value = 0.8; g.gain.setValueAtTime(0.4, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.2); }
      s.connect(f); f.connect(g); g.connect(Snd.master); s.start(t); s.stop(t + 0.25); track(s, t + 0.25);
    }
  }

  // ---------------- transport ----------------
  const stepDur = () => 60 / (+$('#crBpm').value || 124) / 4;
  function scheduleLoop() {
    const t0 = CR.next, sd = stepDur(), vcs = voicings(), timbre = $('#crTimbre').value;
    vcs.forEach((vc, bar) => barEvents(bar, vc).forEach(e => {
      const t = t0 + e.step * sd;
      if (e.track === 'drum') drum(e.midi, t);
      else synth(e.midi, t, e.len * sd, e.track === 'bass' ? 0.32 : (timbre === 'pad' ? 0.16 : 0.2) / Math.sqrt(vc.v.length), e.track === 'bass' ? 'bass' : timbre);
    }));
    CR.loops.push({ t0, bar: 16 * sd, vcs }); if (CR.loops.length > 3) CR.loops.shift();
    CR.next = t0 + vcs.length * 16 * sd;
  }
  function tick() {
    const now = Snd.ctx.currentTime;
    if (!CR.slots.length) return stop();
    if (now > CR.next - 0.3) scheduleLoop();
    const L = CR.loops.filter(l => l.t0 <= now).pop(); if (!L) return;
    const bar = Math.min(L.vcs.length - 1, Math.floor((now - L.t0) / L.bar));
    if (bar !== CR.cur || L !== CR.curL) {
      CR.cur = bar; CR.curL = L; highlight(bar);
      const vc = L.vcs[bar];
      if (TAB === 'create') { exPiano.clear(); exPiano.mark(vc.v.map(m => ({ midi: m, label: vc.names.find(n => pc(n) === m % 12) })), 'ans'); }
    }
    if (CR.nodes.length > 400) CR.nodes = CR.nodes.filter(n => n.end > now);
  }
  function play() {
    if (!CR.slots.length) return tip('Add some chords first: click the pads above, or hit 🎲 Inspire me.');
    Snd.ensure(); CR.playing = true; CR.next = Snd.ctx.currentTime + 0.1; CR.loops = []; CR.cur = -1;
    scheduleLoop(); CR.timer = setInterval(tick, 30); $('#crPlay').textContent = '■ Stop';
  }
  function stop() {
    clearInterval(CR.timer); CR.timer = null; CR.playing = false;
    CR.nodes.forEach(n => { try { n.node.stop(); } catch (e) { } }); CR.nodes = []; CR.loops = [];
    $('#crPlay').textContent = '▶ Play'; highlight(-1);
  }
  const restartIfPlaying = () => { if (CR.playing) { stop(); play(); } };

  // ---------------- MIDI export (Standard MIDI File, format 1) ----------------
  function exportMidi() {
    if (!CR.slots.length) return tip('Add some chords first.');
    const PPQ = 480, TPS = PPQ / 4, bpm = +$('#crBpm').value || 124, vcs = voicings();
    const all = vcs.flatMap((vc, bar) => barEvents(bar, vc));
    const vlq = n => { const b = [n & 0x7f]; while ((n >>= 7)) b.unshift((n & 0x7f) | 0x80); return b; };
    const u32 = n => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
    const text = (type, s) => { const b = [...new TextEncoder().encode(s)]; return [0xFF, type, ...vlq(b.length), ...b]; };
    const trk = (name, evs, ch) => {
      const list = [];
      evs.forEach(e => {
        const on = Math.round(e.step * TPS), off = Math.max(on + 1, Math.round((e.step + e.len) * TPS));
        list.push({ tick: on, o: 1, b: [0x90 | ch, e.midi, e.vel] }, { tick: off, o: 0, b: [0x80 | ch, e.midi, 0] });
      });
      list.sort((a, b) => a.tick - b.tick || a.o - b.o);
      let last = 0; const data = [0, ...text(0x03, name)];
      list.forEach(e => { data.push(...vlq(e.tick - last), ...e.b); last = e.tick; });
      data.push(0, 0xFF, 0x2F, 0); return [0x4D, 0x54, 0x72, 0x6B, ...u32(data.length), ...data];
    };
    const us = Math.round(60e6 / bpm);
    const tempo = [0, ...text(0x03, 'Theory Lab'), 0, 0xFF, 0x51, 0x03, (us >> 16) & 255, (us >> 8) & 255, us & 255, 0, 0xFF, 0x58, 0x04, 4, 2, 24, 8, 0, 0xFF, 0x2F, 0];
    const tracks = [[0x4D, 0x54, 0x72, 0x6B, ...u32(tempo.length), ...tempo], trk('Chords', all.filter(e => e.track === 'chord'), 0)];
    if (all.some(e => e.track === 'bass')) tracks.push(trk('Bass', all.filter(e => e.track === 'bass'), 1));
    if (all.some(e => e.track === 'drum')) tracks.push(trk('Drums', all.filter(e => e.track === 'drum'), 9));
    const bytes = new Uint8Array([0x4D, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 1, 0, tracks.length, (PPQ >> 8) & 255, PPQ & 255, ...tracks.flat()]);
    const name = `${CR.root}${CR.mode === 'minor' ? 'm' : ''}_${CR.slots.map(cur).join('-')}_${bpm}bpm.mid`.replace(/♭/g, 'b').replace(/°/g, 'dim').replace(/ø/g, 'hd').replace(/[^\w#.+-]/g, '');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([bytes], { type: 'audio/midi' })); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    tip(`⤓ Exported <b>${name}</b>: separate Chords, Bass${$('#crDrums').checked ? ' and Drums (GM: kick 36, clap 39, hat 42)' : ''} tracks at ${bpm} BPM. Drag it into Ableton and swap in your own sounds.`, true);
  }

  // ---------------- spice it ----------------
  function spice() {
    if (!CR.slots.length) return tip('Load or build a loop first, then spice it.');
    const rs = CR.slots.map(s => s.r3), n = rs.length, opts = [];
    rs.forEach((r, i) => {
      const next = rs[(i + 1) % n];
      if (CR.mode === 'major') {
        if (r === 'IV') opts.push({ i, to: 'iv', msg: 'Swapped <b>IV → iv</b> (borrowed from the parallel minor). Lowering one note adds a bittersweet, melancholic pang.' });
        if (r === 'V') opts.push({ i, to: 'bVII', msg: 'Swapped <b>V → ♭VII</b> (borrowed). A softer, heroic way back to I instead of the strong V pull.' });
        if (r === 'I' && i > 0) opts.push({ i, to: 'bVI', msg: 'Swapped a <b>I → ♭VI</b> (borrowed from minor): an epic, cinematic shift.' });
        if (next === 'vi' && r !== 'vi') opts.push({ i, to: 'III', msg: 'Changed the chord before vi into <b>III</b>, the V of vi (a <b>secondary dominant</b>). Its raised note pulls hard into vi.' });
        if (next === 'V' && r !== 'V') opts.push({ i, to: 'II', msg: 'Changed the chord before V into <b>II</b>, the V of V (a <b>secondary dominant</b>) that pushes into V.' });
      } else {
        if (r === 'v') opts.push({ i, to: 'V', msg: 'Swapped <b>v → V</b> using harmonic minor. The raised 7th (leading tone) pulls strongly back to i.' });
        if (r === 'iv') opts.push({ i, to: 'IV', msg: 'Swapped <b>iv → IV</b> (Dorian / borrowed). One raised note lifts the loop, the Ghosts N Stuff trick.' });
        if (r === 'VII' && next === 'i') opts.push({ i, to: 'V', msg: 'Swapped the <b>VII → V</b> right before i. The major V (harmonic minor) gives a stronger pull home.' });
        if (r === 'VI' && i > 0) opts.push({ i, to: 'bII', msg: 'Swapped <b>VI → ♭II</b> (Neapolitan): dark, dramatic colour.' });
      }
    });
    if (!CR.sev) opts.push({ sev: true, msg: 'Turned on <b>7th chords</b>: every chord gains a 4th note for a richer, deeper sound.' });
    if (!opts.length) return tip('Nothing obvious to spice here. Try 🎲 Inspire me, or add a colour chord yourself.');
    const o = R.pick(opts); pushHist();
    if (o.sev) { CR.sev = true; $('#crSev').checked = true; } else CR.slots[o.i] = pairFor(o.to);
    render(); tip('✨ ' + o.msg, true);
  }

  // ---------------- UI ----------------
  let spiceMsg = '';
  function tip(html, spiceTip) { spiceMsg = html; renderTips(spiceTip); }
  function highlight(bar) { $$('#crSlots .slot').forEach((s, i) => s.classList.toggle('playing', i === bar)); }
  function addChord(pair) {
    if (CR.slots.length >= 8) return tip('A loop can hold up to 8 chords. Remove one first.');
    pushHist(); CR.slots.push({ r3: pair[0], r7: pair[1] }); render();
    const c = chordOf(CR.sev ? pair[1] : pair[0]), v = mids(voice(chordNotes(c.root, c.type), 55));
    if (!CR.playing) { Snd.play(EV.chord(v, 0, 1.1)); exPiano.clear(); exPiano.mark(v.map(m => ({ midi: m })), 'ans'); }
  }
  function padHTML(p, colour) {
    const r = CR.sev ? p[1] : p[0], c = chordOf(r), deg = c.deg;
    return `<button data-p='${JSON.stringify(p.slice(0, 2))}' style="${colour ? '' : `--fc:${FUNC_OF[deg][1]}`}" title="${colour ? p[2] : ['Tonic (home)', 'Subdominant', 'Tonic', 'Subdominant', 'Dominant (tension)', 'Tonic', 'Dominant'][deg]}"><b>${romanLabel(r)}</b><span>${chordSym(c.root, c.type)}</span></button>`;
  }
  function renderTips(isSpice) {
    const out = [];
    if (spiceMsg) out.push(`<div class="tip ${isSpice ? 'spice' : ''}">${spiceMsg}</div>`);
    const rs = CR.slots.map(cur);
    if (rs.length) {
      const fs = rs.map(r => { const c = chordOf(r), col = !isDiatonicRoman(r, CR.root, CR.mode); return col ? ['✦', '#e879f9'] : FUNC_OF[c.deg]; });
      out.push(`<div class="tip"><div class="fseq"><span class="muted small">Function:</span>${fs.map((f, i) => `<i style="background:${f[1]}">${romanLabel(rs[i])} ${f[0]}</i>`).join('')}</div><div class="muted small" style="margin-top:4px">T = home · S = moving away · D = tension · ✦ = colour (borrowed or secondary) chord</div></div>`);
      const first = chordOf(rs[0]), last = chordOf(rs[rs.length - 1]), lastF = isDiatonicRoman(rs[rs.length - 1], CR.root, CR.mode) ? FUNC_OF[last.deg][0] : '✦';
      const ins = [];
      if (rs.length < 3) ins.push('Add 3–4 chords for a full loop.');
      if (first.deg !== 0) ins.push('Starts away from home, so it feels like it\'s searching. Landing on the tonic later feels like release.');
      if (lastF === 'D') ins.push('Ends on tension (dominant), so the loop pulls strongly back to the start. Great for build-ups.');
      if (fs.every(f => f[0] === 'T')) ins.push('Only home-type chords: calm but static. Try adding a IV/iv (S) or V (D) for motion.');
      if (fs.some(f => f[0] === '✦')) ins.push('Your ✦ colour chord is where the emotion comes from. Try the loop without it to hear the difference.');
      const pent = scaleNotes(CR.root, CR.mode === 'minor' ? 'minorPent' : 'majorPent');
      ins.push(`Melody idea: the <b>${disp(CR.root)} ${CR.mode} pentatonic</b> (${listFmt(pent)}) sounds good over every chord here. Land on chord tones on beat 1.`);
      out.push(...ins.map(t => `<div class="tip">${t}</div>`));
    }
    $('#crTips').innerHTML = out.join('');
  }
  function render() {
    $('#crRoot').value = CR.root; $$('#crMode button').forEach(b => b.classList.toggle('active', b.dataset.m === CR.mode)); $('#crSev').checked = CR.sev;
    $('#crPads').innerHTML = PADS[CR.mode].dia.map(p => padHTML(p, false)).join('');
    $('#crColor').innerHTML = PADS[CR.mode].col.map(p => padHTML(p, true)).join('');
    $$('#crPads button, #crColor button').forEach(b => b.onclick = () => addChord(JSON.parse(b.dataset.p)));
    $('#crSlots').innerHTML = range(0, 7).map(i => {
      const s = CR.slots[i]; if (!s) return `<div class="slot">${i === CR.slots.length ? '+' : ''}</div>`;
      const r = cur(s), c = chordOf(r), col = !isDiatonicRoman(r, CR.root, CR.mode);
      return `<div class="slot filled ${col ? 'colour' : ''}" data-i="${i}" style="--fc:${col ? '#e879f9' : FUNC_OF[c.deg][1]}" title="Click to remove"><b>${romanLabel(r)}</b><span>${chordSym(c.root, c.type)}</span></div>`;
    }).join('');
    $$('#crSlots .slot.filled').forEach(el => el.onclick = () => { pushHist(); CR.slots.splice(+el.dataset.i, 1); render(); });
    $('#crLib').innerHTML = PROG_LIB.map((p, i) => `<button data-i="${i}"><span class="ln">${p.name}<small>${p.mood} · ${p.mode}</small></span><span class="lr">${progLabel(p.romans)}</span></button>`).join('');
    $$('#crLib button').forEach(b => b.onclick = () => loadLib(PROG_LIB[+b.dataset.i]));
    renderTips(false);
  }
  function loadLib(p, msg) {
    pushHist(); CR.mode = p.mode; CR.sev = p.romans.some(r => /7/.test(r)); CR.slots = p.romans.map(pairFor);
    spiceMsg = `${msg || '📂'} <b>${p.name}</b> (${progLabel(p.romans)}): ${p.why}`; render(); renderTips(true);
  }
  function load({ tonic, mode, romans }) {
    stop(); CR.root = ROOTS.includes(tonic) ? tonic : DEFAULT_NAMES[pc(tonic)]; CR.mode = mode;
    const lib = PROG_LIB.find(p => p.mode === mode && p.romans.join() === romans.join());
    if (lib) loadLib(lib, '🎓 From your practice:');
    else { pushHist(); CR.sev = romans.some(r => /7/.test(r)); CR.slots = romans.map(pairFor); spiceMsg = `🎓 From your practice: ${progLabel(romans)} in ${keyName(CR.root, mode)}.`; render(); renderTips(true); }
    showTab('create');
  }

  // ---------------- wiring ----------------
  $('#crRoot').innerHTML = ROOTS.map(r => `<option value="${r}">${disp(r)}</option>`).join('');
  $('#crRoot').onchange = e => { CR.root = e.target.value; render(); restartIfPlaying(); };
  $$('#crMode button').forEach(b => b.onclick = () => {
    if (b.dataset.m === CR.mode) return; pushHist(); const old = CR.mode; CR.mode = b.dataset.m;
    // keep the loop: map each chord to the same degree's diatonic chord in the new mode
    CR.slots = CR.slots.map(s => { const d = chordOf(s.r3) ? parseRoman(s.r3, CR.root, old).deg : 0; const p = PADS[CR.mode].dia[d]; return { r3: p[0], r7: p[1] }; });
    render(); restartIfPlaying();
  });
  $('#crSev').onchange = e => { pushHist(); CR.sev = e.target.checked; render(); };
  $('#crPlay').onclick = () => CR.playing ? stop() : play();
  $('#crClear').onclick = () => { pushHist(); CR.slots = []; spiceMsg = ''; render(); };
  $('#crUndo').onclick = () => { const h = CR.hist.pop(); if (!h) return; const o = JSON.parse(h); CR.slots = o.slots; CR.sev = o.sev; CR.mode = o.mode; render(); };
  $('#crInspire').onclick = () => { const pool = PROG_LIB.filter(p => p.mode === CR.mode && p.romans.join() !== CR.slots.map(cur).join()); loadLib(R.pick(pool), '🎲'); if (!CR.playing) play(); };
  $('#crSpice').onclick = () => spice();
  $('#crExport').onclick = () => exportMidi();
  ['#crBpm', '#crTimbre', '#crRhythm', '#crBass', '#crDrums', '#crLead'].forEach(s => $(s).addEventListener('change', restartIfPlaying));
  $$('.tab').forEach(b => b.addEventListener('click', () => { if (b.dataset.tab !== 'create') stop(); if (b.dataset.tab === 'explore') renderEx(); }));

  render();
  return { load, stop, state: CR };
})();
