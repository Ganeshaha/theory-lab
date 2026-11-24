'use strict';
/* =====================================================================
   THEORY ENGINE + RANDOM QUESTION GENERATORS (no DOM in this file)
   ===================================================================== */

// ---------- utilities ----------
const R = {
  int: (a, b) => a + Math.floor(Math.random() * (b - a + 1)),
  pick: a => a[Math.floor(Math.random() * a.length)],
  shuffle: a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
  sample: (a, n) => R.shuffle(a).slice(0, n),
  chance: p => Math.random() < p,
};
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

// ---------- notes ----------
const LETTERS = 'CDEFGAB', NAT = [0, 2, 4, 5, 7, 9, 11];
const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const DEFAULT_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const ALL_NOTE_NAMES = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];
const isBlackPc = p => [1, 3, 6, 8, 10].includes(((p % 12) + 12) % 12);

function parseNote(n) {
  const L = LETTERS.indexOf(n[0]); let acc = 0;
  for (const c of n.slice(1)) { if (c === '#') acc++; else if (c === 'b') acc--; }
  return { L, acc, pc: (((NAT[L] + acc) % 12) + 12) % 12 };
}
const pc = n => parseNote(n).pc;
const mkName = (L, acc) => LETTERS[L] + (acc > 0 ? '#'.repeat(acc) : 'b'.repeat(-acc));
const disp = n => n[0] + n.slice(1).replace(/#/g, '♯').replace(/b/g, '♭');
const pcLabel = p => isBlackPc(p) ? `${disp(SHARP_NAMES[p])}/${disp(FLAT_NAMES[p])}` : SHARP_NAMES[p];
const PC_LABELS = range(0, 11).map(pcLabel);
const listFmt = arr => arr.map(disp).join(' – ');
const listKey = arr => arr.map(pc).join(',');
function alter(n, d) { const p = parseNote(n); return mkName(p.L, p.acc + d); }
const simple = n => Math.abs(parseNote(n).acc) > 1 ? DEFAULT_NAMES[pc(n)] : n;

// ---------- intervals: [semitones, letter steps] ----------
const IV = {
  P1: [0, 0], m2: [1, 1], M2: [2, 1], A2: [3, 1], m3: [3, 2], M3: [4, 2], P4: [5, 3], A4: [6, 3], d5: [6, 4],
  P5: [7, 4], A5: [8, 4], m6: [8, 5], M6: [9, 5], d7: [9, 6], m7: [10, 6], M7: [11, 6], P8: [12, 7],
  m9: [13, 8], M9: [14, 8], A9: [15, 8], P11: [17, 10], A11: [18, 10], m13: [20, 12], M13: [21, 12],
};
function tr(n, id) {
  const [s, st] = IV[id]; const p = parseNote(n);
  const L2 = (p.L + st) % 7, target = (p.pc + s) % 12;
  let acc = target - NAT[L2]; while (acc > 6) acc -= 12; while (acc < -6) acc += 12;
  if (Math.abs(acc) > 1) return DEFAULT_NAMES[target];
  return mkName(L2, acc);
}
const INTS = [
  { id: 'm2', name: 'minor 2nd', s: 1 }, { id: 'M2', name: 'Major 2nd', s: 2 }, { id: 'm3', name: 'minor 3rd', s: 3 },
  { id: 'M3', name: 'Major 3rd', s: 4 }, { id: 'P4', name: 'Perfect 4th', s: 5 }, { id: 'A4', name: 'Tritone (aug 4th / dim 5th)', s: 6 },
  { id: 'P5', name: 'Perfect 5th', s: 7 }, { id: 'm6', name: 'minor 6th', s: 8 }, { id: 'M6', name: 'Major 6th', s: 9 },
  { id: 'm7', name: 'minor 7th', s: 10 }, { id: 'M7', name: 'Major 7th', s: 11 }, { id: 'P8', name: 'Octave', s: 12 },
];
const INT_BY = Object.fromEntries(INTS.map(i => [i.id, i]));

// ---------- scales ----------
const SCALES = {
  major: { name: 'Major (Ionian)', iv: ['P1', 'M2', 'M3', 'P4', 'P5', 'M6', 'M7'] },
  minor: { name: 'Natural Minor (Aeolian)', iv: ['P1', 'M2', 'm3', 'P4', 'P5', 'm6', 'm7'] },
  harmonicMinor: { name: 'Harmonic Minor', iv: ['P1', 'M2', 'm3', 'P4', 'P5', 'm6', 'M7'] },
  melodicMinor: { name: 'Melodic Minor', iv: ['P1', 'M2', 'm3', 'P4', 'P5', 'M6', 'M7'] },
  dorian: { name: 'Dorian', iv: ['P1', 'M2', 'm3', 'P4', 'P5', 'M6', 'm7'] },
  phrygian: { name: 'Phrygian', iv: ['P1', 'm2', 'm3', 'P4', 'P5', 'm6', 'm7'] },
  lydian: { name: 'Lydian', iv: ['P1', 'M2', 'M3', 'A4', 'P5', 'M6', 'M7'] },
  mixolydian: { name: 'Mixolydian', iv: ['P1', 'M2', 'M3', 'P4', 'P5', 'M6', 'm7'] },
  locrian: { name: 'Locrian', iv: ['P1', 'm2', 'm3', 'P4', 'd5', 'm6', 'm7'] },
  majorPent: { name: 'Major Pentatonic', iv: ['P1', 'M2', 'M3', 'P5', 'M6'] },
  minorPent: { name: 'Minor Pentatonic', iv: ['P1', 'm3', 'P4', 'P5', 'm7'] },
  blues: { name: 'Blues Scale', iv: ['P1', 'm3', 'P4', 'd5', 'P5', 'm7'] },
  phrygianDominant: { name: 'Phrygian Dominant', iv: ['P1', 'm2', 'M3', 'P4', 'P5', 'm6', 'm7'] },
  hungarianMinor: { name: 'Hungarian Minor', iv: ['P1', 'M2', 'm3', 'A4', 'P5', 'm6', 'M7'] },
  doubleHarmonic: { name: 'Double Harmonic (Arabic)', iv: ['P1', 'm2', 'M3', 'P4', 'P5', 'm6', 'M7'] },
  wholeTone: { name: 'Whole Tone', iv: ['P1', 'M2', 'M3', 'A4', 'A5', 'm7'] },
  octatonic: { name: 'Diminished (Half–Whole)', iv: ['P1', 'm2', 'm3', 'M3', 'A4', 'P5', 'M6', 'm7'] },
  hirajoshi: { name: 'Hirajoshi (Japanese)', iv: ['P1', 'M2', 'm3', 'P5', 'm6'] },
};
const scaleNotes = (root, id) => SCALES[id].iv.map(i => tr(root, i));
const scaleSemis = id => SCALES[id].iv.map(i => IV[i][0]);
function stepPattern(id) {
  const s = scaleSemis(id).concat(12);
  return s.slice(1).map((v, i) => ({ 1: 'H', 2: 'W', 3: 'W+H', 4: '2W' }[v - s[i]] || (v - s[i]))).join('–');
}
const MODES = ['major', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'minor', 'locrian'];
const MODE_NAMES = { major: 'Ionian', dorian: 'Dorian', phrygian: 'Phrygian', lydian: 'Lydian', mixolydian: 'Mixolydian', minor: 'Aeolian', locrian: 'Locrian' };
const MODE_DESC = {
  major: 'the plain major scale', dorian: 'a minor scale with a raised 6th', phrygian: 'a minor scale with a lowered 2nd',
  lydian: 'a major scale with a raised 4th', mixolydian: 'a major scale with a lowered 7th', minor: 'the plain natural minor scale',
  locrian: 'a minor scale with a lowered 2nd AND lowered 5th',
};
const MODE_OFFSET = { major: 'P1', dorian: 'M2', phrygian: 'M3', lydian: 'P4', mixolydian: 'P5', minor: 'M6', locrian: 'M7' };
const MODE_CHAR = { dorian: ['M6', 'raised 6th'], phrygian: ['m2', 'lowered 2nd'], lydian: ['A4', 'raised 4th'], mixolydian: ['m7', 'lowered 7th'], locrian: ['d5', 'lowered 5th'] };

// ---------- chords ----------
const CHORDS = {
  maj: { sym: '', name: 'major', iv: ['P1', 'M3', 'P5'] },
  min: { sym: 'm', name: 'minor', iv: ['P1', 'm3', 'P5'] },
  dim: { sym: '°', name: 'diminished', iv: ['P1', 'm3', 'd5'] },
  aug: { sym: '+', name: 'augmented', iv: ['P1', 'M3', 'A5'] },
  sus2: { sym: 'sus2', name: 'suspended 2nd', iv: ['P1', 'M2', 'P5'] },
  sus4: { sym: 'sus4', name: 'suspended 4th', iv: ['P1', 'P4', 'P5'] },
  pow: { sym: '5', name: 'power chord', iv: ['P1', 'P5'] },
  maj7: { sym: 'maj7', name: 'major 7th', iv: ['P1', 'M3', 'P5', 'M7'] },
  dom7: { sym: '7', name: 'dominant 7th', iv: ['P1', 'M3', 'P5', 'm7'] },
  min7: { sym: 'm7', name: 'minor 7th', iv: ['P1', 'm3', 'P5', 'm7'] },
  hdim7: { sym: 'ø7', name: 'half-diminished 7th (m7♭5)', iv: ['P1', 'm3', 'd5', 'm7'] },
  dim7: { sym: '°7', name: 'fully diminished 7th', iv: ['P1', 'm3', 'd5', 'd7'] },
  mM7: { sym: 'm(maj7)', name: 'minor-major 7th ("Psycho Chord")', iv: ['P1', 'm3', 'P5', 'M7'] },
  sus7: { sym: '7sus4', name: 'dominant 7th sus4', iv: ['P1', 'P4', 'P5', 'm7'] },
  six: { sym: '6', name: 'major 6th', iv: ['P1', 'M3', 'P5', 'M6'] },
  m6: { sym: 'm6', name: 'minor 6th', iv: ['P1', 'm3', 'P5', 'M6'] },
  add9: { sym: 'add9', name: 'add 9', iv: ['P1', 'M3', 'P5', 'M9'] },
  madd9: { sym: 'm(add9)', name: 'minor add 9', iv: ['P1', 'm3', 'P5', 'M9'] },
  maj9: { sym: 'maj9', name: 'major 9th', iv: ['P1', 'M3', 'P5', 'M7', 'M9'] },
  dom9: { sym: '9', name: 'dominant 9th', iv: ['P1', 'M3', 'P5', 'm7', 'M9'] },
  min9: { sym: 'm9', name: 'minor 9th', iv: ['P1', 'm3', 'P5', 'm7', 'M9'] },
  min11: { sym: 'm11', name: 'minor 11th', iv: ['P1', 'm3', 'P5', 'm7', 'M9', 'P11'] },
  dom13: { sym: '13', name: 'dominant 13th', iv: ['P1', 'M3', 'P5', 'm7', 'M9', 'M13'] },
};
const TRIADS = ['maj', 'min', 'dim', 'aug'];
const SEVENTHS = ['maj7', 'dom7', 'min7', 'hdim7', 'dim7', 'mM7'];
const EXTS = ['add9', 'maj9', 'dom9', 'min9', 'six', 'm6', 'min11', 'dom13'];
const chordNotes = (root, t) => CHORDS[t].iv.map(i => tr(root, i));
const chordSym = (root, t) => disp(root) + CHORDS[t].sym;
const chordFull = (root, t) => TRIADS.includes(t) ? `${disp(root)} ${CHORDS[t].name}` : chordSym(root, t);

function detectType(notes) {
  const r = pc(notes[0]); const sig = notes.map(n => (pc(n) - r + 12) % 12).join(',');
  for (const [id, c] of Object.entries(CHORDS)) if (c.iv.map(i => IV[i][0] % 12).join(',') === sig) return id;
  return null;
}
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
function roman(i, t) {
  const lower = ['min', 'dim', 'min7', 'hdim7', 'dim7', 'mM7'].includes(t);
  const base = lower ? ROMAN[i].toLowerCase() : ROMAN[i];
  const suf = { dim: '°', aug: '+', maj7: 'maj7', dom7: '7', min7: '7', hdim7: 'ø7', dim7: '°7', mM7: '(maj7)' }[t] || '';
  return base + suf;
}
function diatonic(root, scaleId, seventh = false) {
  const s = scaleNotes(root, scaleId);
  return s.map((n, i) => {
    const notes = [s[i], s[(i + 2) % 7], s[(i + 4) % 7]]; if (seventh) notes.push(s[(i + 6) % 7]);
    const type = detectType(notes);
    return { root: n, notes, type, degree: i, roman: roman(i, type) };
  });
}
function keySig(majorRoot) {
  const s = scaleNotes(majorRoot, 'major');
  const sh = s.filter(n => n.includes('#')).length, fl = s.filter(n => n.slice(1).includes('b')).length;
  if (sh) return `${sh} sharp${sh > 1 ? 's' : ''}`; if (fl) return `${fl} flat${fl > 1 ? 's' : ''}`; return 'No sharps or flats';
}

// ---------- keys ----------
const MAJOR_KEYS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];
const MINOR_KEYS = ['A', 'E', 'B', 'F#', 'C#', 'G#', 'D', 'G', 'C', 'F', 'Bb', 'Eb'];
const ROOTS = ['C', 'C#', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const DEG_NAMES = ['Tonic', 'Supertonic', 'Mediant', 'Subdominant', 'Dominant', 'Submediant', 'Leading tone'];
const ORD = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th'];

// ---------- piano voicing (MIDI 48..83 = C3..B5) ----------
const LO = 48, HI = 83;
function voice(names, start = 60) {
  let prev = null; const out = [];
  for (const n of names) {
    const p = pc(n); let m;
    if (prev === null) m = start + ((p - start % 12 + 12) % 12);
    else { let d = (p - prev % 12 + 12) % 12; if (d === 0) d = 12; m = prev + d; }
    out.push(m); prev = m;
  }
  let hi = Math.max(...out), lo = Math.min(...out);
  while (hi > HI && lo - 12 >= LO) { for (let i = 0; i < out.length; i++) out[i] -= 12; hi -= 12; lo -= 12; }
  while (lo < LO) { for (let i = 0; i < out.length; i++) out[i] += 12; lo += 12; }
  return out.map((m, i) => ({ midi: m, label: names[i] }));
}
const mids = v => v.map(x => x.midi);
const midiName = m => `${disp(DEFAULT_NAMES[m % 12])}${Math.floor(m / 12) - 1}`;

// ---------- audio event helpers ----------
const EV = {
  chord: (ms, t = 0, d = 1.6) => [{ t, notes: ms, d }],
  arp: (ms, t = 0, step = 0.28, d = 0.6) => ms.map((m, i) => ({ t: t + i * step, notes: [m], d })),
  seq: (chords, t = 0, step = 1.0) => chords.map((ms, i) => ({ t: t + i * step, notes: ms, d: step * 0.95 })),
  arpChord: (ms) => EV.arp(ms).concat(EV.chord(ms, ms.length * 0.28 + 0.15)),
};

// ---------- question helpers ----------
function mc(correct, pool, { n = 4, key = x => x, fmt = x => x } = {}) {
  const chosen = [correct]; const keys = new Set([key(correct)]);
  for (const d of R.shuffle(pool)) { if (chosen.length >= n) break; const k = key(d); if (keys.has(k)) continue; keys.add(k); chosen.push(d); }
  const sh = R.shuffle(chosen); return { options: sh.map(fmt), answer: sh.indexOf(correct) };
}
const noteMC = (correct, pool) => mc(correct, pool, { key: pc, fmt: disp });
const listMC = (correct, pool) => mc(correct, pool, { key: listKey, fmt: listFmt });
function Q(o) { return Object.assign({ type: 'mc', show: [], reveal: null, hideLabels: false, audio: null, explain: '' }, o); }
function PQ(o) { // piano-input question
  return Object.assign({ type: 'piano', show: [], hideLabels: false, audio: null, explain: '' }, o, { target: new Set(o.targetNotes.map(pc)), reveal: voice(o.targetNotes) });
}
function chordQ(root, t) { const v = voice(chordNotes(root, t)); return { v, audio: EV.arpChord(mids(v)) }; }

// =====================================================================
//  TOPICS (mirrors the course outline)
// =====================================================================
const TOPICS = [
  { id: 'keyboard', part: 1, name: 'Keyboard, Semitones & Octaves', hint: 'Understanding theory from an electronic-music perspective' },
  { id: 'fifth', part: 1, name: 'The Perfect 5th & Being "In Key"' },
  { id: 'triads', part: 1, name: 'Keys, the Third & the Basic Triad' },
  { id: 'diatonic', part: 1, name: 'Diatonic Chord Progressions' },
  { id: 'sevenths', part: 1, name: '7th Chords' },
  { id: 'intervals', part: 1, name: 'The Other Intervals (sus / add)' },
  { id: 'minor', part: 2, name: 'Minor Scales & Keys' },
  { id: 'circle', part: 2, name: 'The Circle of Fifths' },
  { id: 'extensions', part: 2, name: 'More Chord Extensions (9/11/13)' },
  { id: 'melody', part: 2, name: 'Melody Writing' },
  { id: 'bass', part: 2, name: 'Bass Lines, Inversions & Slash Chords' },
  { id: 'chromatic', part: 2, name: 'Chromaticism' },
  { id: 'songs', part: 2, name: 'Song Analyses' },
  { id: 'modes', part: 3, name: 'Modes' },
  { id: 'penta', part: 3, name: 'Pentatonic Scales' },
  { id: 'mediants', part: 3, name: 'Chromatic Mediants' },
  { id: 'advanced', part: 3, name: 'Advanced Harmonies (borrowing, sec. dominants)' },
  { id: 'exotic', part: 3, name: 'Exotic Scales' },
  { id: 'progressions', part: 4, name: 'Chord Progressions for Producers' },
  { id: 'rhythm', part: 4, name: 'Rhythm, Tempo & the Grid' },
  { id: 'structure', part: 4, name: 'Song Structure & Arrangement' },
  { id: 'tuning', part: 4, name: 'Pitch, Frequency & Tuning (808s, kicks)' },
  { id: 'voicing', part: 4, name: 'Voicing, Voice Leading & Cadences' },
  { id: 'camelot', part: 4, name: 'Harmonic Mixing (Camelot Wheel)' },
  { id: 'earkey', part: 4, name: 'Ear Training: Notes in a Key' },
  { id: 'ear', part: 4, name: 'Ear Training: Chords & Intervals' },
];
const G = {};

// ---------------- Part 1: keyboard ----------------
G.keyboard = [
  () => {
    const m = R.int(LO, HI), p = m % 12;
    return Q({
      prompt: 'Labels are hidden. What is the name of the <b>highlighted key</b>?', ...mc(PC_LABELS[p], PC_LABELS),
      show: [{ midi: m }], reveal: [{ midi: m }], hideLabels: true, audio: EV.chord([m], 0, 1),
      explain: isBlackPc(p)
        ? `Black keys have two names: ${disp(SHARP_NAMES[p])} (a half step above ${SHARP_NAMES[p - 1]}) or ${disp(FLAT_NAMES[p])} (a half step below ${FLAT_NAMES[p + 1]}).`
        : 'Find C just left of each group of <b>two</b> black keys, then count up the white keys: C D E F G A B.',
    });
  },
  () => {
    const n = R.pick(DEFAULT_NAMES), s = R.pick([1, 2, 3, 4, 5, 7, -1, -2, -3, -5, -7]);
    const p = ((pc(n) + s) % 12 + 12) % 12; const m0 = 60 + pc(n);
    return Q({
      prompt: `Your synth's <b>Semi</b> (transpose) knob is set to <b>${s > 0 ? '+' : ''}${s}</b>. You press <b>${disp(n)}</b>. Which pitch do you actually hear?`,
      ...mc(PC_LABELS[p], PC_LABELS), reveal: [{ midi: m0, label: n }, { midi: m0 + s }], audio: EV.arp([m0, m0 + s], 0, 0.5),
      explain: `Each semitone is one key (white or black). ${disp(n)} ${s > 0 ? 'up' : 'down'} ${Math.abs(s)} semitone${Math.abs(s) > 1 ? 's' : ''} = ${PC_LABELS[p]}.${Math.abs(s) === 7 ? ' (7 semitones = a perfect 5th.)' : ''}`,
    });
  },
  () => {
    const n = R.pick(DEFAULT_NAMES), s = R.pick([12, -12, 24]);
    const opts = ['The same note, one octave higher', 'The same note, one octave lower', 'The same note, two octaves higher', 'A perfect 5th higher'];
    const correct = s === 12 ? opts[0] : s === -12 ? opts[1] : opts[2];
    const m0 = 60 + pc(n) - (s === 24 ? 12 : 0);
    return Q({
      prompt: `The Semi knob is set to <b>${s > 0 ? '+' : ''}${s}</b> and you play <b>${disp(n)}</b>. What do you hear?`, ...mc(correct, opts),
      reveal: [{ midi: m0, label: n }, { midi: Math.min(HI, Math.max(LO, m0 + s)), label: n }], audio: EV.arp([m0, m0 + s], 0, 0.6),
      explain: '12 semitones = 1 octave. Octaves have the same note name and a 2:1 frequency ratio, which is why they sound so similar.',
    });
  },
  () => {
    const a = R.int(48, 71), d = R.int(1, 12), b = a + d;
    return Q({
      prompt: `How many semitones (half steps) is it from <b>${midiName(a)}</b> up to <b>${midiName(b)}</b>?`,
      ...mc(String(d), range(1, 12).map(String)), show: [{ midi: a }, { midi: b }], audio: EV.arp([a, b], 0, 0.5),
      explain: `Count every key, black and white: ${d} semitone${d > 1 ? 's' : ''}.${d === 12 ? ' That is an octave.' : d === 7 ? ' That is a perfect 5th.' : d === 2 ? ' That is a whole step.' : ''}`,
    });
  },
  () => {
    const pairs = [['C#', 'Db'], ['D#', 'Eb'], ['F#', 'Gb'], ['G#', 'Ab'], ['A#', 'Bb'], ['E#', 'F'], ['B#', 'C'], ['Cb', 'B'], ['Fb', 'E']];
    let [a, b] = R.pick(pairs); if (R.chance(0.5)) [a, b] = [b, a];
    return Q({
      prompt: `Which note is <b>enharmonic</b> to (the same key as) <b>${disp(a)}</b>?`, ...noteMC(b, ALL_NOTE_NAMES.concat(['E#', 'B#', 'Cb', 'Fb'])),
      reveal: [{ midi: 60 + pc(a), label: a }], explain: `${disp(a)} and ${disp(b)} are the same physical key, just spelled differently. Spelling depends on the key you are in.`,
    });
  },
  () => {
    const n = R.pick(DEFAULT_NAMES), s = R.pick([1, 2, 1, 2, 3, 4]);
    const opts = ['Half step (1 semitone)', 'Whole step (2 semitones)', 'minor 3rd (3 semitones)', 'Major 3rd (4 semitones)'];
    const m0 = 60 + pc(n);
    return Q({
      prompt: `From <b>${disp(n)}</b> up to <b>${PC_LABELS[(pc(n) + s) % 12]}</b> is a…`, ...mc(opts[s - 1], opts),
      show: [{ midi: m0 }, { midi: m0 + s }], audio: EV.arp([m0, m0 + s], 0, 0.5),
      explain: 'Half step = next key over (often white→white at E–F and B–C). Whole step = skip one key.',
    });
  },
];

// ---------------- Part 1: perfect 5th & in key ----------------
function outsideNote(scale) {
  const pcs = new Set(scale.map(pc)); const c = [];
  for (const n of scale) for (const d of [1, -1]) { const x = alter(n, d); if (Math.abs(parseNote(x).acc) <= 1 && !pcs.has(pc(x)) && !['E#', 'B#', 'Cb', 'Fb'].includes(x)) c.push(x); }
  return R.pick(c);
}
G.fifth = [
  () => {
    const r = R.pick(ROOTS), a = tr(r, 'P5'), v = voice([r, a]);
    return Q({
      prompt: `What note is a <b>perfect 5th above ${disp(r)}</b>?`, ...noteMC(a, ALL_NOTE_NAMES), reveal: v, audio: EV.arp(mids(v), 0, 0.45).concat(EV.chord(mids(v), 1.0)),
      explain: `A perfect 5th = 7 semitones (5 letter names counting the start: ${disp(r)} → ${disp(a)}). It's the power-chord interval and one step clockwise on the circle of fifths.`,
    });
  },
  () => {
    const r = R.pick(ROOTS), b = tr(r, 'P4'), v = voice([b, r]);
    return Q({
      prompt: `What note is a <b>perfect 5th below ${disp(r)}</b>?`, ...noteMC(b, ALL_NOTE_NAMES), reveal: v, audio: EV.arp(mids(v).reverse(), 0, 0.45),
      explain: `Go down 7 semitones from ${disp(r)} and you land on ${disp(b)}. (A 5th down = a 4th up, same note name.)`,
    });
  },
  () => {
    const correct = stepPattern('major');
    return Q({
      prompt: 'Which <b>whole/half-step pattern</b> builds a major scale (W = whole, H = half)?',
      ...mc(correct, ['minor', 'dorian', 'mixolydian', 'lydian', 'phrygian', 'harmonicMinor'].map(stepPattern)),
      explain: 'Major = W–W–H–W–W–W–H. Start that pattern on any key and you get that key\'s major scale. Only C major uses all white keys.',
    });
  },
  () => {
    const K = R.pick(MAJOR_KEYS), s = scaleNotes(K, 'major'), out = outsideNote(s);
    return Q({
      prompt: `Which note is <b>NOT</b> in the key of <b>${disp(K)} major</b>?`, ...noteMC(out, s), reveal: voice(s),
      explain: `${disp(K)} major = ${listFmt(s)}. ${disp(out)} is outside the key.`,
    });
  },
  () => {
    const K = R.pick(MAJOR_KEYS), s = scaleNotes(K, 'major'), i = R.int(1, 6);
    return Q({
      prompt: `What is the <b>${DEG_NAMES[i]}</b> (${ORD[i]} scale degree) of <b>${disp(K)} major</b>?`, ...noteMC(s[i], s.concat(s.map(n => alter(n, 1)))),
      reveal: voice(s), explain: `${disp(K)} major: ${s.map((n, j) => `${j + 1}=${disp(n)}`).join(', ')}. Degree ${i + 1} is the ${DEG_NAMES[i].toLowerCase()}.`,
    });
  },
  () => {
    const K = R.pick(MAJOR_KEYS), s = scaleNotes(K, 'major'), i = R.int(1, 6);
    const lbl = j => `${DEG_NAMES[j]} (${ORD[j]})`;
    return Q({
      prompt: `In <b>${disp(K)} major</b>, the note <b>${disp(s[i])}</b> is which scale degree?`, ...mc(lbl(i), range(0, 6).map(lbl)),
      reveal: voice(s), explain: `${disp(K)} major: ${listFmt(s)}. ${disp(s[i])} is note ${i + 1}: the ${DEG_NAMES[i].toLowerCase()}.`,
    });
  },
  () => {
    const r = R.pick(ROOTS), c = [r, tr(r, 'P5')], v = voice(c);
    return Q({
      prompt: `Which two notes make a <b>${disp(r)}5</b> power chord?`, ...listMC(c, [[r, tr(r, 'P4')], [r, tr(r, 'M3')], [r, tr(r, 'm3')], [r, tr(r, 'd5')], [r, tr(r, 'M6')]]),
      reveal: v, audio: EV.chord(mids(v)), explain: 'A power chord ("5") is just the root + perfect 5th. No 3rd, so it\'s neither major nor minor, which is why it works under distortion.',
    });
  },
];

// ---------------- Part 1: thirds & triads ----------------
const TRIAD_STACK = {
  maj: 'Major 3rd + minor 3rd (4 + 3 semitones)', min: 'minor 3rd + Major 3rd (3 + 4 semitones)',
  dim: 'minor 3rd + minor 3rd (3 + 3 semitones)', aug: 'Major 3rd + Major 3rd (4 + 4 semitones)',
};
const INV_NAMES = ['Root position', '1st inversion', '2nd inversion', '3rd inversion'];
G.triads = [
  () => {
    const r = R.pick(ROOTS), t = R.pick(TRIADS), { v, audio } = chordQ(r, t);
    return Q({
      prompt: 'Name this triad (root is the lowest note).', ...mc(chordFull(r, t), TRIADS.map(x => chordFull(r, x)).concat([chordFull(tr(r, 'M2'), t)])),
      show: v, reveal: v, audio, explain: `${chordFull(r, t)} = ${listFmt(chordNotes(r, t))}. Stacked as ${TRIAD_STACK[t]}.`,
    });
  },
  () => {
    const r = R.pick(ROOTS), t = R.pick(['maj', 'min', 'maj', 'min', 'dim', 'aug']);
    return PQ({
      prompt: `Play a <b>${chordFull(r, t)}</b> triad on the keyboard (any octave or inversion), then press <b>Submit</b>.`,
      targetNotes: chordNotes(r, t), explain: `${chordFull(r, t)} = ${listFmt(chordNotes(r, t))} (${TRIAD_STACK[t]}).`,
    });
  },
  () => {
    const r = R.pick(ROOTS), id = R.pick(['M3', 'm3']), a = tr(r, id), v = voice([r, a]);
    return Q({
      prompt: `What note is a <b>${INT_BY[id].name}</b> above <b>${disp(r)}</b>?`, ...noteMC(a, [tr(r, 'M3'), tr(r, 'm3'), tr(r, 'P4'), tr(r, 'M2'), tr(r, 'P5')]),
      reveal: v, audio: EV.arp(mids(v), 0, 0.45), explain: `${INT_BY[id].name} = ${INT_BY[id].s} semitones. The 3rd decides whether a chord is major (4) or minor (3).`,
    });
  },
  () => {
    const t = R.pick(TRIADS), r = R.pick(['C', 'D', 'F', 'G', 'A']);
    return Q({
      prompt: `How is a <b>${CHORDS[t].name}</b> triad stacked, from bottom to top?`, ...mc(TRIAD_STACK[t], Object.values(TRIAD_STACK)),
      reveal: voice(chordNotes(r, t)), explain: `Example: ${chordFull(r, t)} = ${listFmt(chordNotes(r, t))}.`,
    });
  },
  () => {
    const r = R.pick(ROOTS), t = R.pick(['maj', 'min']), inv = R.int(0, 2), n = chordNotes(r, t);
    const rot = n.slice(inv).concat(n.slice(0, inv)), v = voice(rot);
    return Q({
      prompt: `Notes from low to high: <b>${listFmt(rot)}</b>. This ${chordFull(r, t)} chord is in…`, ...mc(INV_NAMES[inv], INV_NAMES),
      show: v, reveal: v, audio: EV.chord(mids(v)),
      explain: 'Root in the bass = root position. 3rd in the bass = 1st inversion. 5th in the bass = 2nd inversion. Same chord either way, just a different voicing.',
    });
  },
  () => {
    const r = R.pick(ROOTS), t = R.pick(TRIADS), c = chordNotes(r, t);
    return Q({
      prompt: `Which notes spell <b>${chordFull(r, t)}</b>?`, ...listMC(c, TRIADS.map(x => chordNotes(r, x)).concat([chordNotes(tr(r, 'M2'), t)])),
      reveal: voice(c), explain: `${chordFull(r, t)}: root ${disp(c[0])}, 3rd ${disp(c[1])}, 5th ${disp(c[2])}.`,
    });
  },
];

// ---------------- Part 1: diatonic progressions ----------------
const PROGS = [['I', 'V', 'vi', 'IV'], ['I', 'IV', 'V', 'I'], ['ii', 'V', 'I'], ['vi', 'IV', 'I', 'V'], ['I', 'vi', 'IV', 'V'], ['I', 'iii', 'IV', 'V'], ['IV', 'V', 'iii', 'vi'], ['i', 'VI', 'III', 'VII']];
const romanIdx = r => ROMAN.indexOf(r.toUpperCase().replace(/[°+ø7()maj]/g, ''));
function progChords(K, prog) {
  const minor = prog[0] === 'i' || prog[0] === 'iv' || prog[0] === 'VI';
  const d = diatonic(K, minor ? 'minor' : 'major'); return prog.map(r => d[romanIdx(r)]);
}
G.diatonic = [
  () => {
    const K = R.pick(MAJOR_KEYS), d = diatonic(K, 'major'), i = R.int(1, 6), c = d[i];
    const pool = d.filter((_, j) => j !== i).map(x => chordFull(x.root, x.type)).concat(['maj', 'min', 'dim'].filter(t => t !== c.type).map(t => chordFull(c.root, t)));
    return Q({
      prompt: `In the key of <b>${disp(K)} major</b>, what is the <b>${c.roman}</b> chord?`, ...mc(chordFull(c.root, c.type), pool),
      reveal: voice(c.notes), audio: EV.chord(mids(voice(c.notes))),
      explain: `Major-key pattern: I ii iii IV V vi vii° (Maj min min Maj Maj min dim). Degree ${i + 1} of ${disp(K)} major is ${disp(c.root)}, so ${c.roman} = ${chordFull(c.root, c.type)} (${listFmt(c.notes)}).`,
    });
  },
  () => {
    const K = R.pick(MAJOR_KEYS), d = diatonic(K, 'major'), i = R.int(0, 6), c = d[i];
    return Q({
      prompt: `In <b>${disp(K)} major</b>, which Roman numeral is <b>${chordFull(c.root, c.type)}</b>?`, ...mc(c.roman, d.map(x => x.roman)),
      reveal: voice(c.notes), audio: EV.chord(mids(voice(c.notes))), explain: `${disp(c.root)} is degree ${i + 1} of ${disp(K)} major, and the chord is ${CHORDS[c.type].name}, so it's ${c.roman}. (Uppercase = major, lowercase = minor, ° = diminished.)`,
    });
  },
  () => {
    const i = R.int(0, 6), q = ['Major', 'minor', 'minor', 'Major', 'Major', 'minor', 'diminished'][i];
    return Q({
      prompt: `In <b>any</b> major key, the triad built on the <b>${ORD[i]}</b> scale degree is…`, ...mc(q, ['Major', 'minor', 'diminished', 'augmented']),
      explain: 'The diatonic pattern for major keys never changes: Maj – min – min – Maj – Maj – min – dim.',
    });
  },
  () => {
    const K = R.pick(MAJOR_KEYS), d = diatonic(K, 'major'), i = R.int(0, 5), c = d[i];
    const wrong = chordFull(c.root, c.type === 'maj' ? 'min' : 'maj');
    return Q({
      prompt: `Which chord is <b>NOT</b> diatonic to (in the key of) <b>${disp(K)} major</b>?`, ...mc(wrong, d.filter((_, j) => j !== i).map(x => chordFull(x.root, x.type))),
      explain: `The chords of ${disp(K)} major: ${d.map(x => `${x.roman}=${chordSym(x.root, x.type)}`).join(', ')}. ${wrong} has the wrong quality for degree ${i + 1}.`,
    });
  },
  () => {
    const K = R.pick(MAJOR_KEYS), prog = R.pick(PROGS.filter(p => p[0] !== 'i')), cs = progChords(K, prog);
    const fmt = arr => arr.map(c => chordSym(c.root, c.type)).join(' – ');
    const correct = fmt(cs);
    const alt1 = fmt(progChords(tr(K, 'P5'), prog)), alt2 = fmt(progChords(tr(K, 'M2'), prog));
    const j = R.int(0, cs.length - 1); const flipped = cs.map((c, k) => k === j ? { root: c.root, type: c.type === 'maj' ? 'min' : 'maj' } : c);
    return Q({
      prompt: `Play <b>${prog.join(' – ')}</b> in <b>${disp(K)} major</b>. Which chords is that?`, ...mc(correct, [alt1, alt2, fmt(flipped)]),
      audio: EV.seq(cs.map(c => mids(voice(c.notes)))), explain: `In ${disp(K)} major: ${cs.map((c, k) => `${prog[k]} = ${chordSym(c.root, c.type)}`).join(', ')}.`,
    });
  },
];

// ---------------- Part 1: 7th chords ----------------
G.sevenths = [
  () => {
    const r = R.pick(ROOTS), t = R.pick(SEVENTHS), { v, audio } = chordQ(r, t);
    return Q({
      prompt: 'Name this 7th chord (root is the lowest note).', ...mc(chordSym(r, t), SEVENTHS.map(x => chordSym(r, x))),
      show: v, reveal: v, audio, explain: `${chordSym(r, t)} (${CHORDS[t].name}) = ${listFmt(chordNotes(r, t))}.`,
    });
  },
  () => {
    const r = R.pick(ROOTS), t = R.pick(['maj7', 'dom7', 'min7', 'hdim7']);
    return PQ({ prompt: `Play <b>${chordSym(r, t)}</b> (${CHORDS[t].name}) on the keyboard, then press <b>Submit</b>.`, targetNotes: chordNotes(r, t), explain: `${chordSym(r, t)} = ${listFmt(chordNotes(r, t))}.` });
  },
  () => {
    const K = R.pick(MAJOR_KEYS), d = diatonic(K, 'major', true), i = R.int(0, 6), c = d[i];
    return Q({
      prompt: `In <b>${disp(K)} major</b>, what is the <b>${c.roman}</b> chord?`, ...mc(chordSym(c.root, c.type), d.filter((_, j) => j !== i).map(x => chordSym(x.root, x.type)).concat(SEVENTHS.map(t => chordSym(c.root, t)))),
      reveal: voice(c.notes), audio: EV.chord(mids(voice(c.notes))),
      explain: `Diatonic 7ths in major: Imaj7 ii7 iii7 IVmaj7 V7 vi7 viiø7. Here ${c.roman} = ${chordSym(c.root, c.type)} (${listFmt(c.notes)}).`,
    });
  },
  () => {
    const ans = { maj7: 'I and IV', dom7: 'V only', min7: 'ii, iii and vi', hdim7: 'vii only' };
    const t = R.pick(Object.keys(ans));
    return Q({
      prompt: `Using only notes from a major key, which scale degrees produce a <b>${CHORDS[t].name}</b> chord?`, ...mc(ans[t], Object.values(ans).concat(['None of them'])),
      explain: 'Major key 7ths: Imaj7, ii7, iii7, IVmaj7, V7, vi7, viiø7. The dominant 7th only occurs on V, which is why it\'s called "dominant".',
    });
  },
  () => {
    const r = R.pick(ROOTS), c = chordNotes(r, 'mM7');
    return Q({
      prompt: `The <b>minor-major 7th</b> chord, the book's "Psycho Chord", is a minor triad with a major 7th. Which notes make <b>${disp(r)}m(maj7)</b>?`,
      ...listMC(c, ['min7', 'maj7', 'dom7', 'hdim7'].map(t => chordNotes(r, t))), reveal: voice(c), audio: EV.arpChord(mids(voice(c))),
      explain: `${disp(r)} minor (${listFmt(c.slice(0, 3))}) + major 7th ${disp(c[3])}. It never shows up in the diatonic progression; it's an unusual, tense sound (think Bernard Herrmann's Psycho score).`,
    });
  },
  () => {
    const K = R.pick(MAJOR_KEYS), d = diatonic(K, 'major', true), V = d[4];
    const I = diatonic(K, 'major')[0];
    return Q({
      prompt: `In <b>${disp(K)} major</b>, the V7 chord (<b>${chordSym(V.root, V.type)}</b>) most strongly wants to resolve to…`,
      ...mc(chordFull(I.root, 'maj'), [1, 2, 3, 5].map(i => { const c = diatonic(K, 'major')[i]; return chordFull(c.root, c.type); })),
      audio: EV.seq([mids(voice(V.notes, 55)), mids(voice(I.notes, 60))], 0, 1.2),
      explain: `V7 → I is the strongest resolution: the leading tone ${disp(V.notes[1])} rises to ${disp(K)}, and the 7th ${disp(V.notes[3])} falls by step.`,
    });
  },
  () => {
    const K = R.pick(MAJOR_KEYS), V = diatonic(K, 'major', true)[4], n = V.notes;
    return Q({
      prompt: `In <b>${chordSym(V.root, V.type)}</b> (the V7 of ${disp(K)} major), which two notes form the <b>tritone</b> that creates its tension?`,
      ...listMC([n[1], n[3]], [[n[0], n[2]], [n[0], n[1]], [n[2], n[3]], [n[0], n[3]]]), reveal: voice(n),
      explain: `The 3rd (${disp(n[1])}) and 7th (${disp(n[3])}) are 6 semitones apart, a tritone. They pull inward to the root and 3rd of the I chord.`,
    });
  },
];

// ---------------- Part 1: other intervals ----------------
const INV_PAIR = { m2: 'M7', M2: 'm7', m3: 'M6', M3: 'm6', P4: 'P5', P5: 'P4', m6: 'M3', M6: 'm3', m7: 'M2', M7: 'm2' };
G.intervals = [
  () => {
    const r = R.pick(ROOTS), it = R.pick(INTS), b = tr(r, it.id === 'P8' ? 'P1' : it.id);
    const v = voice([r, b]); if (it.id === 'P8') v[1].midi = v[0].midi + 12;
    return Q({
      prompt: 'Name the interval between the two highlighted notes (low → high).', ...mc(it.name, INTS.map(x => x.name)),
      show: v, reveal: v, audio: EV.arp(mids(v), 0, 0.55).concat(EV.chord(mids(v), 1.2)), explain: `${disp(r)} → ${disp(b)} is ${it.s} semitones: a ${it.name}.`,
    });
  },
  () => {
    const r = R.pick(ROOTS), it = R.pick(INTS.slice(0, 11)), b = tr(r, it.id === 'A4' ? R.pick(['A4', 'd5']) : it.id);
    return Q({
      prompt: `What note is a <b>${it.name}</b> above <b>${disp(r)}</b>?`, ...noteMC(b, INTS.slice(0, 11).map(x => tr(r, x.id))),
      reveal: voice([r, b]), audio: EV.arp(mids(voice([r, b])), 0, 0.5), explain: `${it.name} = ${it.s} semitones. ${disp(r)} + ${it.s} = ${disp(b)}.`,
    });
  },
  () => {
    const it = R.pick(INTS);
    return Q({ prompt: `How many semitones are in a <b>${it.name}</b>?`, ...mc(String(it.s), range(1, 12).map(String)), explain: INTS.map(x => `${x.name}: ${x.s}`).join(' · ') });
  },
  () => {
    const id = R.pick(Object.keys(INV_PAIR)), inv = INV_PAIR[id];
    return Q({
      prompt: `If you <b>invert</b> a ${INT_BY[id].name} (move the bottom note up an octave), what interval do you get?`,
      ...mc(INT_BY[inv].name, INTS.map(x => x.name)), explain: 'Inversion rule: the numbers add up to 9 (3rd ↔ 6th, 2nd ↔ 7th, 4th ↔ 5th), and major ↔ minor swap, while perfect stays perfect. The semitones add up to 12.',
    });
  },
  () => {
    const r = R.pick(ROOTS), t = R.pick(['sus2', 'sus4', 'add9', 'sus2', 'sus4']), { v, audio } = chordQ(r, t);
    return Q({
      prompt: 'Name this chord.', ...mc(chordSym(r, t), ['sus2', 'sus4', 'add9', 'maj', 'sus7', 'min'].map(x => chordSym(r, x))),
      show: v, reveal: v, audio, explain: `sus chords replace the 3rd: sus2 uses the 2nd, sus4 the 4th. add9 keeps the 3rd and adds the 9th (the 2nd an octave up). ${chordSym(r, t)} = ${listFmt(chordNotes(r, t))}.`,
    });
  },
  () => {
    const r = R.pick(ROOTS), t = R.pick(['sus2', 'sus4']);
    return PQ({ prompt: `Play <b>${chordSym(r, t)}</b>, then press <b>Submit</b>.`, targetNotes: chordNotes(r, t), explain: `${chordSym(r, t)} = ${listFmt(chordNotes(r, t))}. No 3rd, so it's "suspended" between major and minor.` });
  },
];

// ---------------- Part 2: minor ----------------
G.minor = [
  () => {
    const K = R.pick(MAJOR_KEYS), rel = tr(K, 'M6'), f = x => `${disp(x)} minor`;
    return Q({
      prompt: `What is the <b>relative minor</b> of <b>${disp(K)} major</b>?`, ...mc(f(rel), [K, tr(K, 'P5'), tr(K, 'P4'), tr(K, 'M3'), tr(K, 'M2')].map(f)),
      reveal: voice(scaleNotes(rel, 'minor')), explain: `Start on the 6th degree of ${disp(K)} major: ${disp(rel)}. ${disp(rel)} minor uses exactly the same notes and key signature.`,
    });
  },
  () => {
    const K = R.pick(MINOR_KEYS), rel = tr(K, 'm3'), f = x => `${disp(x)} major`;
    return Q({
      prompt: `What is the <b>relative major</b> of <b>${disp(K)} minor</b>?`, ...mc(f(rel), [K, tr(K, 'P5'), tr(K, 'P4'), tr(K, 'M3'), tr(K, 'M6')].map(f)),
      explain: `Go up a minor 3rd (3 semitones) from ${disp(K)}: ${disp(rel)} major shares all its notes with ${disp(K)} minor.`,
    });
  },
  () => {
    const K = R.pick(MINOR_KEYS), s = scaleNotes(K, 'minor'), i = R.pick([2, 5, 6, 1, 3]);
    return Q({
      prompt: `What is the <b>${ORD[i]}</b> note of <b>${disp(K)} natural minor</b>?`, ...noteMC(s[i], scaleNotes(K, 'major').concat(s)),
      reveal: voice(s), explain: `${disp(K)} minor = ${listFmt(s)}. Compared with major, minor lowers the 3rd, 6th and 7th.`,
    });
  },
  () => {
    const K = R.pick(MINOR_KEYS), d = diatonic(K, 'minor'), i = R.int(1, 6), c = d[i];
    return Q({
      prompt: `In <b>${disp(K)} minor</b>, what is the <b>${c.roman}</b> chord?`, ...mc(chordFull(c.root, c.type), d.filter((_, j) => j !== i).map(x => chordFull(x.root, x.type)).concat(TRIADS.map(t => chordFull(c.root, t)))),
      reveal: voice(c.notes), audio: EV.chord(mids(voice(c.notes))), explain: `Minor-key pattern: i ii° III iv v VI VII (min dim Maj min min Maj Maj). ${c.roman} = ${chordFull(c.root, c.type)}.`,
    });
  },
  () => {
    const i = R.int(0, 6), q = ['minor', 'diminished', 'Major', 'minor', 'minor', 'Major', 'Major'][i];
    return Q({ prompt: `In any <b>natural minor</b> key, the triad on the <b>${ORD[i]}</b> degree is…`, ...mc(q, ['Major', 'minor', 'diminished', 'augmented']), explain: 'Natural minor: min – dim – Maj – min – min – Maj – Maj (the major pattern shifted to start on vi).' });
  },
  () => {
    const K = R.pick(MINOR_KEYS), V = tr(K, 'P5');
    return Q({
      prompt: `Using <b>${disp(K)} harmonic minor</b> (raised 7th), the v chord becomes major. What is it?`, ...mc(chordFull(V, 'maj'), [chordFull(V, 'min'), chordFull(tr(K, 'm7'), 'maj'), chordFull(tr(K, 'P4'), 'min'), chordFull(V, 'dim')]),
      reveal: voice(chordNotes(V, 'maj')), audio: EV.seq([mids(voice(chordNotes(V, 'maj'), 55)), mids(voice(chordNotes(K, 'min'), 60))], 0, 1.2),
      explain: `Raising the 7th (${disp(tr(K, 'm7'))} → ${disp(tr(K, 'M7'))}) turns ${chordFull(V, 'min')} into ${chordFull(V, 'maj')}, giving a strong V → i pull (like Bonobo's "Noctuary").`,
    });
  },
  () => {
    const K = R.pick(MINOR_KEYS), harm = R.chance(0.5);
    const six = `${disp(tr(K, 'm6'))}→${disp(tr(K, 'M6'))}`, sev = `${disp(tr(K, 'm7'))}→${disp(tr(K, 'M7'))}`;
    const o = [`Only the 7th is raised (${sev})`, `The 6th and 7th are raised (${six}, ${sev})`, `Only the 3rd is raised (${disp(tr(K, 'm3'))}→${disp(tr(K, 'M3'))})`, `The 2nd is lowered (${disp(tr(K, 'M2'))}→${disp(tr(K, 'm2'))})`];
    return Q({
      prompt: `Compared with natural minor, what changes in <b>${disp(K)} ${harm ? 'harmonic' : 'melodic'} minor</b>?`, ...mc(harm ? o[0] : o[1], o),
      reveal: voice(scaleNotes(K, harm ? 'harmonicMinor' : 'melodicMinor')), explain: 'Harmonic minor raises the 7th (gives a major V and a leading tone). Melodic minor raises the 6th and 7th (smooths out the gap).',
    });
  },
  () => {
    const id = R.pick(['minor', 'harmonicMinor', 'melodicMinor']);
    return Q({ prompt: `Which step pattern is the <b>${SCALES[id].name}</b> scale?`, ...mc(stepPattern(id), ['major', 'minor', 'harmonicMinor', 'melodicMinor', 'dorian', 'phrygian'].map(stepPattern)), explain: `${SCALES[id].name}: ${stepPattern(id)} (W+H = augmented 2nd, 3 semitones).` });
  },
];

// ---------------- Part 2: circle of fifths ----------------
const ORDER_SHARPS = 'FCGDAEB';
G.circle = [
  () => {
    const minor = R.chance(0.35), K = minor ? R.pick(MINOR_KEYS) : R.pick(MAJOR_KEYS), sig = keySig(minor ? tr(K, 'm3') : K);
    return Q({
      prompt: `How many sharps or flats are in <b>${disp(K)} ${minor ? 'minor' : 'major'}</b>?`, ...mc(sig, MAJOR_KEYS.map(keySig)),
      explain: `${minor ? `${disp(K)} minor shares its signature with ${disp(tr(K, 'm3'))} major. ` : ''}Moving clockwise from C adds a sharp each step; counter-clockwise adds a flat.`,
    });
  },
  () => {
    const K = R.pick(MAJOR_KEYS.filter(k => k !== 'C')), sig = keySig(K), f = x => `${disp(x)} major`;
    return Q({ prompt: `Which major key has <b>${sig}</b>?`, ...mc(f(K), MAJOR_KEYS.map(f)), explain: `${f(K)}: ${listFmt(scaleNotes(K, 'major'))}.` });
  },
  () => {
    const cw = R.chance(0.5), K = R.pick(MAJOR_KEYS.filter(k => k !== (cw ? 'F#' : 'Db'))), a = tr(K, cw ? 'P5' : 'P4'), f = x => `${disp(x)} major`;
    return Q({
      prompt: `On the circle of fifths, one step <b>${cw ? 'clockwise' : 'counter-clockwise'}</b> from <b>${disp(K)} major</b> is…`, ...mc(f(a), [tr(K, cw ? 'P4' : 'P5'), tr(K, 'M2'), tr(K, 'M6'), tr(K, 'm3')].map(f)),
      explain: `Clockwise = up a perfect 5th (adds a sharp / removes a flat). Counter-clockwise = up a perfect 4th (adds a flat). ${disp(K)} → ${disp(a)}.`,
    });
  },
  () => {
    const K = R.pick(MAJOR_KEYS), f = (a, b) => `${disp(a)} major and ${disp(b)} major`;
    return Q({
      prompt: `Which two major keys are <b>${disp(K)} major's neighbours</b> on the circle of fifths (closely related, only one note different)?`,
      ...mc(f(tr(K, 'P4'), tr(K, 'P5')), [f(tr(K, 'M2'), tr(K, 'm7')), f(tr(K, 'm3'), tr(K, 'M6')), f(tr(K, 'M3'), tr(K, 'm6'))]),
      explain: `Neighbours are a 5th above and below: ${disp(tr(K, 'P4'))} (IV) and ${disp(tr(K, 'P5'))} (V). These keys are the easiest to borrow chords from.`,
    });
  },
  () => {
    const flats = R.chance(0.5), order = flats ? ORDER_SHARPS.split('').reverse().join('') : ORDER_SHARPS, i = R.int(0, 6);
    const acc = flats ? '♭' : '♯';
    return Q({
      prompt: `In the <b>order of ${flats ? 'flats' : 'sharps'}</b>, what is the <b>${ORD[i]}</b> ${flats ? 'flat' : 'sharp'}?`, ...mc(order[i] + acc, order.split('').map(x => x + acc)),
      explain: `Sharps: F C G D A E B ("Father Charles Goes Down And Ends Battle"). Flats are the reverse: B E A D G C F.`,
    });
  },
  () => {
    const K = R.pick(MINOR_KEYS.filter(k => k !== 'G#')), iv = tr(K, 'P4'), nb = tr(K, 'P5'), f = x => `${disp(x)} minor`;
    return Q({
      prompt: `The Ghosts N Stuff trick: in <b>${disp(K)} minor</b> the iv chord is ${chordFull(iv, 'min')}. Which neighbouring key on the circle has <b>${chordFull(iv, 'maj')}</b> in it, so you can borrow it?`,
      ...mc(f(nb), [tr(K, 'P4'), tr(K, 'M2'), tr(K, 'm7'), tr(K, 'M3')].map(f)),
      explain: `One step up the circle from ${disp(K)} minor is ${disp(nb)} minor, where ${disp(iv)} is the major VII chord. Deadmau5 borrows it to turn i–VII–VI–iv into i–VII–VI–IV.`,
    });
  },
];

// ---------------- Part 2: extensions ----------------
G.extensions = [
  () => {
    const r = R.pick(ROOTS), t = R.pick(EXTS), { v, audio } = chordQ(r, t);
    return Q({
      prompt: 'Name this extended chord (root is the lowest note).', ...mc(chordSym(r, t), EXTS.concat(['maj7', 'dom7', 'min7']).map(x => chordSym(r, x))),
      show: v, reveal: v, audio, explain: `${chordSym(r, t)} (${CHORDS[t].name}) = ${listFmt(chordNotes(r, t))}.`,
    });
  },
  () => {
    const r = R.pick(ROOTS), [id, n] = R.pick([['M9', '9th'], ['P11', '11th'], ['M13', '13th']]), a = tr(r, id);
    return Q({
      prompt: `What note is the <b>${n}</b> of a <b>${disp(r)}</b> chord?`, ...noteMC(a, [tr(r, 'M2'), tr(r, 'P4'), tr(r, 'M6'), tr(r, 'M7'), tr(r, 'm7'), tr(r, 'M3')]),
      reveal: voice([r, a]), explain: `Keep stacking 3rds past the 7th: 9th = 2nd, 11th = 4th, 13th = 6th (just an octave higher). So the ${n} of ${disp(r)} is ${disp(a)}.`,
    });
  },
  () => {
    const [n, a] = R.pick([['9th', '2nd'], ['11th', '4th'], ['13th', '6th']]);
    return Q({ prompt: `A <b>${n}</b> is the same pitch (an octave up) as which simple interval?`, ...mc(a, ['2nd', '3rd', '4th', '6th', '7th']), explain: 'Subtract 7: 9 → 2, 11 → 4, 13 → 6.' });
  },
  () => {
    const r = R.pick(ROOTS), s7 = tr(r, 'm7');
    const o = [`${disp(r)}9 includes the ♭7 (${disp(s7)}); ${disp(r)}add9 does not`, `${disp(r)}add9 includes the ♭7 (${disp(s7)}); ${disp(r)}9 does not`, 'They are exactly the same chord', `${disp(r)}9 has no 3rd; ${disp(r)}add9 does`];
    return Q({
      prompt: `What's the difference between <b>${disp(r)}add9</b> and <b>${disp(r)}9</b>?`, ...mc(o[0], o),
      reveal: voice(chordNotes(r, 'dom9')), explain: `${disp(r)}add9 = ${listFmt(chordNotes(r, 'add9'))}. ${disp(r)}9 = ${listFmt(chordNotes(r, 'dom9'))}. A plain "9" implies the 7th is there too.`,
    });
  },
  () => {
    const r = R.pick(ROOTS), t = R.pick(['add9', 'maj9', 'dom9', 'min9', 'six']);
    return PQ({ prompt: `Play <b>${chordSym(r, t)}</b> (${CHORDS[t].name}), then press <b>Submit</b>.`, targetNotes: chordNotes(r, t), explain: `${chordSym(r, t)} = ${listFmt(chordNotes(r, t))}.` });
  },
];

// ---------------- Part 2: melody ----------------
function deg2midi(K, scaleId, idx) {
  let base = 60 + pc(K); if (base > 66) base -= 12; const s = scaleSemis(scaleId);
  return base + 12 * Math.floor(idx / 7) + s[((idx % 7) + 7) % 7];
}
G.melody = [
  () => {
    const K = R.pick(MAJOR_KEYS), s = scaleNotes(K, 'major'), d = diatonic(K, 'major'), c = d[R.pick([0, 3, 4, 5, 1])];
    const ct = R.pick(c.notes), non = s.filter(n => !c.notes.includes(n));
    return Q({
      prompt: `You're writing a melody in <b>${disp(K)} major</b> over a <b>${chordFull(c.root, c.type)}</b> chord. Which note is a <b>chord tone</b> (most stable)?`,
      ...noteMC(ct, non), reveal: voice(c.notes), audio: EV.chord(mids(voice(c.notes))),
      explain: `${chordFull(c.root, c.type)} = ${listFmt(c.notes)}. Landing on chord tones on strong beats sounds resolved; other scale notes work best as passing/neighbour tones.`,
    });
  },
  () => {
    const K = R.pick(MAJOR_KEYS), s = scaleNotes(K, 'major'), passing = R.chance(0.5);
    let idx;
    if (passing) idx = R.chance(0.5) ? (a => [a, a + 1, a + 2])(R.pick([0, 2])) : (a => [a, a - 1, a - 2])(R.pick([2, 4]));
    else idx = (a => R.chance(0.5) ? [a, a + 1, a] : [a, a - 1, a])(R.pick([0, 2, 4]));
    const names = idx.map(i => s[((i % 7) + 7) % 7]), ms = idx.map(i => deg2midi(K, 'major', i));
    const ans = passing ? 'Passing tone' : 'Neighbour tone';
    return Q({
      prompt: `Over a <b>${disp(K)} major</b> chord, the melody goes <b>${listFmt(names)}</b>. The middle note (${disp(names[1])}) is a…`,
      ...mc(ans, ['Passing tone', 'Neighbour tone', 'Chord tone', 'Suspension']), show: ms.map((m, i) => ({ midi: m, label: names[i] })),
      audio: EV.chord(mids(voice(chordNotes(K, 'maj'), 48)), 0, 2.4).concat(EV.arp(ms, 0, 0.55, 0.5)),
      explain: 'Passing tone = steps between two DIFFERENT chord tones (keeps moving the same direction). Neighbour tone = steps away and comes back to the SAME chord tone.',
    });
  },
  () => {
    const K = R.pick(MAJOR_KEYS), s = scaleNotes(K, 'major');
    return Q({
      prompt: `In <b>${disp(K)} major</b>, which note is the <b>leading tone</b> that pulls up to the tonic?`, ...noteMC(s[6], s.slice(1, 6).concat([alter(s[6], -1)])),
      reveal: voice([s[6], K]), audio: EV.arp(mids(voice([s[6], K], 59)), 0, 0.6), explain: `The 7th degree (${disp(s[6])}) is a half step below ${disp(K)}, so it wants to resolve up. End phrases with 7 → 1 for a strong cadence.`,
    });
  },
  () => {
    const minor = R.chance(0.4), K = minor ? R.pick(MINOR_KEYS) : R.pick(MAJOR_KEYS), s = scaleNotes(K, minor ? 'minor' : 'major');
    return Q({
      prompt: `For a melody in <b>${disp(K)} ${minor ? 'minor' : 'major'}</b>, which group holds the most stable "home" notes (the tonic triad)?`,
      ...listMC([s[0], s[2], s[4]], [[s[1], s[3], s[6]], [s[0], s[3], s[5]], [s[1], s[4], s[6]], [s[2], s[5], s[6]]]), reveal: voice([s[0], s[2], s[4]]),
      explain: 'Degrees 1, 3, 5 (the tonic chord) are the resting points. Start and end phrases on them; use 2, 4, 6, 7 for tension and motion.',
    });
  },
  () => {
    const K = R.pick(MAJOR_KEYS), s = scaleNotes(K, 'major'), a = R.int(0, 6), gap = R.pick([1, 1, 2, 3, 4]), b = a + gap;
    const ans = gap === 1 ? 'Step (conjunct motion)' : 'Leap (disjunct motion)';
    const ms = [deg2midi(K, 'major', a), deg2midi(K, 'major', b)];
    return Q({
      prompt: `In ${disp(K)} major, a melody moves <b>${disp(s[a])} → ${disp(s[b % 7])}</b> (upwards). Is that a step or a leap?`, ...mc(ans, ['Step (conjunct motion)', 'Leap (disjunct motion)']),
      show: ms.map((m, i) => ({ midi: m, label: s[[a, b][i] % 7] })), audio: EV.arp(ms, 0, 0.5),
      explain: 'Moving to the adjacent scale note is a step; skipping any scale note is a leap. Good melodies mostly step, with occasional leaps (often followed by a step back the other way).',
    });
  },
];

// ---------------- Part 2: bass ----------------
G.bass = [
  () => {
    const r = R.pick(ROOTS), t = R.pick(['maj', 'min']), n = chordNotes(r, t), k = R.pick([1, 2, 1, 2, 3]);
    let bass, ans;
    if (k === 3) { const s = scaleNotes(r, t === 'maj' ? 'major' : 'minor'); bass = R.pick([s[1], s[5], s[3]]); ans = 'Slash chord: the bass note isn\'t in the chord'; }
    else { bass = n[k]; ans = INV_NAMES[k]; }
    const v = voice([bass].concat(n), 48);
    return Q({
      prompt: `What is <b>${chordSym(r, t)}/${disp(bass)}</b>?`, ...mc(ans, INV_NAMES.slice(0, 3).concat(['Slash chord: the bass note isn\'t in the chord'])),
      show: v, reveal: v, audio: EV.chord(mids(v)),
      explain: `"X/Y" = chord X with Y in the bass. 3rd in bass = 1st inversion, 5th = 2nd inversion. If the bass note isn't a chord tone (like Windowlicker's VI/F), it's just a slash chord. ${chordSym(r, t)} = ${listFmt(n)}.`,
    });
  },
  () => {
    const r = R.pick(ROOTS), t = R.pick(['maj', 'min', 'dom7', 'maj7', 'min7']), n = chordNotes(r, t), inv = R.int(1, n.length - 1);
    return Q({
      prompt: `When <b>${chordFull(r, t)}</b> is in <b>${INV_NAMES[inv].toLowerCase()}</b>, which note is in the bass?`, ...noteMC(n[inv], n.concat([tr(r, 'M2')])),
      reveal: voice(n.slice(inv).concat(n.slice(0, inv)), 48), explain: `${chordFull(r, t)} = ${listFmt(n)}. 1st inv → 3rd in bass, 2nd inv → 5th, 3rd inv → 7th.`,
    });
  },
  () => {
    const r = R.pick(ROOTS), t = R.pick(['maj', 'min']), n = chordNotes(r, t);
    return Q({
      prompt: `An <b>alternating bass</b> (root ↔ 5th) pattern under <b>${chordFull(r, t)}</b> uses which two notes?`, ...listMC([n[0], n[2]], [[n[0], n[1]], [n[1], n[2]], [n[0], tr(r, 'P4')], [n[0], tr(r, 'M6')]]),
      audio: EV.arp([n[0], n[2], n[0], n[2]].map((x, i) => 48 + pc(x) + (i % 2 && pc(x) < pc(n[0]) ? 12 : 0)), 0, 0.35, 0.3),
      explain: `Root ${disp(n[0])} and 5th ${disp(n[2])}: the classic bass accompaniment pattern (used throughout Windowlicker).`,
    });
  },
  () => {
    const K = R.pick(MAJOR_KEYS), prog = R.pick(PROGS.filter(p => p[0] !== 'i')), cs = progChords(K, prog), roots = cs.map(c => c.root);
    const alt = k => progChords(k, prog).map(c => c.root);
    const off = roots.slice(); const j = R.int(0, off.length - 1); off[j] = tr(off[j], 'M2');
    return Q({
      prompt: `A root-note bass line for <b>${prog.join(' – ')}</b> in <b>${disp(K)} major</b> plays…`, ...listMC(roots, [alt(tr(K, 'P5')), alt(tr(K, 'P4')), off]),
      audio: EV.seq(cs.map(c => [48 + pc(c.root)].concat(mids(voice(c.notes, 60))))), explain: `Roots: ${cs.map((c, k) => `${prog[k]} = ${disp(c.root)}`).join(', ')}.`,
    });
  },
];

// ---------------- Part 2: chromaticism ----------------
function chromBetween(lo, hi) { let c = alter(lo, 1); if (Math.abs(parseNote(c).acc) > 1 || ['E#', 'B#'].includes(c)) c = alter(hi, -1); return simple(c); }
G.chromatic = [
  () => {
    const K = R.pick(MAJOR_KEYS), s = scaleNotes(K, 'major').concat([K]), cand = range(0, 6).filter(i => (pc(s[i + 1]) - pc(s[i]) + 12) % 12 === 2);
    const i = R.pick(cand), x = chromBetween(s[i], s[i + 1]);
    const ms = [deg2midi(K, 'major', i), deg2midi(K, 'major', i) + 1, deg2midi(K, 'major', i + 1)];
    return Q({
      prompt: `In <b>${disp(K)} major</b>, a melody climbs <b>${disp(s[i])} → ? → ${disp(s[i + 1])}</b> using a chromatic passing tone. What's the missing note?`,
      ...noteMC(x, ALL_NOTE_NAMES), reveal: ms.map((m, k) => ({ midi: m, label: [s[i], x, s[i + 1]][k] })), audio: EV.arp(ms, 0, 0.4),
      explain: `${disp(x)} isn't in ${disp(K)} major; it's a chromatic ("colourful") note that fills the whole step ${disp(s[i])}–${disp(s[i + 1])} with two half steps.`,
    });
  },
  () => {
    const K = R.pick(MINOR_KEYS), s = scaleNotes(K, 'minor'), out = outsideNote(s);
    return Q({ prompt: `Which note is <b>chromatic</b> (outside the key) in <b>${disp(K)} natural minor</b>?`, ...noteMC(out, s), reveal: voice(s), explain: `${disp(K)} minor = ${listFmt(s)}. Every other pitch is chromatic to the key.` });
  },
  () => {
    const K = R.pick(MAJOR_KEYS), d = diatonic(K, 'major'), tgt = R.pick([1, 2, 5]), sd = tr(d[tgt].root, 'P5');
    const chromatic = chordFull(sd, 'maj'), extra = chordNotes(sd, 'maj').filter(n => !scaleNotes(K, 'major').includes(n));
    return Q({
      prompt: `Which of these chords contains a <b>chromatic</b> note in <b>${disp(K)} major</b>?`, ...mc(chromatic, d.filter(c => c.type !== 'dim' && c.root !== sd).map(c => chordFull(c.root, c.type))),
      reveal: voice(chordNotes(sd, 'maj')), explain: `${chromatic} contains ${listFmt(extra)}, which isn't in ${disp(K)} major. It's the secondary dominant V/${d[tgt].roman}, a common chromatic chord.`,
    });
  },
  () => {
    const K = R.pick(MAJOR_KEYS);
    return Q({ prompt: `How many of the 12 chromatic pitches are <b>not</b> in ${disp(K)} major?`, ...mc('5', ['3', '4', '5', '6', '7']), explain: 'Every major (or minor) scale uses 7 of the 12 pitches, leaving 5 chromatic notes. On a C-major keyboard, those are the 5 black keys.' });
  },
];

// ---------------- Part 2: song analyses (from the book) ----------------
const SONGS = [
  { t: 'Ghosts N Stuff', a: 'Deadmau5', key: 'B♭ minor', tonic: 'Bb', roman: 'i – VII – VI – IV', prog: [['P1', 'min'], ['m7', 'maj'], ['m6', 'maj'], ['P4', 'maj']], why: 'The IV is major, borrowed from F minor (one step up the circle of fifths)' },
  { t: 'Get Lucky', a: 'Daft Punk', key: 'B Dorian', tonic: 'B', roman: 'i – III – v – IV', prog: [['P1', 'min'], ['m3', 'maj'], ['P5', 'min'], ['P4', 'maj']], why: 'The IV is major because Dorian has a raised 6th (G♯)' },
  { t: 'Windowlicker', a: 'Aphex Twin', key: 'C minor', tonic: 'C', roman: 'i – III – VI – VI/F', prog: [['P1', 'min'], ['m3', 'maj'], ['m6', 'maj']], why: 'The final F in the bass is explained as a slash chord (VI/F)' },
  { t: 'Everything You Do Is a Balloon', a: 'Boards of Canada', key: 'G minor', tonic: 'G', roman: 'ii7 – iv7 – i7 – ii7', prog: [['M2', 'min7'], ['P4', 'min7'], ['P1', 'min7'], ['M2', 'min7']], why: 'The ii chord is minor instead of diminished, borrowed from melodic minor' },
  { t: 'Scary Monsters and Nice Sprites', a: 'Skrillex', key: 'G minor', tonic: 'G', roman: 'VI – VII – i – VII', prog: [['m6', 'maj'], ['m7', 'maj'], ['P1', 'min'], ['m7', 'maj']], why: 'It starts on E♭, but F is major (not minor), so G minor fits better than E♭ major' },
  { t: 'Daisy', a: 'Zedd', key: 'D major', tonic: 'D', roman: 'I – ii – vi7 – V7', prog: [['P1', 'maj'], ['M2', 'min'], ['M6', 'min7'], ['P5', 'dom7']], why: 'The bass notes D, E, B, A all fit the D major scale' },
  { t: 'Noctuary', a: 'Bonobo', key: 'G minor', tonic: 'G', roman: 'i – V', prog: [['P1', 'min'], ['P5', 'maj']], why: 'The D major chord is the major V from the harmonic minor scale' },
];
const songChords = (tonic, prog) => prog.map(([iv, t]) => ({ root: tr(tonic, iv), type: t }));
const fmtChords = cs => cs.map(c => chordSym(c.root, c.type)).join(' – ');
G.songs = [
  () => { const s = R.pick(SONGS); return Q({ prompt: `In the book's analysis, what key is <b>${s.t}</b> (${s.a}) in?`, ...mc(s.key, SONGS.map(x => x.key).concat(['E♭ major', 'F♯ minor', 'A minor'])), explain: `${s.t}: ${s.key}, ${s.roman}. ${s.why}.` }); },
  () => { const s = R.pick(SONGS); return Q({ prompt: `Which Roman-numeral progression matches <b>${s.t}</b> (${s.a})?`, ...mc(s.roman, SONGS.map(x => x.roman)), audio: EV.seq(songChords(s.tonic, s.prog).map(c => mids(voice(chordNotes(c.root, c.type), 55)))), explain: `${s.t} in ${s.key}: ${s.roman} = ${fmtChords(songChords(s.tonic, s.prog))}.` }); },
  () => {
    const s = R.pick(SONGS), cs = songChords(s.tonic, s.prog);
    return Q({ prompt: `Which chords does <b>${s.t}</b> use in its original key (${s.key})?`, ...mc(fmtChords(cs), SONGS.filter(x => x !== s).map(x => fmtChords(songChords(x.tonic, x.prog))).concat([fmtChords(songChords(tr(s.tonic, 'M2'), s.prog))])), audio: EV.seq(cs.map(c => mids(voice(chordNotes(c.root, c.type), 55)))), explain: `${s.roman} in ${s.key} = ${fmtChords(cs)}.` });
  },
  () => {
    const s = R.pick(SONGS), nk = R.pick(['C', 'D', 'E', 'F', 'G', 'A', 'Bb', 'Eb'].filter(k => pc(k) !== pc(s.tonic)));
    const cs = songChords(nk, s.prog), q = s.key.split(' ').slice(1).join(' ');
    const flip = cs.map((c, i) => i === 1 ? { root: c.root, type: c.type === 'maj' ? 'min' : c.type === 'min' ? 'maj' : c.type === 'min7' ? 'dom7' : 'min7' } : c);
    return Q({
      prompt: `<b>${s.t}</b> uses <b>${s.roman}</b> in ${s.key}. Transposed to <b>${disp(nk)} ${q}</b>, the chords are…`,
      ...mc(fmtChords(cs), [fmtChords(songChords(s.tonic, s.prog)), fmtChords(songChords(tr(nk, 'P5'), s.prog)), fmtChords(flip)]),
      audio: EV.seq(cs.map(c => mids(voice(chordNotes(c.root, c.type), 55)))), explain: `Roman numerals are key-independent: in ${disp(nk)} ${q}, ${s.roman} = ${fmtChords(cs)}. You can't copyright a progression, so steal freely!`,
    });
  },
  () => { const s = R.pick(SONGS); return Q({ prompt: `In the analysis of <b>${s.t}</b>, what's the key insight?`, ...mc(s.why, SONGS.map(x => x.why)), explain: `${s.t} (${s.a}): ${s.key}, ${s.roman}.` }); },
];

// ---------------- Part 3: modes ----------------
G.modes = [
  () => { const m = R.pick(MODES); return Q({ prompt: `Which mode is <b>${MODE_DESC[m]}</b>?`, ...mc(MODE_NAMES[m], Object.values(MODE_NAMES)), explain: MODES.map(x => `${MODE_NAMES[x]}: ${MODE_DESC[x]}`).join('<br>') }); },
  () => {
    const P = R.pick(MAJOR_KEYS), m = R.pick(MODES.slice(1)), root = tr(P, MODE_OFFSET[m]), f = x => `${disp(x)} major`;
    return Q({
      prompt: `<b>${disp(root)} ${MODE_NAMES[m]}</b> uses the same notes as which major scale?`, ...mc(f(P), MODES.map(x => f(tr(root, x === 'major' ? 'P1' : INV_PAIR[MODE_OFFSET[x]] || 'P1')))),
      reveal: voice(scaleNotes(root, m)), explain: `${MODE_NAMES[m]} starts on degree ${MODES.indexOf(m) + 1} of its parent major scale. ${disp(root)} is degree ${MODES.indexOf(m) + 1} of ${disp(P)} major.`,
    });
  },
  () => {
    const K = R.pick(MAJOR_KEYS), i = R.int(1, 6), s = scaleNotes(K, 'major'), m = MODES[i];
    return Q({
      prompt: `Play the notes of <b>${disp(K)} major</b> but start and end on its <b>${ORD[i]}</b> note, <b>${disp(s[i])}</b>. Which mode is that?`, ...mc(MODE_NAMES[m], Object.values(MODE_NAMES)),
      reveal: voice(s.slice(i).concat(s.slice(0, i + 1))), explain: 'Starting on degrees 1–7 gives: Ionian, Dorian, Phrygian, Lydian, Mixolydian, Aeolian, Locrian.',
    });
  },
  () => {
    const r = R.pick(['C', 'D', 'E', 'F', 'G', 'A', 'Bb', 'Eb']), m = R.pick(MODES), n = scaleNotes(r, m);
    return Q({ prompt: `Which notes make <b>${disp(r)} ${MODE_NAMES[m]}</b>?`, ...listMC(n, MODES.map(x => scaleNotes(r, x))), reveal: voice(n), audio: EV.arp(mids(voice(n.concat([r]))), 0, 0.22), explain: `${disp(r)} ${MODE_NAMES[m]} = ${MODE_DESC[m]}: ${listFmt(n)}.` });
  },
  () => {
    const r = R.pick(['C', 'D', 'E', 'F', 'G', 'A', 'Bb']), m = R.pick(MODES), v = voice(scaleNotes(r, m).concat([r]));
    return Q({ prompt: `This scale starts on <b>${disp(r)}</b>. Which mode is it?`, ...mc(MODE_NAMES[m], Object.values(MODE_NAMES)), show: v, reveal: v, audio: EV.arp(mids(v), 0, 0.22), explain: `Compare to ${disp(r)} major (${listFmt(scaleNotes(r, 'major'))}). ${MODE_NAMES[m]} is ${MODE_DESC[m]}.` });
  },
  () => {
    const r = R.pick(['C', 'D', 'E', 'F', 'G', 'A', 'Bb', 'Eb']), m = R.pick(Object.keys(MODE_CHAR)), [id, desc] = MODE_CHAR[m], n = tr(r, id);
    return Q({
      prompt: `What is the <b>characteristic note</b> (the one that gives it its flavour) of <b>${disp(r)} ${MODE_NAMES[m]}</b>?`, ...noteMC(n, scaleNotes(r, m)),
      reveal: voice(scaleNotes(r, m)), explain: `${MODE_NAMES[m]} = ${MODE_DESC[m]}. Its ${desc} is ${disp(n)}. Feature this note in melodies/chords so the mode is heard (like G♯ in Get Lucky's B Dorian).`,
    });
  },
];

// ---------------- Part 3: pentatonic ----------------
G.penta = [
  () => {
    const minor = R.chance(0.5), r = R.pick(minor ? MINOR_KEYS : MAJOR_KEYS), id = minor ? 'minorPent' : 'majorPent', n = scaleNotes(r, id);
    return Q({
      prompt: `Which notes make <b>${disp(r)} ${minor ? 'minor' : 'major'} pentatonic</b>?`, ...listMC(n, [scaleNotes(r, minor ? 'majorPent' : 'minorPent'), scaleNotes(tr(r, 'P5'), id), scaleNotes(r, minor ? 'minor' : 'major').slice(0, 5)]),
      reveal: voice(n), audio: EV.arp(mids(voice(n.concat([r]))), 0, 0.24), explain: minor ? 'Minor pentatonic = 1 ♭3 4 5 ♭7 (natural minor minus 2 and 6).' : 'Major pentatonic = 1 2 3 5 6 (major scale minus 4 and 7).',
    });
  },
  () => {
    const K = R.pick(MAJOR_KEYS), s = scaleNotes(K, 'major');
    return Q({
      prompt: `<b>${disp(K)} major pentatonic</b> leaves out which two notes of ${disp(K)} major?`, ...listMC([s[3], s[6]], [[s[1], s[5]], [s[2], s[6]], [s[3], s[5]], [s[1], s[4]]]),
      explain: `It drops the 4th (${disp(s[3])}) and 7th (${disp(s[6])}), the two notes that form half steps. No half steps = no clashes, which is why pentatonic always sounds "safe".`,
    });
  },
  () => {
    const K = R.pick(MINOR_KEYS), rel = tr(K, 'm3'), f = x => `${disp(x)} major pentatonic`;
    return Q({ prompt: `<b>${disp(K)} minor pentatonic</b> has exactly the same notes as which major pentatonic?`, ...mc(f(rel), [K, tr(K, 'P5'), tr(K, 'P4'), tr(K, 'M6')].map(f)), explain: `Like relative keys: ${disp(rel)} major pentatonic = ${listFmt(scaleNotes(rel, 'majorPent'))}, same notes starting on a different root.` });
  },
  () => {
    const K = R.pick(MINOR_KEYS), b = tr(K, 'd5');
    return Q({ prompt: `Which note turns <b>${disp(K)} minor pentatonic</b> into the <b>blues scale</b>?`, ...noteMC(b, [tr(K, 'M2'), tr(K, 'M3'), tr(K, 'm6'), tr(K, 'M7'), tr(K, 'M6')]), reveal: voice(scaleNotes(K, 'blues')), explain: `Add the ♭5 "blue note" (${disp(b)}): ${listFmt(scaleNotes(K, 'blues'))}.` });
  },
  () => {
    const r = R.pick(['C', 'D', 'E', 'F', 'G', 'A']), id = R.pick(['majorPent', 'minorPent', 'blues', 'major', 'minor']), v = voice(scaleNotes(r, id).concat([r]));
    return Q({ prompt: `This scale starts on <b>${disp(r)}</b>. What is it?`, ...mc(`${disp(r)} ${SCALES[id].name}`, ['majorPent', 'minorPent', 'blues', 'major', 'minor', 'hirajoshi'].map(x => `${disp(r)} ${SCALES[x].name}`)), show: v, reveal: v, audio: EV.arp(mids(v), 0, 0.24), explain: `${SCALES[id].name}: ${stepPattern(id)}.` });
  },
];

// ---------------- Part 3: chromatic mediants ----------------
const CM = [['M3', 'a major 3rd up'], ['m3', 'a minor 3rd up'], ['m6', 'a major 3rd down'], ['M6', 'a minor 3rd down']];
G.mediants = [
  () => {
    const K = R.pick(MAJOR_KEYS), [iv] = R.pick(CM), ans = chordFull(tr(K, iv), 'maj');
    return Q({
      prompt: `Which chord is a <b>chromatic mediant</b> of <b>${disp(K)} major</b>?`, ...mc(ans, [chordFull(tr(K, 'M3'), 'min'), chordFull(tr(K, 'M6'), 'min'), chordFull(tr(K, 'P4'), 'maj'), chordFull(tr(K, 'P5'), 'maj'), chordFull(tr(K, 'M2'), 'min')]),
      audio: EV.seq([mids(voice(chordNotes(K, 'maj'))), mids(voice(chordNotes(tr(K, iv), 'maj')))], 0, 1.3),
      explain: `Chromatic mediants: same quality (both major), roots a 3rd apart, sharing just one note. For ${disp(K)}: ${CM.map(([i]) => disp(tr(K, i))).join(', ')} major. ${chordFull(tr(K, 'M3'), 'min')} and ${chordFull(tr(K, 'M6'), 'min')} are the ordinary diatonic mediants.`,
    });
  },
  () => {
    const K = R.pick(MAJOR_KEYS), [iv, d] = R.pick(CM), x = tr(K, iv);
    const ans = chordFull(x, 'maj'), pool = CM.map(([i]) => chordFull(tr(K, i), 'maj')).concat([chordFull(x, 'min')]);
    return Q({ prompt: `What major chord is the chromatic mediant <b>${d}</b> from <b>${disp(K)} major</b>?`, ...mc(ans, pool), audio: EV.seq([mids(voice(chordNotes(K, 'maj'))), mids(voice(chordNotes(x, 'maj')))], 0, 1.3), explain: `${disp(K)} ${d} → ${disp(x)}. Same quality, root a 3rd away: a dramatic, "cinematic" shift.` });
  },
  () => {
    const K = R.pick(MAJOR_KEYS), [iv] = R.pick(CM), x = tr(K, iv), a = chordNotes(K, 'maj'), b = chordNotes(x, 'maj');
    const common = a.filter(n => b.map(pc).includes(pc(n)));
    return Q({
      prompt: `How many notes do <b>${chordFull(K, 'maj')}</b> and <b>${chordFull(x, 'maj')}</b> have in common?`, ...mc(String(common.length), ['0', '1', '2', '3']),
      reveal: voice(a).concat(voice(b, 48).filter(o => !a.map(pc).includes(o.midi % 12))), explain: `${listFmt(a)} vs ${listFmt(b)}: common tone ${listFmt(common)}. One shared note + chromatic movement in the others is what makes chromatic mediants sound striking yet connected.`,
    });
  },
  () => {
    const K = R.pick(MAJOR_KEYS), kind = R.pick(['cm', 'dom', 'rel', 'sub']);
    const map = { cm: [chordFull(tr(K, R.pick(CM)[0]), 'maj'), 'Chromatic mediant'], dom: [chordFull(tr(K, 'P5'), 'maj'), 'Dominant (I → V)'], rel: [chordFull(tr(K, 'M6'), 'min'), 'Relative minor (I → vi)'], sub: [chordFull(tr(K, 'P4'), 'maj'), 'Subdominant (I → IV)'] };
    const [target, ans] = map[kind];
    return Q({ prompt: `Moving from <b>${chordFull(K, 'maj')}</b> to <b>${target}</b> is best described as…`, ...mc(ans, Object.values(map).map(x => x[1])), explain: 'Chromatic mediant = same quality, root a major/minor 3rd away, notes outside the key. Relative minor is a diatonic mediant (2 common tones).' });
  },
];

// ---------------- Part 3: advanced harmonies ----------------
const BORROW = [['P4', 'min', 'iv'], ['m6', 'maj', '♭VI'], ['m7', 'maj', '♭VII'], ['m3', 'maj', '♭III']];
G.advanced = [
  () => {
    const K = R.pick(MAJOR_KEYS), [iv, t, rn] = R.pick(BORROW), ans = chordFull(tr(K, iv), t), d = diatonic(K, 'major');
    return Q({
      prompt: `Which chord is <b>borrowed</b> from ${disp(K)} minor into <b>${disp(K)} major</b> (modal borrowing)?`, ...mc(ans, d.filter(c => c.type !== 'dim').map(c => chordFull(c.root, c.type))),
      audio: EV.seq([mids(voice(chordNotes(K, 'maj'))), mids(voice(chordNotes(tr(K, iv), t)))], 0, 1.3),
      explain: `${ans} is ${rn} in ${disp(K)} major, taken from the parallel minor. Common borrowed chords: iv, ♭VI, ♭VII, ♭III, for instant emotional darkness.`,
    });
  },
  () => {
    const K = R.pick(MAJOR_KEYS), [iv, t, rn] = R.pick(BORROW), ans = chordFull(tr(K, iv), t);
    return Q({ prompt: `In <b>${disp(K)} major</b>, what is the borrowed <b>${rn}</b> chord?`, ...mc(ans, BORROW.map(([i, tt]) => chordFull(tr(K, i), tt)).concat([chordFull(tr(K, 'M6'), 'min'), chordFull(tr(K, 'P4'), 'maj')])), reveal: voice(chordNotes(tr(K, iv), t)), explain: `${rn} in ${disp(K)} = ${ans} (${listFmt(chordNotes(tr(K, iv), t))}).` });
  },
  () => {
    const K = R.pick(MAJOR_KEYS), d = diatonic(K, 'major'), i = R.pick([1, 2, 3, 4, 5]), tgt = d[i], sd = tr(tgt.root, 'P5');
    return Q({
      prompt: `In <b>${disp(K)} major</b>, what is <b>V7/${tgt.roman}</b> (the secondary dominant of ${chordFull(tgt.root, tgt.type)})?`,
      ...mc(chordSym(sd, 'dom7'), [chordSym(sd, 'min7'), chordSym(sd, 'maj7'), chordSym(tr(K, 'P5'), 'dom7'), chordSym(tr(tgt.root, 'P4'), 'dom7')]),
      reveal: voice(chordNotes(sd, 'dom7')), audio: EV.seq([mids(voice(chordNotes(sd, 'dom7'), 55)), mids(voice(tgt.notes, 55))], 0, 1.2),
      explain: `Treat ${disp(tgt.root)} as a temporary "I": its V7 is a 5th above it, ${chordSym(sd, 'dom7')}. It points strongly at ${chordFull(tgt.root, tgt.type)}.`,
    });
  },
  () => {
    const K = R.pick(MINOR_KEYS);
    return Q({ prompt: `A song in <b>${disp(K)} minor</b> ends on a <b>${disp(K)} major</b> chord. This is called…`, ...mc('A Picardy third', ['A Picardy third', 'A chromatic mediant', 'A secondary dominant', 'A tritone substitution']), reveal: voice(chordNotes(K, 'maj')), explain: `Raising the 3rd (${disp(tr(K, 'm3'))} → ${disp(tr(K, 'M3'))}) on the final chord is a Picardy third: a bright, surprising ending.` });
  },
  () => {
    const K = R.pick(MINOR_KEYS), n = tr(K, 'm2');
    return Q({ prompt: `The <b>Neapolitan</b> chord (♭II) in <b>${disp(K)} minor</b> is…`, ...mc(chordFull(n, 'maj'), [chordFull(tr(K, 'M2'), 'dim'), chordFull(tr(K, 'M2'), 'maj'), chordFull(tr(K, 'm6'), 'maj'), chordFull(n, 'min')]), reveal: voice(chordNotes(n, 'maj')), explain: `A major chord on the lowered 2nd degree: ${chordFull(n, 'maj')}. Dark and dramatic, typically moving to V.` });
  },
  () => {
    const K = R.pick(MAJOR_KEYS), V = tr(K, 'P5'), sub = tr(K, 'm2');
    return Q({ prompt: `The <b>tritone substitute</b> for the V7 (${chordSym(V, 'dom7')}) in <b>${disp(K)} major</b> is…`, ...mc(chordSym(sub, 'dom7'), [chordSym(tr(K, 'M2'), 'dom7'), chordSym(tr(K, 'P4'), 'dom7'), chordSym(tr(K, 'M6'), 'dom7'), chordSym(sub, 'maj7')]), audio: EV.seq([mids(voice(chordNotes(sub, 'dom7'), 55)), mids(voice(chordNotes(K, 'maj7'), 55))], 0, 1.3), explain: `Root a tritone away from ${disp(V)}: ${chordSym(sub, 'dom7')}. It shares the same tritone (3rd & 7th) as ${chordSym(V, 'dom7')}, and its root slides down a half step to ${disp(K)}.` });
  },
];

// ---------------- Part 3: exotic scales ----------------
const EXOTIC = ['harmonicMinor', 'phrygianDominant', 'hungarianMinor', 'doubleHarmonic', 'wholeTone', 'octatonic', 'hirajoshi', 'melodicMinor'];
const EXOTIC_FEAT = {
  wholeTone: 'Only whole steps, 6 notes, no clear "home" (dreamy)', octatonic: 'Alternating half and whole steps, 8 notes',
  phrygianDominant: 'Phrygian with a major 3rd (5th mode of harmonic minor)', hungarianMinor: 'Harmonic minor with a raised 4th',
  doubleHarmonic: 'Major scale with a lowered 2nd and lowered 6th', hirajoshi: 'A 5-note Japanese scale with half steps',
  harmonicMinor: 'Natural minor with a raised 7th', melodicMinor: 'Natural minor with a raised 6th and 7th',
};
G.exotic = [
  () => { const id = R.pick(EXOTIC); return Q({ prompt: `Which scale has the step pattern <b>${stepPattern(id)}</b>?`, ...mc(SCALES[id].name, EXOTIC.map(x => SCALES[x].name)), reveal: voice(scaleNotes('C', id).concat(['C'])), explain: `${SCALES[id].name}: ${EXOTIC_FEAT[id]}. (W+H = 3 semitones, the "exotic" augmented 2nd.)` }); },
  () => { const id = R.pick(Object.keys(EXOTIC_FEAT)); return Q({ prompt: `Which scale is: <b>${EXOTIC_FEAT[id]}</b>?`, ...mc(SCALES[id].name, Object.keys(EXOTIC_FEAT).map(x => SCALES[x].name)), explain: `${SCALES[id].name}: ${stepPattern(id)}.` }); },
  () => {
    const r = R.pick(['C', 'D', 'E', 'F', 'G', 'A']), id = R.pick(EXOTIC), v = voice(scaleNotes(r, id).concat([r]));
    return Q({ prompt: `This scale starts on <b>${disp(r)}</b>. Which exotic scale is it?`, ...mc(SCALES[id].name, EXOTIC.map(x => SCALES[x].name)), show: v, reveal: v, audio: EV.arp(mids(v), 0, 0.22), explain: `${SCALES[id].name}: ${stepPattern(id)}.` });
  },
  () => {
    const r = R.pick(['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Bb', 'Eb']), parent = tr(r, 'P4'), f = x => `${disp(x)} harmonic minor`;
    return Q({ prompt: `<b>${disp(r)} Phrygian Dominant</b> is the 5th mode of which harmonic minor scale?`, ...mc(f(parent), [r, tr(r, 'P5'), tr(r, 'M2'), tr(r, 'm6')].map(f)), reveal: voice(scaleNotes(r, 'phrygianDominant')), explain: `${disp(r)} is the 5th of ${disp(parent)} harmonic minor. Phrygian Dominant = ${listFmt(scaleNotes(r, 'phrygianDominant'))}.` });
  },
  () => {
    const id = R.pick(['wholeTone', 'octatonic', 'hirajoshi', 'blues', 'majorPent', 'harmonicMinor']), n = SCALES[id].iv.length;
    return Q({ prompt: `How many different notes are in one octave of the <b>${SCALES[id].name}</b> scale?`, ...mc(String(n), ['5', '6', '7', '8']), explain: `${SCALES[id].name}: ${stepPattern(id)} → ${n} notes.` });
  },
];

// ---------------- Ear training ----------------
G.ear = [
  () => {
    const r = R.pick(ROOTS), t = R.pick(TRIADS), v = voice(chordNotes(r, t), 55);
    return Q({ prompt: '🎧 Listen. What <b>quality</b> is this triad?', ...mc(CHORDS[t].name, TRIADS.map(x => CHORDS[x].name)), reveal: v, audio: EV.arpChord(mids(v)), explain: `It was ${chordFull(r, t)}. Major = bright, minor = dark, diminished = tense/small, augmented = unresolved/dreamy.` });
  },
  () => {
    const r = R.pick(ROOTS), t = R.pick(['maj7', 'dom7', 'min7', 'hdim7', 'dim7']), v = voice(chordNotes(r, t), 55);
    return Q({ prompt: '🎧 Listen. Which kind of <b>7th chord</b> is this?', ...mc(CHORDS[t].name, ['maj7', 'dom7', 'min7', 'hdim7', 'dim7'].map(x => CHORDS[x].name)), reveal: v, audio: EV.arpChord(mids(v)), explain: `It was ${chordSym(r, t)}. maj7 = lush, dom7 = bluesy/wants to resolve, m7 = mellow, ø7 = dark & unstable, °7 = horror-movie tension.` });
  },
  () => {
    const pool = INTS.filter(i => ['m2', 'M2', 'm3', 'M3', 'P4', 'A4', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8'].includes(i.id));
    const it = R.pick(pool), a = R.int(55, 67), b = a + it.s;
    return Q({ prompt: '🎧 Listen. Which <b>interval</b> do you hear?', ...mc(it.name, pool.map(x => x.name)), reveal: [{ midi: a }, { midi: b }], audio: EV.arp([a, b], 0, 0.6).concat(EV.chord([a, b], 1.3)), explain: `${it.name} (${it.s} semitones): ${midiName(a)} → ${midiName(b)}.` });
  },
  () => {
    const id = R.pick(['major', 'minor', 'harmonicMinor', 'majorPent', 'dorian', 'mixolydian']), r = R.pick(['C', 'D', 'E', 'F', 'G', 'A']), v = voice(scaleNotes(r, id).concat([r]));
    return Q({ prompt: '🎧 Listen. Which <b>scale</b> is this?', ...mc(SCALES[id].name, ['major', 'minor', 'harmonicMinor', 'majorPent', 'dorian', 'mixolydian'].map(x => SCALES[x].name)), reveal: v, audio: EV.arp(mids(v), 0, 0.24, 0.35), explain: `${disp(r)} ${SCALES[id].name}: ${stepPattern(id)}.` });
  },
  () => {
    const K = R.pick(['C', 'D', 'F', 'G', 'A']), prog = R.pick(PROGS.filter(p => p[0] !== 'i')), cs = progChords(K, prog);
    return Q({ prompt: '🎧 Listen. Which <b>progression</b> is this? (major key)', ...mc(prog.join(' – '), PROGS.filter(p => p[0] !== 'i').map(p => p.join(' – '))), audio: EV.seq(cs.map(c => [48 + pc(c.root)].concat(mids(voice(c.notes, 60)))), 0, 1.1), explain: `In ${disp(K)} major: ${cs.map(c => chordSym(c.root, c.type)).join(' – ')}.` });
  },
];

// =====================================================================
//  PART 4: PRODUCER TOOLKIT
// =====================================================================
const r1 = x => Math.round(x * 10) / 10;
const ms = x => `${r1(x)} ms`;
const BPMS = [90, 100, 110, 120, 124, 125, 128, 130, 140, 150, 160, 170, 174];
const SUBDIV = [ // [name, beats]
  ['1 bar', 4], ['1/2 note', 2], ['1/4 note (1 beat)', 1], ['1/8 note', 0.5], ['1/16 note', 0.25],
  ['dotted 1/8', 0.75], ['dotted 1/4', 1.5], ['1/8 triplet', 1 / 3], ['1/4 triplet', 2 / 3],
];
const GRID_POS = ['the downbeat', 'the "e"', 'the "&"', 'the "a"'];

// ---------------- rhythm ----------------
G.rhythm = [
  () => {
    const [name, n] = R.pick([['1/16 notes', 16], ['1/8 notes', 8], ['1/4 notes', 4], ['1/8-note triplets (1/8T)', 12], ['1/16-note triplets (1/16T)', 24], ['1/4-note triplets (1/4T)', 6], ['1/32 notes', 32]]);
    return Q({ prompt: `How many <b>${name}</b> fit in one bar of 4/4?`, ...mc(String(n), ['4', '6', '8', '12', '16', '24', '32']), explain: '4/4 = 4 beats per bar. Straight notes halve each time (4, 8, 16, 32). Triplets squeeze 3 into the space of 2, so 1/8T = 3 per beat = 12 per bar.' });
  },
  () => {
    const bpm = R.pick(BPMS), q = 60000 / bpm, [name, b] = R.pick(SUBDIV);
    return Q({
      prompt: `At <b>${bpm} BPM</b>, how long is a <b>${name}</b>? (e.g. for a delay or LFO time)`, ...mc(ms(q * b), SUBDIV.map(s => ms(q * s[1]))),
      explain: `One beat = 60,000 ÷ ${bpm} = ${ms(q)}. A ${name} = ${r1(b)} beat${b === 1 ? '' : 's'} → ${ms(q * b)}. Dotted = ×1.5, triplet = ×⅔.`,
    });
  },
  () => {
    const bpm = R.pick([130, 140, 150, 160, 170, 174, 85, 87, 70, 75]), half = bpm >= 120;
    const ans = half ? bpm / 2 : bpm * 2;
    return Q({
      prompt: `A track at <b>${bpm} BPM</b> uses a <b>${half ? 'half-time' : 'double-time'}</b> drum groove. Which tempo does it <i>feel</i> like?`, ...mc(`${ans} BPM`, [`${bpm} BPM`, `${bpm * 2} BPM`, `${bpm / 2} BPM`, `${Math.round(bpm * 1.5)} BPM`]),
      explain: `${half ? 'Half-time puts the snare on beat 3 instead of 2 & 4, so it feels half as fast. That\'s the dubstep/trap trick: 140 BPM that feels like 70.' : 'Double-time drums (e.g. DnB breaks) make it feel twice as fast. A 87 BPM hip-hop loop works under a 174 BPM DnB beat.'}`,
    });
  },
  () => {
    const g = [['Hip-hop / boom-bap', '85–95 BPM'], ['House', '120–128 BPM'], ['Dubstep', '~140 BPM (half-time feel)'], ['Drum & bass', '170–176 BPM']];
    const [name, t] = R.pick(g);
    return Q({ prompt: `What's the typical tempo for <b>${name}</b>?`, ...mc(t, g.map(x => x[1])), explain: 'Typical centres: hip-hop ~90, house ~124, techno/trance ~125–140, dubstep ~140 half-time, DnB ~174. Ranges overlap and vary by source, and genres aren\'t defined by tempo alone.' });
  },
  () => {
    const s = R.int(1, 16), beat = Math.floor((s - 1) / 4) + 1, pos = (s - 1) % 4;
    const ans = `Beat ${beat}, ${GRID_POS[pos]}`;
    return Q({
      prompt: `On a 16-step sequencer (1/16 notes, 4/4), <b>step ${s}</b> lands on…`, ...mc(ans, range(1, 4).flatMap(b => GRID_POS.map(p => `Beat ${b}, ${p}`))),
      explain: 'Count each beat as "1 e & a, 2 e & a…". Steps 1, 5, 9, 13 are the downbeats; 3, 7, 11, 15 are the "&"s (off-beats).',
    });
  },
  () => {
    const el = [['a four-on-the-floor kick', 'Steps 1, 5, 9, 13'], ['a backbeat clap/snare (beats 2 & 4)', 'Steps 5 and 13'], ['off-beat open hi-hats (house style)', 'Steps 3, 7, 11, 15'], ['a half-time snare (beat 3)', 'Step 9 only']];
    const [name, ans] = R.pick(el);
    return Q({ prompt: `On a 16-step grid (one bar of 1/16s), where do you place <b>${name}</b>?`, ...mc(ans, el.map(x => x[1])), explain: 'Beat 1 = step 1, beat 2 = step 5, beat 3 = step 9, beat 4 = step 13. The "&" of each beat is 2 steps later.' });
  },
  () => {
    const kind = R.pick(['syncopation', 'swing', 'polyrhythm']);
    const d = { syncopation: 'Accenting off-beats / weak parts of the beat', swing: 'Delaying every second 1/16 (or 1/8) note for a shuffled groove', polyrhythm: 'Two different rhythmic divisions at once, e.g. 3 against 4', quantize: 'Snapping notes exactly onto the grid' };
    return Q({ prompt: `What is <b>${kind}</b>?`, ...mc(d[kind], Object.values(d)), explain: Object.entries(d).map(([k, v]) => `<b>${k}</b>: ${v}`).join('<br>') });
  },
];

// ---------------- structure ----------------
G.structure = [
  () => {
    const bpm = R.pick([120, 124, 125, 128, 130, 140, 150, 160, 170, 174]), bars = R.pick([4, 8, 16, 32]), sec = bars * 4 * 60 / bpm;
    const f = x => `${r1(x)} s`;
    return Q({ prompt: `How long does a <b>${bars}-bar</b> section last at <b>${bpm} BPM</b> (4/4)?`, ...mc(f(sec), [f(sec * 2), f(sec / 2), f(bars * 60 / bpm), f(sec * 1.5)]), explain: `bars × 4 beats × 60 ÷ BPM = ${bars} × 4 × 60 ÷ ${bpm} = ${f(sec)}.` });
  },
  () => {
    const a = R.pick([8, 16, 32]), b = R.pick([8, 16]), start = a + b + 1;
    return Q({ prompt: `Your intro is <b>${a} bars</b> and the build-up is <b>${b} bars</b>. On which bar does the drop start?`, ...mc(`Bar ${start}`, [`Bar ${a + b}`, `Bar ${a + b + 2}`, `Bar ${a + b - 1}`, `Bar ${start + 8}`]), explain: `${a} + ${b} = ${a + b} bars before it, so the drop hits on bar ${start}. Sections in multiples of 8 bars keep things DJ-friendly and predictable.` });
  },
  () => {
    const s = { 'Build-up': 'Rising tension: risers, snare rolls, filter sweeps, often the kick drops out', 'Drop': 'The peak: full drums and bass, the main hook', 'Breakdown': 'Energy pulls back: drums thin out, pads/chords/melody are exposed', 'Intro / Outro': 'Sparse, mostly drums and simple elements, easy for DJs to mix' };
    const k = R.pick(Object.keys(s));
    return Q({ prompt: `Which section is this? <b>${s[k]}</b>`, ...mc(k, Object.keys(s)), explain: 'A common EDM shape: Intro → Build → Drop → Breakdown → Build → Drop → Outro. Contrast in energy is what makes the drop hit.' });
  },
  () => {
    const minor = R.chance(0.5), K = R.pick(minor ? MINOR_KEYS : MAJOR_KEYS), V = tr(K, 'P5');
    const ans = chordFull(V, 'maj');
    return Q({
      prompt: `Your drop lands on the <b>${chordFull(K, minor ? 'min' : 'maj')}</b> (${minor ? 'i' : 'I'}) chord. Which chord at the end of the build gives the strongest pull into it?`,
      ...mc(ans, [chordFull(tr(K, 'P4'), minor ? 'min' : 'maj'), chordFull(tr(K, minor ? 'm6' : 'M6'), minor ? 'maj' : 'min'), chordFull(tr(K, minor ? 'm3' : 'M3'), minor ? 'maj' : 'min'), chordFull(K, minor ? 'min' : 'maj')]),
      audio: EV.seq([mids(voice(chordNotes(V, 'dom7'), 55)), mids(voice(chordNotes(K, minor ? 'min' : 'maj'), 55))], 0, 1.3),
      explain: `The dominant (V = ${ans}${minor ? ', made major with the harmonic-minor raised 7th' : ''}) creates maximum tension that resolves to the tonic. Hanging on V (a half cadence) through the build is a classic way to make the drop feel inevitable.`,
    });
  },
  () => {
    const bpm = R.pick([120, 124, 128, 140, 160, 172]), n = bpm / 4;
    return Q({ prompt: `Roughly how many bars of 4/4 fit in <b>one minute</b> at <b>${bpm} BPM</b>?`, ...mc(String(n), [String(n * 2), String(n / 2), String(bpm), String(n + 8)]), explain: `${bpm} beats per minute ÷ 4 beats per bar = ${n} bars.` });
  },
];

// ---------------- tuning ----------------
const hz = m => 440 * Math.pow(2, (m - 69) / 12);
const mName = m => `${disp(DEFAULT_NAMES[((m % 12) + 12) % 12])}${Math.floor(m / 12) - 1}`;
const HARM = [0, 12, 19, 24, 28, 31, 34, 36];
G.tuning = [
  () => {
    const m = R.int(28, 52), f = r1(hz(m)), cands = [m, m + 1, m - 1, m + 2, m - 2, m + 7, m - 5, m + 12];
    return Q({ prompt: `Your 808/sub has a fundamental of <b>${f} Hz</b>. Which note is it? (A4 = 440 Hz)`, ...mc(mName(m), cands.map(mName)), explain: `${mName(m)} ≈ ${f} Hz. Handy anchors: A1 = 55 Hz, A2 = 110 Hz, E1 ≈ 41.2 Hz, C2 ≈ 65.4 Hz. Each octave doubles the frequency; each semitone ≈ ×1.059.` });
  },
  () => {
    const base = R.pick([55, 110, 220, 440]), k = R.pick([-2, -1, 1, 2, 3]), oct = { 55: 1, 110: 2, 220: 3, 440: 4 }[base];
    const ans = base * Math.pow(2, k);
    return Q({ prompt: `A${oct} = ${base} Hz. What is <b>A${oct + k}</b>?`, ...mc(`${ans} Hz`, [base * 2, base / 2, base * 4, base / 4, base * 8, base * 3].map(x => `${x} Hz`)), explain: 'Up an octave = double the frequency, down an octave = half. That 2:1 ratio is why octaves sound like the "same" note.' });
  },
  () => {
    const n = R.int(1, 12);
    return Q({ prompt: `<b>${n}</b> semitone${n > 1 ? 's' : ''} = how many <b>cents</b>?`, ...mc(String(n * 100), [n * 10, n * 50, n * 1200, n * 100 + 50, n * 12].map(String)), explain: '100 cents = 1 semitone, 1200 cents = 1 octave. A synth\'s "fine" or "detune" knob works in cents; small detunes (5–20 cents) between oscillators make supersaws sound wide.' });
  },
  () => {
    const root = R.int(36, 47), k = R.int(2, 8), m = root + HARM[k - 1];
    const pool = HARM.map(h => mName(root + h)).concat([mName(root + 16), mName(root + 26)]);
    return Q({
      prompt: `What is <b>harmonic #${k}</b> (the ${k}× frequency overtone) of <b>${mName(root)}</b>?`, ...mc(mName(m), pool),
      explain: `Harmonic series above a fundamental: 1 = root, 2 = octave, 3 = octave + 5th, 4 = 2 octaves, 5 = 2 oct + major 3rd, 6 = 2 oct + 5th, 7 = ≈ minor 7th (a bit flat), 8 = 3 octaves. This is why the perfect 5th and major triad sound "natural", and why saw waves (all harmonics) sound so rich.`,
    });
  },
  () => {
    const minor = R.chance(0.6), K = R.pick(minor ? MINOR_KEYS : MAJOR_KEYS);
    const opts = [`${disp(K)} (the root)`, `${disp(tr(K, 'm2'))} (♭2)`, `${disp(tr(K, 'A4'))} (tritone)`, `${disp(tr(K, 'M7'))} (major 7th)`];
    return Q({ prompt: `Your track is in <b>${disp(K)} ${minor ? 'minor' : 'major'}</b>. What's the safest note to tune your kick / 808 to?`, ...mc(opts[0], opts), explain: `Tune the kick's fundamental to the root (or the 5th, ${disp(tr(K, 'P5'))}) so the low end supports the harmony instead of clashing. Use a tuner/spectrum analyser on the kick's sustained tone.` });
  },
  () => {
    const n = R.int(36, 84);
    return Q({ prompt: `Middle C is MIDI note 60 (C4 in the standard naming). Which note is <b>MIDI ${n}</b>?`, ...mc(mName(n), [n + 1, n - 1, n + 12, n - 12, n + 2, n + 7].map(mName)), explain: `${n} − 60 = ${n - 60} semitones from middle C → ${mName(n)}. Note: Ableton and some DAWs label MIDI 60 as "C3", so the octave number can be off by one between programs.` });
  },
];

// ---------------- voicing & voice leading ----------------
const CADENCES = {
  'Authentic (V → I)': [4, 0], 'Plagal (IV → I)': [3, 0], 'Half (ends on V)': [1, 4], 'Deceptive (V → vi)': [4, 5],
};
G.voicing = [
  () => {
    const K = R.pick(MAJOR_KEYS), d = diatonic(K, 'major'), name = R.pick(Object.keys(CADENCES)), [a, b] = CADENCES[name];
    return Q({
      prompt: `A phrase in <b>${disp(K)} major</b> ends <b>${chordSym(d[a].root, d[a].type)} → ${chordSym(d[b].root, d[b].type)}</b>. Which cadence is that?`, ...mc(name, Object.keys(CADENCES)),
      audio: EV.seq([mids(voice(d[0].notes, 55)), mids(voice(d[a].notes, 55)), mids(voice(d[b].notes, 55))], 0, 1.1),
      explain: 'Authentic V→I = full stop. Plagal IV→I = softer "amen". Half cadence ends on V = a question mark (great before a drop). Deceptive V→vi = surprise; it fakes you out instead of resolving.',
    });
  },
  () => {
    const K = R.pick(MAJOR_KEYS), d = diatonic(K, 'major'), [i, j] = R.pick([[0, 5], [0, 2], [0, 3], [3, 1], [4, 2], [5, 3], [0, 4], [1, 4]]);
    const A = d[i], B = d[j], common = A.notes.filter(n => B.notes.includes(n));
    return Q({
      prompt: `Which notes do <b>${chordSym(A.root, A.type)}</b> and <b>${chordSym(B.root, B.type)}</b> share (common tones)?`, ...mc(common.length ? listFmt(common) : 'None', [listFmt(A.notes.slice(0, 2)), listFmt(B.notes.slice(1)), 'None', listFmt([A.notes[0]]), listFmt([B.notes[2]]), listFmt(A.notes)]),
      reveal: voice(A.notes).concat(voice(B.notes, 48).filter(x => !A.notes.map(pc).includes(x.midi % 12))),
      explain: `${chordSym(A.root, A.type)} = ${listFmt(A.notes)}, ${chordSym(B.root, B.type)} = ${listFmt(B.notes)}. Good voice leading: hold common tones in the same voice and move the others by the smallest step. Chords a 3rd apart share 2 notes; a 5th apart share 1; a step apart share none.`,
    });
  },
  () => {
    for (let tries = 0; tries < 30; tries++) {
      const K = R.pick(MAJOR_KEYS), d = diatonic(K, 'major'), src = voice(d[0].notes), sm = mids(src), T = d[R.pick([1, 3, 4, 5])];
      const cands = [0, 1, 2].map(k => {
        const rot = T.notes.slice(k).concat(T.notes.slice(0, k)), p0 = pc(rot[0]);
        let m0 = p0 + 12 * Math.round((sm[0] - p0) / 12);
        const v = voice(rot, m0 - (m0 % 12)); const cost = v.reduce((s, x, i) => s + Math.abs(x.midi - sm[i]), 0);
        return { rot, v, cost };
      });
      const best = Math.min(...cands.map(c => c.cost));
      if (cands.filter(c => c.cost === best).length > 1) continue;
      const win = cands.find(c => c.cost === best);
      return Q({
        prompt: `You're playing <b>${chordSym(K, 'maj')}</b> as ${listFmt(d[0].notes)} (low → high). Which voicing of <b>${chordSym(T.root, T.type)}</b> moves there most smoothly (least total movement)?`,
        ...mc(listFmt(win.rot), cands.map(c => listFmt(c.rot))), show: src, reveal: win.v, audio: EV.seq([sm, mids(win.v)], 0, 1.2),
        explain: `Total semitone movement: ${cands.map(c => `${listFmt(c.rot)} = ${c.cost}`).join(' · ')}. Picking inversions that minimise movement keeps chord progressions smooth instead of jumping around the piano roll.`,
      });
    }
    return G.voicing[0]();
  },
  () => {
    const r = R.pick(DEFAULT_NAMES), opts = ['Major 3rd', 'Octave', 'Perfect 5th', 'Unison (doubling)'];
    const bm = 36 + pc(r);
    return Q({
      prompt: `Your bass plays <b>${disp(r)}${Math.floor(bm / 12) - 1}</b> (very low). Which interval stacked right above it is most likely to sound <b>muddy</b>?`, ...mc('Major 3rd', opts),
      explain: 'Close intervals like 3rds blur together in the low register because their harmonics clash. Keep the low end to roots, octaves and 5ths, and put the 3rds and 7ths higher up (around middle C and above).',
    });
  },
  () => {
    const r = R.pick(['C', 'D', 'E', 'F', 'G', 'A', 'Bb', 'Eb']), t = R.pick(['maj', 'min', 'maj7', 'min7']), n = chordNotes(r, t), open = R.chance(0.5);
    let v;
    if (open) { const order = n.length === 3 ? [n[0], n[2], n[1]] : [n[0], n[2], n[3], n[1]]; v = voice(order, 48); }
    else v = voice(n, 60);
    return Q({
      prompt: `Is this <b>${chordSym(r, t)}</b> voiced <b>closed</b> or <b>open</b>?`, ...mc(open ? 'Open (spread over more than an octave)' : 'Closed (all notes within one octave)', ['Open (spread over more than an octave)', 'Closed (all notes within one octave)']),
      show: v, reveal: v, audio: EV.chord(mids(v)),
      explain: 'Closed voicings pack notes tightly (punchy, good for stabs). Open voicings spread them out, e.g. root–5th–3rd, which sounds wider and clearer, great for pads.',
    });
  },
];

// ---------------- Camelot ----------------
const CAM_MAJ = { B: 1, 'F#': 2, Db: 3, Ab: 4, Eb: 5, Bb: 6, F: 7, C: 8, G: 9, D: 10, A: 11, E: 12 };
const CAM_MIN = { 'G#': 1, Eb: 2, Bb: 3, F: 4, C: 5, G: 6, D: 7, A: 8, E: 9, B: 10, 'F#': 11, 'C#': 12 };
const camKeys = [...Object.entries(CAM_MAJ).map(([k, n]) => ({ k, n, l: 'B', name: `${disp(k)} major` })), ...Object.entries(CAM_MIN).map(([k, n]) => ({ k, n, l: 'A', name: `${disp(k)} minor` }))];
const camCode = c => `${c.n}${c.l}`;
const wrap12 = n => ((n - 1 + 120) % 12) + 1;
G.camelot = [
  () => { const c = R.pick(camKeys); return Q({ prompt: `What is the <b>Camelot code</b> for <b>${c.name}</b>?`, ...mc(camCode(c), camKeys.map(camCode)), explain: 'Camelot: B = major, A = minor. 8B = C major, 8A = A minor; each +1 is a step clockwise on the circle of fifths. Relative major/minor share a number.' }); },
  () => { const c = R.pick(camKeys); return Q({ prompt: `Camelot <b>${camCode(c)}</b> is which key?`, ...mc(c.name, camKeys.filter(x => x.n === c.n || Math.abs(x.n - c.n) <= 2).map(x => x.name).concat(camKeys.map(x => x.name))), explain: `${camCode(c)} = ${c.name}. Same number = relative keys (same notes).` }); },
  () => {
    const c = R.pick(camKeys), other = c.l === 'A' ? 'B' : 'A';
    const good = [`${wrap12(c.n + 1)}${c.l}`, `${wrap12(c.n - 1)}${c.l}`, `${c.n}${other}`];
    const bad = [3, 4, 5, 6, -3, -4, -5].map(d => `${wrap12(c.n + d)}${c.l}`).concat([2, -2, 3].map(d => `${wrap12(c.n + d)}${other}`));
    return Q({ prompt: `Your track is <b>${camCode(c)}</b> (${c.name}). Which code is a <b>harmonically safe</b> next track?`, ...mc(R.pick(good), bad), explain: `Safe moves from ${camCode(c)}: ${good.join(', ')} (±1 number = neighbouring key on the circle of fifths, same number other letter = relative major/minor). Big jumps on the wheel clash.` });
  },
  () => {
    const c = R.pick(camKeys.filter(x => x.l === 'B')), up = camKeys.find(x => x.l === 'B' && x.n === wrap12(c.n + 1));
    return Q({ prompt: `Moving from <b>${camCode(c)}</b> (${c.name}) to <b>${camCode(up)}</b> (${up.name}) changes the key by…`, ...mc('Up a perfect 5th (one step clockwise)', ['Up a perfect 5th (one step clockwise)', 'Up a semitone', 'To the relative minor', 'Up a whole step']), explain: 'The Camelot wheel is just the circle of fifths renumbered: +1 = up a 5th (one more sharp / one less flat), so only one note changes between the keys.' });
  },
];

// =====================================================================
//  CHORD PROGRESSIONS (shared by the quiz and the Create tab)
// =====================================================================
// Roman numerals are read relative to the key's own scale (major, or natural minor, which is
// the book's convention: i ii° III iv v VI VII). A leading b/♭/# alters the root;
// case gives major/minor; suffixes: 7 maj7 ø7 °7 ° + sus2 sus4 add9.
function parseRoman(str, tonic, mode) {
  const m = /^([b♭#]?)(VII|VI|IV|V|III|II|I|vii|vi|iv|v|iii|ii|i)(.*)$/.exec(str.trim());
  if (!m) return null;
  const [, acc, num, suf] = m, deg = ROMAN.indexOf(num.toUpperCase()), upper = num === num.toUpperCase();
  let root = scaleNotes(tonic, mode === 'minor' ? 'minor' : 'major')[deg];
  if (acc) root = alter(root, acc === '#' ? 1 : -1);
  root = simple(root);
  const type = {
    '': upper ? 'maj' : 'min', '7': upper ? 'dom7' : 'min7', 'maj7': 'maj7', 'ø7': 'hdim7', '°7': 'dim7', '°': 'dim', '+': 'aug',
    'sus2': 'sus2', 'sus4': 'sus4', 'add9': upper ? 'add9' : 'madd9', '9': upper ? 'dom9' : 'min9', 'maj9': 'maj9', '6': upper ? 'six' : 'm6',
  }[suf];
  if (!type) return null;
  return { root, type, deg, acc, roman: str };
}
const romanLabel = r => r.replace(/^b/, '♭');
const progLabel = rs => rs.map(romanLabel).join(' – ');
// Is this chord diatonic (no accidental, and the quality the key would give that degree)?
function isDiatonicRoman(str, tonic, mode) {
  const p = parseRoman(str, tonic, mode); if (!p || p.acc) return false;
  const d = diatonic(tonic, mode === 'minor' ? 'minor' : 'major', false)[p.deg].type, d7 = diatonic(tonic, mode === 'minor' ? 'minor' : 'major', true)[p.deg].type;
  return p.type === d || p.type === d7;
}
const PROG_LIB = [
  { name: 'Pop anthem', mood: 'uplifting', mode: 'major', romans: ['I', 'V', 'vi', 'IV'], why: 'Home → tension (V) → a touch of sadness (vi) → lift (IV). The most-used loop in pop and EDM.' },
  { name: 'Emotional', mood: 'emotional', mode: 'major', romans: ['vi', 'IV', 'I', 'V'], why: 'The anthem chords started on vi, so it feels minor and longing, and the V at the end pulls it around again.' },
  { name: 'Nostalgic', mood: 'nostalgic', mode: 'major', romans: ['I', 'vi', 'IV', 'V'], why: 'The classic 50s loop: home, relative minor, then subdominant → dominant builds back to home.' },
  { name: 'Deep house', mood: 'smooth', mode: 'major', romans: ['ii7', 'V7', 'Imaj7', 'vi7'], why: 'The jazz ii–V–I with 7th chords: smooth, classy, and resolves beautifully.' },
  { name: 'Lo-fi drift', mood: 'chill', mode: 'major', romans: ['IVmaj7', 'iii7', 'ii7', 'Imaj7'], why: 'Lush 7th chords stepping down the scale: relaxed with no tension, like floating downhill.' },
  { name: 'Bittersweet', mood: 'bittersweet', mode: 'major', romans: ['I', 'IV', 'iv', 'I'], why: 'The borrowed minor iv (one note lowered) adds a sudden pang of melancholy before resolving home.' },
  { name: 'Epic', mood: 'epic', mode: 'major', romans: ['I', 'bVI', 'bVII', 'I'], why: '♭VI and ♭VII are borrowed from the parallel minor: big, heroic, film-trailer energy.' },
  { name: 'EDM minor classic', mood: 'driving', mode: 'minor', romans: ['i', 'VI', 'III', 'VII'], why: 'The pop anthem in its relative minor, the backbone of countless EDM drops. VII leads straight back to i.' },
  { name: 'Climbing home', mood: 'dark', mode: 'minor', romans: ['i', 'VI', 'VII', 'i'], why: 'VI → VII → i climbs stepwise back to the tonic: a strong, hypnotic "rising home" motion.' },
  { name: 'Melodic bass', mood: 'heavy', mode: 'minor', romans: ['VI', 'VII', 'i', 'VII'], why: 'Starts away from home and climbs to i (like Scary Monsters), so landing on i feels like a payoff.' },
  { name: 'Trance lift', mood: 'euphoric', mode: 'minor', romans: ['i', 'iv', 'VI', 'V'], why: 'Ends on the harmonic-minor V (major), whose leading tone creates a big pull back to i.' },
  { name: 'Moody', mood: 'moody', mode: 'minor', romans: ['i', 'iv', 'v', 'i'], why: 'All minor chords, including a minor v: soft and melancholic with only a gentle pull home.' },
  { name: 'Ghosts trick', mood: 'bright-minor', mode: 'minor', romans: ['i', 'VII', 'VI', 'IV'], why: 'The final IV is major (borrowed from a neighbouring key), which lifts the end of a dark loop (Deadmau5).' },
  { name: 'Dramatic descent', mood: 'dramatic', mode: 'minor', romans: ['i', 'VII', 'VI', 'V'], why: 'The bass walks down to a major V (the "Andalusian" cadence): dramatic and tense.' },
];
const progChordsOf = (romans, tonic, mode) => romans.map(r => parseRoman(r, tonic, mode));
const fmtProg = cs => cs.map(c => chordSym(c.root, c.type)).join(' – ');
const progAudio = cs => EV.seq(cs.map(c => [36 + 12 + pc(c.root)].concat(mids(voice(chordNotes(c.root, c.type), 55)))), 0, 1.1);
const keyName = (t, mode) => `${disp(t)} ${mode}`;
const randKey = mode => R.pick(mode === 'minor' ? ['A', 'E', 'B', 'D', 'G', 'C', 'F', 'F#'] : ['C', 'G', 'D', 'A', 'F', 'Bb', 'Eb', 'E']);
G.progressions = [
  () => { // by ear
    const p = R.pick(PROG_LIB), K = randKey(p.mode), cs = progChordsOf(p.romans, K, p.mode);
    return Q({
      prompt: `🎧 Listen. Which progression is this? (<b>${p.mode}</b> key)`, ...mc(progLabel(p.romans), PROG_LIB.filter(x => x.mode === p.mode).map(x => progLabel(x.romans))),
      audio: progAudio(cs), create: { tonic: K, mode: p.mode, romans: p.romans },
      explain: `<b>${p.name}</b> in ${keyName(K, p.mode)}: ${fmtProg(cs)}. ${p.why}`,
    });
  },
  () => { // from chord names
    const p = R.pick(PROG_LIB), K = randKey(p.mode), cs = progChordsOf(p.romans, K, p.mode);
    return Q({
      prompt: `In <b>${keyName(K, p.mode)}</b>, the loop <b>${fmtProg(cs)}</b> is which progression?`, ...mc(progLabel(p.romans), PROG_LIB.filter(x => x.mode === p.mode).map(x => progLabel(x.romans))),
      audio: progAudio(cs), create: { tonic: K, mode: p.mode, romans: p.romans },
      explain: `Find each chord's scale degree in ${keyName(K, p.mode)}: ${cs.map((c, i) => `${chordSym(c.root, c.type)} = ${romanLabel(p.romans[i])}`).join(', ')}. ${p.why}`,
    });
  },
  () => { // missing chord
    const p = R.pick(PROG_LIB), K = randKey(p.mode), cs = progChordsOf(p.romans, K, p.mode), i = R.int(0, cs.length - 1);
    const ans = chordSym(cs[i].root, cs[i].type), d = diatonic(K, p.mode === 'minor' ? 'minor' : 'major', /7/.test(p.romans[i]));
    const shown = cs.map((c, j) => j === i ? '<b>?</b>' : chordSym(c.root, c.type)).join(' – ');
    return Q({
      prompt: `The <b>${p.name}</b> progression (${progLabel(p.romans)}) in <b>${keyName(K, p.mode)}</b>: ${shown}. What's the missing chord?`,
      ...mc(ans, d.map(c => chordSym(c.root, c.type)).concat([chordSym(cs[i].root, cs[i].type === 'maj' ? 'min' : 'maj')])),
      audio: progAudio(cs), create: { tonic: K, mode: p.mode, romans: p.romans },
      explain: `${romanLabel(p.romans[i])} in ${keyName(K, p.mode)} = ${ans}. ${p.why}`,
    });
  },
  () => { // why it works
    const p = R.pick(PROG_LIB), K = randKey(p.mode);
    return Q({
      prompt: `Why does <b>${progLabel(p.romans)}</b> ("${p.name}") sound <b>${p.mood}</b>?`, ...mc(p.why, PROG_LIB.filter(x => x !== p).map(x => x.why)),
      audio: progAudio(progChordsOf(p.romans, K, p.mode)), create: { tonic: K, mode: p.mode, romans: p.romans },
      explain: `Understanding <i>why</i> a progression creates a mood lets you choose chords on purpose instead of by luck.`,
    });
  },
  () => { // tension chord
    const p = R.pick(PROG_LIB.filter(x => x.romans.some(r => /^V7?$/.test(r)))), K = randKey(p.mode), cs = progChordsOf(p.romans, K, p.mode);
    const i = p.romans.findIndex(r => /^V7?$/.test(r)), ans = chordSym(cs[i].root, cs[i].type);
    return Q({
      prompt: `In <b>${fmtProg(cs)}</b> (${keyName(K, p.mode)}), which chord creates the most <b>tension</b> (wants to resolve)?`, ...mc(ans, cs.map(c => chordSym(c.root, c.type))),
      audio: progAudio(cs), create: { tonic: K, mode: p.mode, romans: p.romans },
      explain: `${ans} is the <b>V</b> (dominant). Its 3rd is the leading tone, a half step below the tonic, so it pulls hard back home. Put it at the end of a loop or build-up.`,
    });
  },
  () => { // spice it
    const K = randKey('major'), base = ['I', 'V', 'vi', 'IV'], k = R.pick([['iv', 'bittersweet / melancholic', 'iv is borrowed from the parallel minor: lowering one note of IV adds instant sadness.'], ['bVI', 'epic / cinematic', '♭VI is borrowed from the parallel minor: a big, dramatic, film-score sound.']]);
    const target = parseRoman(k[0], K, 'major'), ans = chordSym(target.root, target.type);
    return Q({
      prompt: `You have <b>${fmtProg(progChordsOf(base, K, 'major'))}</b> in ${keyName(K, 'major')}. To make the last chord feel <b>${k[1]}</b>, swap ${chordSym(parseRoman('IV', K, 'major').root, 'maj')} for…`,
      ...mc(ans, [chordSym(parseRoman('IV', K, 'major').root, 'maj7'), chordSym(parseRoman('ii', K, 'major').root, 'min'), chordSym(parseRoman('vi', K, 'major').root, 'min'), chordSym(parseRoman('V', K, 'major').root, 'dom7'), k[0] === 'iv' ? chordSym(parseRoman('iii', K, 'major').root, 'min') : chordSym(parseRoman('iv', K, 'major').root, 'min')]),
      audio: progAudio(progChordsOf(['I', 'V', 'vi', k[0]], K, 'major')), create: { tonic: K, mode: 'major', romans: ['I', 'V', 'vi', k[0]] },
      explain: `${ans} (${romanLabel(k[0])}). ${k[2]}`,
    });
  },
];

// Voices a melody the way it's sung: each note moves to the nearest pitch from the last one
// (unlike voice(), which always stacks upwards for chords and scales).
function melodyVoice(names, start = 60) {
  let prev = null;
  return names.map(n => {
    const p = pc(n); let m;
    if (prev === null) m = start + ((p - start % 12 + 12) % 12);
    else { let d = (((p - prev) % 12) + 12) % 12; if (d > 6) d -= 12; m = prev + d; }
    if (m < LO) m += 12; if (m > HI) m -= 12;
    prev = m; return { midi: m, label: n };
  });
}

// =====================================================================
//  EAR TRAINING IN A KEY (scale degrees, resolution, bass movement)
// =====================================================================
const DEG_LBL = { major: ['1 (home)', '2', '3', '4', '5', '6', '7'], minor: ['1 (home)', '2', '♭3', '4', '5', '♭6', '♭7'] };
const degShort = (mode, i) => DEG_LBL[mode][i].split(' ')[0];
const EAR_KEYS = ['C', 'D', 'E', 'F', 'G', 'A', 'Bb'];
const CAD_END = 3.0;
// I – IV – V – I: fixes the key in the listener's ear before the question.
function cadence(K, mode) {
  const d = diatonic(K, mode), V = mode === 'minor' ? chordNotes(tr(K, 'P5'), 'maj') : d[4].notes;
  const roots = [K, d[3].root, tr(K, 'P5'), K];
  return [d[0].notes, d[3].notes, V, d[0].notes].map((n, i) => ({ t: i * 0.62, notes: [48 + pc(roots[i])].concat(mids(voice(n, 55))), d: i === 3 ? 0.95 : 0.58 }));
}
function degMidi(K, mode, i) { let base = 60 + pc(K); if (base > 66) base -= 12; return base + 12 * Math.floor(i / 7) + scaleSemis(mode)[((i % 7) + 7) % 7]; }
const earKey = () => ({ K: R.pick(EAR_KEYS), mode: R.pick(['major', 'major', 'minor']) });
G.earkey = [
  () => { // name the degree
    const { K, mode } = earKey(), i = R.int(0, 6), s = scaleNotes(K, mode), m = degMidi(K, mode, i);
    return Q({
      prompt: `🎧 Chords set the key (<b>${disp(K)} ${mode}</b>), then you hear <b>one note</b>. Which scale degree is it?`,
      ...mc(DEG_LBL[mode][i], DEG_LBL[mode]), audio: cadence(K, mode).concat([{ t: CAD_END, notes: [m], d: 1.3 }]),
      reveal: [{ midi: degMidi(K, mode, 0), label: K, sub: '1' }].concat(i ? [{ midi: m, label: s[i], sub: degShort(mode, i) }] : []),
      explain: `It was <b>${disp(s[i])}</b>, degree ${degShort(mode, i)} of ${disp(K)} ${mode}. Sing the note, walk down the scale to the tonic, and count the steps. Degrees 1, 3 and 5 feel settled; 2 and 4 lean downwards; 7 pulls up to 1.`,
    });
  },
  () => { // find it on the piano
    const { K, mode } = earKey(), i = R.int(1, 6), s = scaleNotes(K, mode), m = degMidi(K, mode, i);
    return PQ({
      prompt: `🎧 The key is <b>${disp(K)} ${mode}</b> and the tonic ${disp(K)} is marked. After the chords you hear one note. <b>Find it</b> on the piano or your MIDI keyboard.`,
      targetNotes: [s[i]], show: [{ midi: degMidi(K, mode, 0), label: K, sub: '1' }], audio: cadence(K, mode).concat([{ t: CAD_END, notes: [m], d: 1.3 }]),
      explain: `It was <b>${disp(s[i])}</b>, degree ${degShort(mode, i)}. Finding notes by ear is exactly how you work out a melody or bass line from a track.`,
    });
  },
  () => { // three-note melody
    const { K, mode } = earKey(), s = scaleNotes(K, mode);
    const pats = [[0, 1, 2], [2, 1, 0], [0, 2, 4], [4, 2, 0], [4, 3, 2], [2, 3, 4], [0, 1, 0], [4, 5, 4], [0, 4, 2], [2, 0, 4], [4, 4, 0], [0, 2, 1]];
    const p = R.pick(pats), f = x => x.map(i => degShort(mode, i)).join(' – '), notes = p.map(i => degMidi(K, mode, i));
    return Q({
      prompt: `🎧 After the key-setting chords (<b>${disp(K)} ${mode}</b>) you hear a <b>3-note melody</b>. Which scale degrees is it?`, ...mc(f(p), pats.map(f)),
      audio: cadence(K, mode).concat(notes.map((m, j) => ({ t: CAD_END + j * 0.55, notes: [m], d: 0.5 }))),
      reveal: [...new Set(p)].map(i => ({ midi: degMidi(K, mode, i), label: s[i], sub: degShort(mode, i) })),
      explain: `It was ${f(p)} = ${listFmt(p.map(i => s[i]))}. First decide: does it go up or down, by steps or by leaps? Then place the first note against the tonic.`,
    });
  },
  () => { // does it end at home?
    const { K, mode } = earKey(), s = scaleNotes(K, mode), end = R.pick([0, 0, 4, 2, 1]), body = R.pick([[4, 3, 2], [2, 3, 4], [4, 5, 4], [2, 4, 3], [0, 2, 4]]);
    const seq = body.concat([end]), notes = seq.map(i => degMidi(K, mode, i));
    const L = { 0: 'Yes: it lands on 1 (home)', 4: 'No: it stops on 5 (open, like a question)', 2: `No: it stops on ${degShort(mode, 2)} (calm, but not home)`, 1: 'No: it stops on 2 (unfinished)' };
    return Q({
      prompt: `🎧 After the chords (<b>${disp(K)} ${mode}</b>) you hear a short melody. Does it end at <b>home</b>, on the tonic?`, ...mc(L[end], Object.values(L)),
      audio: cadence(K, mode).concat(notes.map((m, j) => ({ t: CAD_END + j * 0.5, notes: [m], d: j === 3 ? 1.1 : 0.45 }))),
      reveal: [{ midi: degMidi(K, mode, 0), label: K, sub: '1' }].concat(end ? [{ midi: notes[3], label: s[end], sub: degShort(mode, end) }] : []),
      explain: `The last note was <b>${disp(s[end])}</b> (degree ${degShort(mode, end)}). Ending on 1 sounds finished. Ending anywhere else leaves tension, which you can use on purpose: stop a build-up on an unfinished note and resolve it on the drop.`,
    });
  },
  () => { // bass movement
    const { K, mode } = earKey(), s = scaleNotes(K, mode), i = R.pick([2, 3, 4, 5, 6]), b0 = 36 + pc(K) + (pc(K) < 4 ? 12 : 0), b1 = b0 + scaleSemis(mode)[i];
    return Q({
      prompt: `🎧 After the chords (<b>${disp(K)} ${mode}</b>) the <b>bass</b> plays the tonic, then moves <b>up</b> to another note. Which degree does it move to?`,
      ...mc(DEG_LBL[mode][i], [2, 3, 4, 5, 6].map(j => DEG_LBL[mode][j])),
      audio: cadence(K, mode).concat([{ t: CAD_END, notes: [b0], d: 0.7 }, { t: CAD_END + 0.75, notes: [b1], d: 1.1 }]),
      reveal: [{ midi: degMidi(K, mode, 0), label: K, sub: '1' }, { midi: degMidi(K, mode, i), label: s[i], sub: degShort(mode, i) }],
      explain: `The bass moved 1 → ${degShort(mode, i)} (${disp(K)} → ${disp(s[i])}). Bass notes are usually chord roots, so hearing bass movement is the fastest way to work out a track's chords.`,
    });
  },
];

// =====================================================================
//  RHYTHM ON A STEP SEQUENCER (answer type 'seq': program the pattern)
// =====================================================================
// target = { row: [0-based steps] }. Rows that aren't listed are not checked.
function SQ(o) { return Object.assign({ type: 'seq', show: [], reveal: null, hideLabels: false, audio: null, explain: '' }, o); }
const stepName = s => `beat ${Math.floor(s / 4) + 1}${['', ' "e"', ' "&"', ' "a"'][s % 4]}`;
const SEQ_TASKS = [
  ['Program a <b>four-on-the-floor kick</b>: a kick on every beat.', { kick: [0, 4, 8, 12] }, 'Beats 1, 2, 3, 4 are steps 1, 5, 9, 13. This steady pulse is the foundation of house and techno.'],
  ['Add a <b>clap on the backbeat</b>: beats 2 and 4.', { clap: [4, 12] }, 'Beats 2 and 4 are steps 5 and 13. The backbeat is what makes people nod along.'],
  ['Program <b>off-beat hi-hats</b>: one hat on the "&" of every beat.', { hat: [2, 6, 10, 14] }, 'The "&" falls halfway between beats: steps 3, 7, 11, 15. It\'s the classic house hat.'],
  ['Build a <b>basic house beat</b>: kick on every beat, clap on 2 and 4, hat on every "&".', { kick: [0, 4, 8, 12], clap: [4, 12], hat: [2, 6, 10, 14] }, 'Kick 1-5-9-13, clap 5-13, hats 3-7-11-15. Most house tracks start from exactly this.'],
  ['Make a <b>half-time</b> groove: kick on beat 1 only, clap on beat 3 only, hats on every 8th note.', { kick: [0], clap: [8], hat: [0, 2, 4, 6, 8, 10, 12, 14] }, 'With the snare/clap on beat 3 instead of 2 and 4, the bar feels half as fast. That\'s the dubstep and trap feel.'],
  ['Program straight <b>8th-note hi-hats</b>: two per beat.', { hat: [0, 2, 4, 6, 8, 10, 12, 14] }, '8th notes land on every beat and every "&": the odd-numbered steps.'],
  ['Program a <b>"boots and cats"</b> beat: kick on beats 1 and 3, clap on beats 2 and 4.', { kick: [0, 8], clap: [4, 12] }, 'Kick 1 and 9, clap 5 and 13: the basic rock/pop backbone.'],
  ['Program a <b>syncopated kick</b>: beat 1, and the "&" of beat 3. Then clap on 2 and 4.', { kick: [0, 10], clap: [4, 12] }, 'The kick on the "&" of 3 (step 11) lands off the beat. That push is what makes breakbeats and garage feel bouncy.'],
  ['Program the <b>3-3-2 "tresillo"</b> kick: hits on steps 1, 4 and 7 in each half of the bar (so 1, 4, 7, 9, 12, 15).', { kick: [0, 3, 6, 8, 11, 14] }, 'Groups of 3 + 3 + 2 sixteenths against a 4/4 pulse. You hear it in reggaeton, dancehall, and lots of melodic house bass lines.'],
  ['Program <b>16th-note hi-hats</b> on every step, with a kick on beats 1 and 3.', { hat: range(0, 15), kick: [0, 8] }, 'All 16 steps is a constant 16th-note stream, typical of techno and trap hats.'],
];
G.rhythm.push(
  () => { const t = R.pick(SEQ_TASKS); return SQ({ prompt: `${t[0]}`, target: t[1], explain: t[2] }); },
  () => {
    const row = R.pick(['kick', 'clap', 'hat']), steps = R.sample(range(0, 15), R.int(2, 3)).sort((a, b) => a - b);
    return SQ({
      prompt: `Place a <b>${row}</b> on exactly these positions: <b>${steps.map(stepName).join(', ')}</b>.`, target: { [row]: steps },
      explain: `Count each beat as "1 e & a": the beat itself, then "e", "&", "a". Those positions are steps ${steps.map(s => s + 1).join(', ')}.`,
    });
  },
  () => {
    const pos = R.int(1, 3), row = R.pick(['hat', 'clap']), steps = [0, 4, 8, 12].map(b => b + pos), name = ['', '"e"', '"&"', '"a"'][pos];
    return SQ({
      prompt: `Put a <b>kick</b> on every beat, and a <b>${row}</b> on the <b>${name}</b> of every beat.`, target: { kick: [0, 4, 8, 12], [row]: steps },
      explain: `The ${name} of each beat is ${pos} step${pos > 1 ? 's' : ''} after it: steps ${steps.map(s => s + 1).join(', ')}.`,
    });
  },
);

function makeQuestion(topicId) {
  const q = R.pick(G[topicId])(); q.topic = topicId; return q;
}

if (typeof module !== 'undefined') module.exports = { melodyVoice, G, TOPICS, makeQuestion, scaleNotes, diatonic, chordNotes, tr, keySig, voice, parseRoman, PROG_LIB, chordSym, isDiatonicRoman };
