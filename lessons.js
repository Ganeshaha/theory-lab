'use strict';
/* =====================================================================
   MINI-LESSONS: a 30-second "worked example" shown before a brand-new topic.
   idea   = the one thing to remember
   points = 2-4 short supporting facts
   demo   = notes to hear: { seq: [[chord], [chord]...] } or { arp: [notes] } or { chord: [notes] }
   tip    = how a producer actually uses it
   ===================================================================== */
const LESSONS = {
  keyboard: {
    idea: 'Every key is one <b>semitone</b>. 12 semitones = one <b>octave</b>.',
    points: ['Black keys have two names: C♯ = D♭ (<i>enharmonic</i>).', 'C sits just left of each group of <b>two</b> black keys.', 'Your synth\'s <b>Semi</b> knob counts semitones: +12 = an octave up, +7 = a 5th up.'],
    demo: { arp: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C'] },
    tip: 'In a piano roll, one row = one semitone. Count rows to count semitones.',
  },
  fifth: {
    idea: 'A <b>perfect 5th</b> = 7 semitones. Being <b>"in key"</b> = using only the 7 notes of a scale.',
    points: ['Power chord = root + 5th (C5 = C + G).', 'Major scale step pattern: <b>W W H W W W H</b> (W = 2 semitones, H = 1).', 'C major = all white keys: C D E F G A B.'],
    demo: { seq: [['C', 'G'], ['F', 'C'], ['G', 'D'], ['C', 'G']] },
    tip: 'Stack a 5th on a bass note for weight without any major/minor mood.',
  },
  triads: {
    idea: 'A <b>triad</b> = root + 3rd + 5th. The <b>3rd</b> decides the mood.',
    points: ['Major = 4 + 3 semitones (bright). Minor = 3 + 4 (dark).', 'Diminished = 3 + 3 (tense). Augmented = 4 + 4 (unresolved).', '<b>Inversions</b> move the bottom note up an octave: same chord, different shape.'],
    demo: { seq: [['C', 'E', 'G'], ['C', 'Eb', 'G'], ['C', 'Eb', 'Gb'], ['C', 'E', 'G#']] },
    tip: 'Use inversions to keep chords in the same area of the piano roll.',
  },
  diatonic: {
    idea: 'Build a triad on each note of the scale and you get the key\'s <b>7 chords</b>.',
    points: ['Major key: <b>I ii iii IV V vi vii°</b> (Maj min min Maj Maj min dim).', 'Uppercase = major, lowercase = minor, ° = diminished.', 'Roman numerals work in every key: I–V–vi–IV is I–V–vi–IV anywhere.'],
    demo: { seq: [['C', 'E', 'G'], ['G', 'B', 'D'], ['A', 'C', 'E'], ['F', 'A', 'C']] },
    tip: 'Loop any 4 chords from the key and it will sound "right". Then make it interesting.',
  },
  sevenths: {
    idea: 'Add another 3rd on top of a triad and you get a <b>7th chord</b>: richer and smoother.',
    points: ['<b>maj7</b> = dreamy. <b>7</b> (dominant) = wants to resolve, found on V. <b>m7</b> = smooth, very house/lo-fi.', '<b>ø7</b> (m7♭5) = dark, sits on vii.', 'Major key 7ths: Imaj7 ii7 iii7 IVmaj7 V7 vi7 viiø7.'],
    demo: { seq: [['C', 'E', 'G', 'B'], ['A', 'C', 'E', 'G'], ['D', 'F', 'A', 'C'], ['G', 'B', 'D', 'F']] },
    tip: 'Swap triads for 7ths in your progression for instant deep-house colour.',
  },
  intervals: {
    idea: 'An <b>interval</b> is the distance between two notes, counted in semitones.',
    points: ['m3 = 3 · M3 = 4 · P4 = 5 · tritone = 6 · P5 = 7 · m6 = 8 · M6 = 9 · m7 = 10 · M7 = 11.', 'Inverting an interval: numbers add to 9 (3rd ↔ 6th), major ↔ minor.', '<b>sus2/sus4</b> replace the 3rd. <b>add9</b> keeps it and adds the 9th.'],
    demo: { seq: [['C', 'D', 'G'], ['C', 'F', 'G'], ['C', 'E', 'G']] },
    tip: 'sus chords are neither major nor minor, which makes them great for floaty, ambiguous pads.',
  },
  minor: {
    idea: '<b>Natural minor</b> = major with a lowered 3rd, 6th and 7th.',
    points: ['Pattern: <b>W H W W H W W</b>.', '<b>Relative minor</b> = the 6th note of a major key (C major ↔ A minor share all notes).', 'Minor chords: i ii° III iv v VI VII. <b>Harmonic minor</b> raises the 7th → a major V.'],
    demo: { arp: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'A'] },
    tip: 'Most EDM is minor. i–VI–III–VII is everywhere.',
  },
  circle: {
    idea: 'The <b>circle of fifths</b> orders keys so each step clockwise adds one sharp.',
    points: ['Neighbouring keys differ by only <b>one note</b>, so they\'re the easiest to borrow from or move to.', 'Inner ring = relative minors (same notes).', 'Order of sharps: F C G D A E B. Flats: the reverse.'],
    demo: { seq: [['C', 'E', 'G'], ['G', 'B', 'D'], ['D', 'F#', 'A'], ['A', 'C#', 'E']] },
    tip: 'Need a lift for a new section? Shift to a neighbouring key on the circle.',
  },
  extensions: {
    idea: 'Keep stacking 3rds: <b>9th</b> (= 2nd), <b>11th</b> (= 4th), <b>13th</b> (= 6th).',
    points: ['<b>add9</b> = triad + 9, with no 7th. <b>9</b> = 7th chord + 9.', 'Extensions make chords dense and lush (think Boards of Canada).', 'You can drop the 5th to reduce mud.'],
    demo: { seq: [['C', 'E', 'G', 'D'], ['C', 'E', 'G', 'B', 'D'], ['A', 'C', 'E', 'G', 'B']] },
    tip: 'Put extensions in the upper register and keep the bass simple.',
  },
  melody: {
    idea: '<b>Chord tones</b> are stable. Other notes create <b>movement</b>.',
    points: ['Land on chord tones on strong beats.', '<b>Passing tone</b>: steps between two different chord tones. <b>Neighbour tone</b>: steps away and back.', 'Mostly steps, a few leaps. After a leap, step back the other way.'],
    demo: { mel: ['C', 'D', 'E', 'G', 'E', 'D', 'C'] },
    tip: 'Write a 2-bar motif, then repeat it with one small change.',
  },
  bass: {
    idea: 'The <b>bass</b> usually plays the chord roots, and it defines what the harmony feels like.',
    points: ['<b>Inversion</b> = the 3rd or 5th in the bass. C/E = C chord with E in the bass.', '<b>Slash chord</b> X/Y = chord X over bass note Y (even a non-chord note).', 'Root ↔ 5th alternation adds movement without changing the harmony.'],
    demo: { seq: [['C', 'C', 'E', 'G'], ['E', 'C', 'E', 'G'], ['G', 'C', 'E', 'G']] },
    tip: 'Keep the sub mono and simple; let the chords live above it.',
  },
  chromatic: {
    idea: '<b>Chromatic</b> notes are outside the key. Used briefly, they add colour and tension.',
    points: ['A chromatic <b>passing tone</b> fills a whole step: C–C♯–D.', '<b>Secondary dominants</b> (V of another chord) bring in chromatic notes.', 'A key uses 7 of the 12 notes, so the other 5 are chromatic.'],
    demo: { arp: ['C', 'C#', 'D', 'D#', 'E'] },
    tip: 'Resolve a chromatic note by a half step and it sounds intentional, not wrong.',
  },
  songs: {
    idea: 'To analyse a track: <b>find the key</b> from the bass, then <b>name the chords</b> with Roman numerals.',
    points: ['The most stable "home" note is usually the key.', 'Check the notes against major and minor scales.', 'Out-of-key chords are usually <b>borrowed</b> (Ghosts N Stuff\'s IV comes from F minor).'],
    demo: { seq: [['Bb', 'Db', 'F'], ['Ab', 'C', 'Eb'], ['Gb', 'Bb', 'Db'], ['Eb', 'G', 'Bb']] },
    tip: 'Once it\'s in Roman numerals, you can use any progression in your own key.',
  },
  modes: {
    idea: 'A <b>mode</b> is the major scale started on a different note. Each one has a <b>signature note</b>.',
    points: ['<b>Dorian</b> = minor with ♮6 (Get Lucky). <b>Phrygian</b> = minor with ♭2 (dark).', '<b>Lydian</b> = major with ♯4 (dreamy). <b>Mixolydian</b> = major with ♭7.', 'Aeolian = natural minor. Locrian = ♭2 + ♭5 (unstable).'],
    demo: { arp: ['D', 'E', 'F', 'G', 'A', 'B', 'C', 'D'] },
    tip: 'Lean on the signature note in your chords or melody so the mode is actually heard.',
  },
  penta: {
    idea: '<b>Pentatonic</b> = 5 notes with no half steps, so nothing can clash.',
    points: ['Major pentatonic: 1 2 3 5 6. Minor pentatonic: 1 ♭3 4 5 ♭7.', 'Add a ♭5 to minor pentatonic → the <b>blues scale</b>.', 'A minor pentatonic = C major pentatonic (relative pair).'],
    demo: { arp: ['A', 'C', 'D', 'E', 'G', 'A'] },
    tip: 'Perfect for quick hooks and leads that work over every chord in the key.',
  },
  mediants: {
    idea: '<b>Chromatic mediants</b>: two chords of the same quality with roots a <b>3rd apart</b>.',
    points: ['From C major: E, A♭, A and E♭ major.', 'They share just <b>one</b> note, and the rest move chromatically.', 'The sound is cinematic and surprising, like a sudden lift.'],
    demo: { seq: [['C', 'E', 'G'], ['E', 'G#', 'B'], ['C', 'E', 'G'], ['Ab', 'C', 'Eb']] },
    tip: 'Use one at a section change for a dramatic shift.',
  },
  advanced: {
    idea: '<b>Borrow</b> chords from the parallel key, or point at a chord with its own <b>V</b>.',
    points: ['Borrowed into major: <b>iv, ♭VI, ♭VII, ♭III</b>, giving instant bittersweet.', 'Secondary dominant <b>V7/x</b> = a dominant 7th a 5th above chord x.', 'Also: Picardy 3rd (minor song ends major), Neapolitan ♭II, tritone sub.'],
    demo: { seq: [['C', 'E', 'G'], ['F', 'A', 'C'], ['F', 'Ab', 'C'], ['C', 'E', 'G']] },
    tip: 'Major-key track feels too happy? Swap IV for iv.',
  },
  exotic: {
    idea: '<b>Exotic scales</b> use unusual gaps (like 3-semitone "W+H" steps) for instant flavour.',
    points: ['Phrygian dominant = Middle-Eastern sound (5th mode of harmonic minor).', 'Whole tone = all whole steps (dreamy). Diminished = H-W alternating (tense).', 'Hungarian minor, double harmonic, hirajoshi: each has its own colour.'],
    demo: { arp: ['E', 'F', 'G#', 'A', 'B', 'C', 'D', 'E'] },
    tip: 'One exotic run in a lead can flavour a whole track.',
  },
  progressions: {
    idea: 'A <b>progression</b> is a loop of chords. Its <b>mood</b> comes from where it starts, where the tension is, and any borrowed chords.',
    points: ['Start on I/i = settled. Start on vi or VI = searching or emotional.', 'The <b>V</b> chord = tension; end a loop on it to pull back around.', 'One <b>borrowed</b> chord (iv, ♭VI, ♭VII in major) adds instant emotion.'],
    demo: { seq: [['C', 'E', 'G'], ['G', 'B', 'D'], ['A', 'C', 'E'], ['F', 'A', 'C']] },
    tip: 'Open the Create tab, load a starter progression, change one chord, and listen to how the mood shifts.',
  },
  rhythm: {
    idea: 'One beat = <b>60,000 ÷ BPM</b> ms. A 16-step sequencer = one bar of 1/16 notes.',
    points: ['Steps 1, 5, 9, 13 = the beats (four-on-the-floor kick).', 'Steps 3, 7, 11, 15 = the off-beats (open hats).', 'Dotted = ×1.5. Triplet = 3 in the space of 2. Half-time = snare on beat 3.'],
    tip: 'Sync delays to tempo: a dotted 1/8 at 128 BPM = 351.6 ms.',
  },
  structure: {
    idea: 'Tracks are built in <b>8 / 16 / 32-bar</b> blocks, with contrast in energy.',
    points: ['Intro → Build → Drop → Breakdown → Build → Drop → Outro.', 'Seconds = bars × 4 × 60 ÷ BPM.', 'End a build on the <b>V</b> chord for maximum pull into the drop.'],
    tip: 'Every 8 bars, add or remove something.',
  },
  tuning: {
    idea: 'Pitch = frequency. An <b>octave = ×2</b>; A4 = 440 Hz; <b>100 cents = 1 semitone</b>.',
    points: ['Tune your kick/808 to the key\'s root (or 5th).', 'Harmonics: octave, 5th, octave, 3rd… which is why 5ths sound "natural".', 'MIDI 60 = middle C (Ableton calls it C3).'],
    demo: { arp: ['A', 'A', 'A'] },
    tip: 'Use a spectrum analyser to check what note your sub is really playing.',
  },
  voicing: {
    idea: 'How you <b>arrange</b> the notes matters as much as which notes you use.',
    points: ['Closed voicing = tight (punchy). Open = spread (wide pads).', 'Smooth voice leading: keep shared notes, move the others the shortest distance.', 'Cadences: V→I full stop · IV→I soft · ends on V = question · V→vi = surprise.'],
    demo: { seq: [['C', 'E', 'G'], ['C', 'F', 'A'], ['B', 'D', 'G'], ['C', 'E', 'G']] },
    tip: 'In the piano roll, the smoothest progressions barely move vertically.',
  },
  camelot: {
    idea: 'The <b>Camelot wheel</b> = the circle of fifths with numbers. A = minor, B = major.',
    points: ['Same number = relative keys (8A = A minor, 8B = C major).', '±1 number = neighbour key, which mixes smoothly.', 'Big jumps on the wheel = clashing keys.'],
    tip: 'Write your next track in a key that mixes with your last one.',
  },
  earkey: {
    idea: 'Inside a key, every note has a <b>feeling</b> compared with home (the tonic).',
    points: ['1 = home · 5 = strong and open · 3 = the mood (major or minor).', '7 pulls up to 1; 4 leans down to 3; 2 falls to 1.', 'Trick: sing the note, walk down the scale to home, and count the steps.'],
    demo: { seq: [['C', 'E', 'G'], ['F', 'A', 'C'], ['G', 'B', 'D'], ['C', 'E', 'G']] },
    tip: 'This is the skill for working out melodies and bass lines from tracks by ear.',
  },
  ear: {
    idea: 'Hearing is the real goal. Listen for <b>mood first</b>, then the details.',
    points: ['Major = bright · minor = dark · diminished = tense · augmented = unresolved.', 'Hum along before you answer.', 'Replay as many times as you like (R). There\'s no penalty.'],
    demo: { seq: [['C', 'E', 'G'], ['C', 'Eb', 'G'], ['C', 'Eb', 'Gb'], ['C', 'E', 'G#']] },
    tip: 'Do a few of these every day. Ear skills grow with frequency, not marathon sessions.',
  },
};
