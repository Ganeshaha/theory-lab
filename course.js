'use strict';
/* =====================================================================
   COURSE: full study lessons, one per topic.
   Original explanations written for this app. Structure and chapter references follow
   J. Anthony Allen, "Music Theory for Electronic Music Producers"; song facts follow
   the book's analyses. Further-reading links were checked when written.

   Lesson = { book, mins, cards: [{ t, b, ex? , create? }], daw, mistakes: [], links: [[label, url]] }
   ex: [label, 'chord'|'arp'|'seq', notes]   (seq = array of chords)
   create: { tonic, mode, romans }  → "Try it in Create"
   ===================================================================== */
const W = s => 'https://en.wikipedia.org/wiki/' + s;
const COURSE = {
  keyboard: {
    book: 'Book ch. 2–4', mins: 4,
    cards: [
      { t: 'The piano roll is a keyboard', b: `Every DAW's piano roll has a keyboard turned on its side down the left edge. <b>Each row is one key, and each key is one semitone</b> (also called a half step), the smallest distance in Western music.<br><br>Go up <b>12 rows</b> and you reach the same note name again, one <b>octave</b> higher. That's why the keyboard pattern repeats.`, ex: [['Chromatic: all 12 semitones', 'arp', ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C']]] },
      { t: 'White keys, black keys and their names', b: `White keys are named <b>A B C D E F G</b>, then the pattern repeats. Black keys come in groups of <b>2 and 3</b>, and <b>C</b> sits just left of each group of two.<br><br>Black keys borrow a neighbour's name: the key between C and D is <b>C♯</b> (C raised) or <b>D♭</b> (D lowered). Two names for one key are called <b>enharmonic</b>.<br><br>Watch out: <b>E–F</b> and <b>B–C</b> have no black key between them, so they're only a half step apart.`, ex: [['E → F (half step)', 'arp', ['E', 'F']], ['B → C (half step)', 'arp', ['B', 'C']], ['C♯ = D♭', 'chord', ['C#']]] },
      { t: 'Whole steps and half steps', b: `A <b>half step</b> = 1 semitone = the very next key. A <b>whole step</b> = 2 semitones = skip one key.<br><br>Every scale and chord is just a recipe of half and whole steps, so being able to count them in the piano roll is the most important basic skill in this course.`, ex: [['C → C♯ (half step)', 'arp', ['C', 'C#']], ['C → D (whole step)', 'arp', ['C', 'D']]] },
      { t: 'Octaves and middle C', b: `Notes an octave apart sound like "the same note, higher". That's because the higher note vibrates exactly <b>twice as fast</b> (a 2:1 ratio).<br><br><b>Middle C</b> is C4 = MIDI note 60. Heads up: Ableton labels it <b>C3</b>, so octave numbers can differ by one between programs.<br><br>Doubling a part an octave up or down is the easiest way to make it sound bigger.`, ex: [['C3, C4, C5', 'arp', ['C', 'C', 'C']]] },
    ],
    daw: 'Count rows in the piano roll to count semitones. Transposing a clip by ±12 moves it an octave; your synth\'s "Semi" knob does the same thing in semitones.',
    mistakes: ['Assuming every pair of white keys is a whole step (E–F and B–C are half steps).', 'Mixing up C3/C4 between Ableton and other software.'],
    links: [['Semitone (Wikipedia)', W('Semitone')], ['Octave (Wikipedia)', W('Octave')], ['Enharmonic equivalence', W('Enharmonic_equivalence')], ['musictheory.net lessons', 'https://www.musictheory.net/lessons']],
  },

  fifth: {
    book: 'Book ch. 5–7', mins: 5,
    cards: [
      { t: 'The perfect 5th', b: `Count up <b>7 semitones</b> from any note and you've got a <b>perfect 5th</b> (C → G). After the octave, it's the most stable, "fused" interval: the two notes vibrate in a simple 3:2 ratio.<br><br>Root + 5th is a <b>power chord</b>. It's neither major nor minor, which is why it sounds huge under distortion and works for basses and leads.`, ex: [['C + G', 'chord', ['C', 'G']], ['Power-chord riff', 'seq', [['C', 'G'], ['F', 'C'], ['G', 'D'], ['C', 'G']]]] },
      { t: 'What "in key" means', b: `A <b>key</b> is a set of 7 notes (a scale) plus a <b>home note</b> (the tonic). If your notes come from that set, nothing clashes badly, and you're <b>in key</b>.<br><br>Think of the key as a template laid over the piano roll: some rows are "allowed", the rest are outside. Ableton's Scale mode shades exactly those rows.` },
      { t: 'The major scale recipe', b: `Every major scale uses the same step pattern: <b>W W H W W W H</b> (whole, whole, half, whole, whole, whole, half).<br><br>Start it on C and you get only white keys: <b>C D E F G A B</b>. Start it on G and you need one black key, <b>F♯</b>, to keep the pattern intact.`, ex: [['C major', 'arp', ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C']], ['G major (F♯)', 'arp', ['G', 'A', 'B', 'C', 'D', 'E', 'F#', 'G']]] },
      { t: 'Scale degrees have jobs', b: `Each note of the scale has a number and a name:<br>1 <b>tonic</b> (home) · 2 supertonic · 3 mediant · 4 subdominant · 5 <b>dominant</b> · 6 submediant · 7 <b>leading tone</b>.<br><br>The <b>leading tone</b> is a half step below the tonic, so it pulls upward to home. The <b>dominant</b> (5) is the strongest support note after the tonic.`, ex: [['Leading tone → tonic', 'arp', ['B', 'C']], ['1 – 5 – 1', 'arp', ['C', 'G', 'C']]] },
    ],
    daw: 'Turn on your DAW\'s scale highlighting (Ableton: Scale mode) and only draw on the shaded rows. Starting in C major or A minor keeps you on white keys while you learn.',
    mistakes: ['Assuming the first note of a song is always the key. Listen for the most stable "home" note.', 'Forgetting a sharp or flat, e.g. playing F instead of F♯ in G major.'],
    links: [['Perfect fifth', W('Perfect_fifth')], ['Major scale', W('Major_scale')], ['Scale degree', W('Degree_(music)')]],
  },

  triads: {
    book: 'Book ch. 8 & 10', mins: 5,
    cards: [
      { t: 'Chords are stacked 3rds', b: `A <b>triad</b> is three notes: a <b>root</b>, a <b>3rd</b> and a <b>5th</b>. In the scale, just take every other note: C (skip D) E (skip F) G.<br><br>The 3rd comes in two sizes: <b>major 3rd = 4 semitones</b>, <b>minor 3rd = 3 semitones</b>. Which one you stack decides the chord's mood.`, ex: [['C – E – G', 'arp', ['C', 'E', 'G']]] },
      { t: 'Four flavours of triad', b: `<b>Major</b> = 4 + 3 semitones: bright, settled.<br><b>Minor</b> = 3 + 4: darker, emotional.<br><b>Diminished</b> = 3 + 3: tense, unstable.<br><b>Augmented</b> = 4 + 4: dreamy, unresolved.<br><br>In every major and minor triad the root-to-5th distance is a perfect 5th (7 semitones). Use that as your check.`, ex: [['C major', 'chord', ['C', 'E', 'G']], ['C minor', 'chord', ['C', 'Eb', 'G']], ['C dim', 'chord', ['C', 'Eb', 'Gb']], ['C aug', 'chord', ['C', 'E', 'G#']]] },
      { t: 'Inversions: same chord, new shape', b: `Move the bottom note up an octave and you get an <b>inversion</b>. It's the same chord with a different shape.<br>• <b>Root position</b>: root on the bottom (C E G)<br>• <b>1st inversion</b>: 3rd on the bottom (E G C)<br>• <b>2nd inversion</b>: 5th on the bottom (G C E)<br><br>The book shows Moby's "Porcelain" sounding right only once one chord is put in 2nd inversion: the top notes then match the line you hear.`, ex: [['Root position', 'chord', ['C', 'E', 'G']], ['1st inversion', 'chord', ['E', 'G', 'C']], ['2nd inversion', 'chord', ['G', 'C', 'E']]] },
      { t: 'Reading chord names', b: `<b>C</b> = C major · <b>Cm</b> = C minor · <b>C°</b> = C diminished · <b>C+</b> = C augmented.<br><b>C/E</b> = a C chord with E in the bass (a slash chord, often an inversion).<br><br>To build any triad: find the root, count up the 3rd (3 or 4 semitones), then the 5th.` },
    ],
    daw: 'Draw a triad as three stacked notes, skipping one scale note between each. When moving between chords, pick the inversion that stays closest so the loop sounds smooth.',
    mistakes: ['Forgetting the key\'s accidentals (D major\'s 3rd is F♯, not F).', 'Jumping every chord in root position, which makes loops sound clunky.'],
    links: [['Triad', W('Triad_(music)')], ['Inversion', W('Inversion_(music)')]],
  },

  diatonic: {
    book: 'Book ch. 9 & 13', mins: 5,
    cards: [
      { t: 'Every key has 7 chords', b: `Build a triad on each note of the scale, using <b>only notes from the key</b>, and you get the key's <b>diatonic chords</b>.<br><br>In C major: <b>C · Dm · Em · F · G · Am · B°</b>. Any combination of these will sound like it belongs together.`, ex: [['All 7 chords of C major', 'seq', [['C', 'E', 'G'], ['D', 'F', 'A'], ['E', 'G', 'B'], ['F', 'A', 'C'], ['G', 'B', 'D'], ['A', 'C', 'E'], ['B', 'D', 'F']]]] },
      { t: 'The pattern never changes', b: `Every major key has the same chord qualities in the same order:<br><b>Maj · min · min · Maj · Maj · min · dim</b><br><br>Every natural minor key: <b>min · dim · Maj · min · min · Maj · Maj</b>.<br><br>Memorise these two lines and you know the chords of all 24 keys.` },
      { t: 'Roman numerals', b: `Roman numerals name chords by <b>scale degree</b>, not letter: <b>I ii iii IV V vi vii°</b>. Uppercase = major, lowercase = minor, ° = diminished.<br><br>That makes a progression key-independent. <b>I–V–vi–IV</b> is C–G–Am–F in C, and A–E–F♯m–D in A. Learn it once, use it in any key.`, ex: [['I–V–vi–IV in C', 'seq', [['C', 'E', 'G'], ['G', 'B', 'D'], ['A', 'C', 'E'], ['F', 'A', 'C']]], ['I–V–vi–IV in A', 'seq', [['A', 'C#', 'E'], ['E', 'G#', 'B'], ['F#', 'A', 'C#'], ['D', 'F#', 'A']]]], create: { tonic: 'C', mode: 'major', romans: ['I', 'V', 'vi', 'IV'] } },
      { t: 'Chords have jobs (function)', b: `• <b>Tonic</b> (I, also iii, vi): home, rest.<br>• <b>Subdominant</b> (IV, ii): moving away.<br>• <b>Dominant</b> (V, vii°): tension that wants to go home.<br><br>Satisfying progressions often move <b>home → away → tension → home</b>. The classic <b>ii–V–I</b> is exactly that.`, ex: [['ii – V – I', 'seq', [['D', 'F', 'A'], ['G', 'B', 'D'], ['C', 'E', 'G']]]] },
    ],
    daw: 'Loop any 4 diatonic chords; it will almost always work. Then make it interesting with rhythm, inversions and one colour chord (see Advanced Harmonies).',
    mistakes: ['Random chord order with no tension: add a V or IV for motion.', 'Overusing vii° as a plain triad. It\'s rare in EDM; it\'s usually treated as part of V7.'],
    links: [['Roman numeral analysis', W('Roman_numeral_analysis')], ['Diatonic function', W('Diatonic_function')]],
  },

  sevenths: {
    book: 'Book ch. 12', mins: 5,
    cards: [
      { t: 'One more 3rd on top', b: `Stack another 3rd on a triad and you get a <b>7th chord</b>: root, 3rd, 5th, <b>7th</b>. The extra note adds richness and colour. It's the house, lo-fi, R&B and jazz sound.`, ex: [['C → Cmaj7', 'seq', [['C', 'E', 'G'], ['C', 'E', 'G', 'B']]]] },
      { t: 'The 7th-chord family', b: `<b>maj7</b> (major triad + major 7th): dreamy, lush.<br><b>7</b> / dominant (major triad + minor 7th): bluesy, wants to resolve.<br><b>m7</b> (minor triad + minor 7th): smooth, mellow.<br><b>ø7</b> / m7♭5 (diminished triad + minor 7th): dark, unstable.<br><b>°7</b> (diminished + diminished 7th): horror-movie tension.<br><b>m(maj7)</b> (minor + major 7th): the book's "<b>Psycho Chord</b>", eerie and rare.`, ex: [['Cmaj7', 'chord', ['C', 'E', 'G', 'B']], ['C7', 'chord', ['C', 'E', 'G', 'Bb']], ['Cm7', 'chord', ['C', 'Eb', 'G', 'Bb']], ['Cø7', 'chord', ['C', 'Eb', 'Gb', 'Bb']], ['C°7', 'chord', ['C', 'Eb', 'Gb', 'A']], ['Cm(maj7)', 'chord', ['C', 'Eb', 'G', 'B']]] },
      { t: '7ths inside a key', b: `Using only key notes, a major key gives:<br><b>Imaj7 · ii7 · iii7 · IVmaj7 · V7 · vi7 · viiø7</b><br><br>Only <b>V</b> produces a dominant 7th, and that's where the name comes from. The jazz/house staple <b>ii7–V7–Imaj7</b> uses this directly.`, ex: [['Dm7 – G7 – Cmaj7', 'seq', [['D', 'F', 'A', 'C'], ['G', 'B', 'D', 'F'], ['C', 'E', 'G', 'B']]]], create: { tonic: 'C', mode: 'major', romans: ['ii7', 'V7', 'Imaj7', 'vi7'] } },
      { t: 'Tension and resolution', b: `In G7 the 3rd (B) and the 7th (F) are a <b>tritone</b> apart, the most unstable interval. B rises to C and F falls to E, landing on the C chord.<br><br>That pull is why V7 → I feels like a "full stop". End a phrase or build on V7 to make the next section land hard.`, ex: [['G7 → C', 'seq', [['G', 'B', 'D', 'F'], ['C', 'E', 'G', 'C']]]] },
    ],
    daw: 'Swap your triads for 7ths for instant depth. If it gets muddy, drop the 5th and keep the 7ths in the mid/upper register.',
    mistakes: ['Calling C7 "C major 7". C7 is dominant (B♭); Cmaj7 has B.', 'Stacking 7th chords too low on the keyboard, which turns them to mud.'],
    links: [['Seventh chord', W('Seventh_chord')], ['Dominant seventh chord', W('Dominant_seventh_chord')]],
  },

  intervals: {
    book: 'Book ch. 11', mins: 5,
    cards: [
      { t: 'Measuring distance', b: `An <b>interval</b> is the distance between two notes. Count it in semitones:<br>minor 2nd 1 · Major 2nd 2 · minor 3rd 3 · Major 3rd 4 · Perfect 4th 5 · <b>tritone 6</b> · Perfect 5th 7 · minor 6th 8 · Major 6th 9 · minor 7th 10 · Major 7th 11 · octave 12.`, ex: [['Major 2nd', 'chord', ['C', 'D']], ['Perfect 4th', 'chord', ['C', 'F']], ['Major 6th', 'chord', ['C', 'A']]] },
      { t: 'Consonance and dissonance', b: `<b>Consonant</b> (stable): octaves, 5ths, 4ths, 3rds, 6ths.<br><b>Dissonant</b> (tense): 2nds, 7ths and the <b>tritone</b>, once nicknamed "the devil in music".<br><br>Dissonance isn't bad. It's <b>tension</b>, and music is a cycle of tension and release.`, ex: [['Consonant: C + G', 'chord', ['C', 'G']], ['Dissonant: C + D♭', 'chord', ['C', 'Db']], ['Tritone: C + F♯', 'chord', ['C', 'F#']]] },
      { t: 'Inverting intervals', b: `Flip an interval (bottom note up an octave) and the numbers add to <b>9</b>: a 3rd becomes a 6th, a 2nd becomes a 7th, a 4th becomes a 5th. Major ↔ minor swap; perfect stays perfect.<br><br>So C up to E (major 3rd) = E up to C (minor 6th).`, ex: [['C → E (M3)', 'arp', ['C', 'E']], ['E → C (m6)', 'arp', ['E', 'C']]] },
      { t: 'sus and add chords', b: `<b>sus2</b> and <b>sus4</b> replace the 3rd with a 2nd or 4th, so the chord is neither major nor minor: open, floaty, unresolved. <b>add9</b> keeps the 3rd and adds a 9th (the 2nd, an octave up) for sparkle.`, ex: [['Csus2 → Csus4 → C', 'seq', [['C', 'D', 'G'], ['C', 'F', 'G'], ['C', 'E', 'G']]], ['Cadd9', 'chord', ['C', 'E', 'G', 'D']]] },
    ],
    daw: '4ths and 5ths make strong lead and bass intervals. sus chords are great for ambient pads and intros, because the mood stays ambiguous until you resolve.',
    mistakes: ['Counting the start note as 0 when naming intervals. C to E is a 3rd: C(1) D(2) E(3).'],
    links: [['Interval', W('Interval_(music)')], ['Suspended chord', W('Suspended_chord')], ['Consonance and dissonance', W('Consonance_and_dissonance')]],
  },

  minor: {
    book: 'Book ch. 15 & 17', mins: 6,
    cards: [
      { t: 'The natural minor scale', b: `Minor uses a different step pattern: <b>W H W W H W W</b>. Compared with major on the same note, it has a <b>♭3, ♭6 and ♭7</b>.<br><br>That lowered 3rd is what makes it sound darker. A huge share of electronic music is in minor.`, ex: [['C major', 'arp', ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C']], ['C minor', 'arp', ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb', 'C']]] },
      { t: 'Relative keys share notes', b: `Every major key has a <b>relative minor</b> with exactly the same notes, starting on its <b>6th degree</b> (3 semitones down). C major ↔ A minor, G major ↔ E minor.<br><br>The notes are the same, but which one feels like "home" changes everything.`, ex: [['C major chord', 'chord', ['C', 'E', 'G']], ['A minor chord', 'chord', ['A', 'C', 'E']]] },
      { t: 'Chords in a minor key', b: `Natural minor gives: <b>i · ii° · III · iv · v · VI · VII</b>.<br><br>The EDM workhorse is <b>i–VI–III–VII</b> (Am–F–C–G in A minor), the same four chords as the pop anthem, just starting from the minor chord.`, ex: [['i – VI – III – VII', 'seq', [['A', 'C', 'E'], ['F', 'A', 'C'], ['C', 'E', 'G'], ['G', 'B', 'D']]]], create: { tonic: 'A', mode: 'minor', romans: ['i', 'VI', 'III', 'VII'] } },
      { t: 'Harmonic and melodic minor', b: `Natural minor's v chord is minor, so it doesn't pull home very hard. <b>Harmonic minor</b> raises the 7th, turning v into a major <b>V</b> with a leading tone (Bonobo's "Noctuary" is i–V this way).<br><br><b>Melodic minor</b> raises both the 6th and the 7th to smooth out the gap.`, ex: [['A harmonic minor', 'arp', ['A', 'B', 'C', 'D', 'E', 'F', 'G#', 'A']], ['Am – E – Am', 'seq', [['A', 'C', 'E'], ['E', 'G#', 'B'], ['A', 'C', 'E']]]] },
    ],
    daw: 'Common EDM keys include A minor, F minor and C minor. Borrow the major V from harmonic minor at the end of a build-up for a stronger drop.',
    mistakes: ['Forgetting minor\'s v is minor unless you deliberately raise the 7th.', 'Mixing up relative (same notes, e.g. C/Am) and parallel (same root, e.g. C/Cm) keys.'],
    links: [['Minor scale', W('Minor_scale')], ['Relative key', W('Relative_key')], ['Harmonic minor scale', W('Harmonic_minor_scale')]],
  },

  circle: {
    book: 'Book ch. 19', mins: 5,
    cards: [
      { t: 'Keys arranged by 5ths', b: `Put C at the top, then go clockwise in perfect 5ths: C · G · D · A · E · B · F♯ … Each step <b>adds one sharp</b>. Counter-clockwise, in 4ths: F · B♭ · E♭ …, each step adds one flat.<br><br>The inner ring holds each key's relative minor.`, ex: [['C → G → D → A', 'seq', [['C', 'E', 'G'], ['G', 'B', 'D'], ['D', 'F#', 'A'], ['A', 'C#', 'E']]]] },
      { t: 'Neighbours are close relatives', b: `Keys next to each other on the circle differ by just <b>one note</b>. That makes them the smoothest keys to move to (modulate) or borrow chords from.<br><br>Keys across the circle share few notes and sound jarring together.` },
      { t: 'Borrowing from a neighbour', b: `The book's Deadmau5 "Ghosts N Stuff" analysis: in <b>B♭ minor</b> the iv chord should be E♭ minor, but the track uses <b>E♭ major</b>. It's borrowed from <b>F minor</b>, one step around the circle, where E♭ is major. The result is i–VII–VI–<b>IV</b>, and that last chord lifts the loop.`, ex: [['B♭m – A♭ – G♭ – E♭', 'seq', [['Bb', 'Db', 'F'], ['Ab', 'C', 'Eb'], ['Gb', 'Bb', 'Db'], ['Eb', 'G', 'Bb']]]], create: { tonic: 'Bb', mode: 'minor', romans: ['i', 'VII', 'VI', 'IV'] } },
      { t: 'Using it to change key', b: `Need a lift for a new section? Move to a <b>neighbouring key</b> (smooth), to the <b>relative minor/major</b> (same notes, new mood), or simply <b>up a step</b> for a final drop (the classic energy boost).<br><br>Order of sharps: <b>F C G D A E B</b>. Flats: the reverse.` },
    ],
    daw: 'Use the Circle & keys tool during practice to see any key\'s chords. When a chord sounds "almost right", try its version from a neighbouring key.',
    mistakes: ['Jumping to a distant key without a pivot chord, which sounds like a mistake instead of a choice.'],
    links: [['Circle of fifths', W('Circle_of_fifths')], ['Modulation', W('Modulation_(music)')]],
  },

  extensions: {
    book: 'Book ch. 25', mins: 4,
    cards: [
      { t: 'Keep stacking 3rds', b: `Past the 7th come the <b>9th, 11th and 13th</b>. They're just the 2nd, 4th and 6th an octave higher. Adding them makes chords denser and more colourful.`, ex: [['Am7 → Am9 → Am11', 'seq', [['A', 'C', 'E', 'G'], ['A', 'C', 'E', 'G', 'B'], ['A', 'C', 'E', 'G', 'B', 'D']]]] },
      { t: 'add9 vs 9', b: `<b>Cadd9</b> = C triad + D (no 7th): bright and open.<br><b>C9</b> = C7 + D (it includes B♭): funky and bluesy.<br><b>Cmaj9</b> = Cmaj7 + D: lush and dreamy.<br><br>"9" on its own always implies a 7th underneath.`, ex: [['Cadd9', 'chord', ['C', 'E', 'G', 'D']], ['C9', 'chord', ['C', 'E', 'G', 'Bb', 'D']], ['Cmaj9', 'chord', ['C', 'E', 'G', 'B', 'D']]] },
      { t: 'Texture density', b: `The book calls this <b>texture density</b>: how many notes are sounding. Boards of Canada lean on dense, smeared chords (their "Everything You Do Is a Balloon" loop is ii7–iv7–i7–ii7 in G minor).<br><br>To keep dense chords clear: drop the 5th, keep the bass simple, and put the extensions on top.`, create: { tonic: 'G', mode: 'minor', romans: ['ii7', 'iv7', 'i7', 'ii7'] } },
    ],
    daw: 'Extensions shine on pads and electric pianos. Spread voicings over two octaves and let the bass play only the root.',
    mistakes: ['Putting 9ths and 11ths low in the keyboard, where they turn to mud.'],
    links: [['Extended chord', W('Extended_chord')]],
  },

  melody: {
    book: 'Course Part 2 · book ch. 18 & 21', mins: 6,
    cards: [
      { t: 'Chord tones are your anchors', b: `The notes of the current chord are the <b>stable</b> ones. Landing on them on <b>strong beats</b> (beat 1, beat 3) sounds intentional and resolved.<br><br>Other scale notes create movement and are best placed between the anchors.`, ex: [['Chord tones over C', 'arp', ['C', 'E', 'G', 'C']]] },
      { t: 'Passing and neighbour tones', b: `<b>Passing tone</b>: steps between two <i>different</i> chord tones (C–<b>D</b>–E).<br><b>Neighbour tone</b>: steps away and comes back to the <i>same</i> chord tone (E–<b>F</b>–E).<br><br>These are the "glue" of good melodies.`, ex: [['Passing: C D E', 'arp', ['C', 'D', 'E']], ['Neighbour: E F E', 'mel', ['E', 'F', 'E']]] },
      { t: 'Shape: steps, leaps, contour', b: `Good melodies mostly move by <b>step</b>, with occasional <b>leaps</b> for drama. After a big leap, step back the other way.<br><br>Give a phrase <b>one high point</b>, and aim for an arch or wave shape rather than a flat line.`, ex: [['Arch-shaped phrase', 'mel', ['C', 'D', 'E', 'G', 'A', 'G', 'E', 'D', 'C']]] },
      { t: 'Motifs and repetition', b: `Hooks are built from a short <b>motif</b> (1–2 bars) that repeats with small changes: a different last note, a shifted rhythm, the same shape on a new chord.<br><br>Try <b>call and response</b>: bar 1 asks (ends unresolved), bar 2 answers (lands on the tonic). Pentatonic notes are a safe starting palette.`, ex: [['Minor pentatonic motif', 'mel', ['A', 'C', 'D', 'E', 'D', 'C', 'A']]] },
    ],
    daw: 'Write melodies over a looping chord progression (use the Create tab). Turn on scale highlighting, then vary rhythm before you vary pitch.',
    mistakes: ['Too many notes: leave space.', 'Never landing on chord tones, which makes the melody feel aimless.', 'Constant leaps, which are hard to follow.'],
    links: [['Nonchord tone', W('Nonchord_tone')], ['Motif', W('Motif_(music)')]],
  },

  bass: {
    book: 'Book ch. 10 & 21', mins: 5,
    cards: [
      { t: 'The bass defines the harmony', b: `Whatever note is lowest tells the ear what the chord <i>is</i>. Most of the time the bass plays the <b>root</b> of each chord, the foundation everything else sits on.` },
      { t: 'Inversions and slash chords', b: `Put the chord's 3rd or 5th in the bass (an <b>inversion</b>) and the bass line moves more smoothly: C – C/E – F instead of C – F.<br><br>A <b>slash chord</b> like A♭/F means "A♭ chord over an F bass". The book explains the last bar of Aphex Twin's "Windowlicker" this way (i–III–VI–VI/F in C minor).`, ex: [['C → C/E → F', 'seq', [['C', 'E', 'G'], ['E', 'G', 'C'], ['F', 'A', 'C']]]] },
      { t: 'Rhythm patterns for bass', b: `• <b>Sustained root</b>: deep, simple (ambient, intros).<br>• <b>Off-beat</b>: notes between the kicks (classic house).<br>• <b>Driving 8ths</b>: steady energy (trance, techno).<br>• <b>Root–5th alternation</b>: movement without changing the harmony.<br>• <b>Octave jumps</b>: bounce (disco, nu-disco).`, ex: [['Root–5th alternation', 'mel', ['C', 'G', 'C', 'G']]] },
      { t: 'Low-end rules', b: `Keep the sub <b>mono and simple</b>. Avoid 3rds down low, because they clash and muddy. <b>Tune your kick and bass to the key</b> (see Pitch & Tuning), and sidechain the bass to the kick so they don't fight.` },
    ],
    daw: 'Write the bass on its own track an octave or two below the chords. Try the same progression with each bass rhythm in the Create tab to hear how much genre comes from the bass alone.',
    mistakes: ['Busy basslines under busy chords: one of them should be simple.', 'Bass notes that clash with the kick\'s pitch.'],
    links: [['Bassline', W('Bassline')]],
  },

  chromatic: {
    book: 'Book ch. 23 & 29', mins: 4,
    cards: [
      { t: 'Notes outside the key', b: `A key uses 7 of the 12 notes, so the other 5 are <b>chromatic</b> (from the Greek for "colour"). Used briefly, they add spice. Used constantly, they erase the sense of key, as in fully chromatic 20th-century music.` },
      { t: 'Chromatic passing tones', b: `Fill a whole step with a half step in between: C – <b>C♯</b> – D. The outside note is brief and resolves immediately, so it sounds slick rather than wrong.`, ex: [['C – C♯ – D – D♯ – E', 'arp', ['C', 'C#', 'D', 'D#', 'E']]] },
      { t: 'Dissonance and resolution', b: `Tension comes from dissonance: 2nds, 7ths, and especially the <b>tritone</b>. The trick is <b>resolution</b>: let the tense note move by step to a stable one. You can delay the resolution to stretch the tension (great for build-ups).`, ex: [['B + F → C + E', 'seq', [['B', 'F'], ['C', 'E']]]] },
      { t: 'Chromatic chords', b: `Some chords bring in an outside note on purpose: <b>secondary dominants</b> (E major in C pointing to Am) and <b>borrowed chords</b> (Fm in C). Both are covered in Advanced Harmonies.`, ex: [['C – E – Am', 'seq', [['C', 'E', 'G'], ['E', 'G#', 'B'], ['A', 'C', 'E']]]] },
    ],
    daw: 'Add a single chromatic passing note in a bassline or lead, approaching the next chord\'s root from a half step below.',
    mistakes: ['Landing on a chromatic note on a strong beat and staying there. Resolve it.'],
    links: [['Chromaticism', W('Chromaticism')], ['Consonance and dissonance', W('Consonance_and_dissonance')]],
  },

  songs: {
    book: 'Book ch. 14, 16, 18, 20, 22, 26, 28', mins: 6,
    cards: [
      { t: 'How to analyse a track', b: `The book's repeatable method:<br>1. <b>Transcribe the bass line</b>: it outlines the chords.<br>2. <b>Find the key</b>: which note feels like home? Check the bass notes against major and minor scales.<br>3. <b>Find the chords</b> using that key's diatonic chords.<br>4. <b>Write Roman numerals</b>.<br>5. <b>Explain the odd one out</b>: borrowed chord, mode, or slash chord.` },
      { t: 'The analyses at a glance', b: `<b>Ghosts N Stuff</b> (Deadmau5): B♭ minor, i–VII–VI–IV (IV borrowed from F minor).<br><b>Get Lucky</b> (Daft Punk): B Dorian, i–III–v–IV.<br><b>Windowlicker</b> (Aphex Twin): C minor, i–III–VI–VI/F.<br><b>Everything You Do Is a Balloon</b> (Boards of Canada): G minor, ii7–iv7–i7–ii7.<br><b>Scary Monsters and Nice Sprites</b> (Skrillex): G minor, VI–VII–i–VII.<br><b>Daisy</b> (Zedd): D major, I–ii–vi7–V7.<br><b>Noctuary</b> (Bonobo): G minor, i–V (harmonic minor).`, ex: [['Get Lucky loop (B Dorian)', 'seq', [['B', 'D', 'F#'], ['D', 'F#', 'A'], ['F#', 'A', 'C#'], ['E', 'G#', 'B']]]], create: { tonic: 'B', mode: 'minor', romans: ['i', 'III', 'v', 'IV'] } },
      { t: 'Why this matters for your tracks', b: `Roman numerals turn any track you love into a <b>recipe</b> you can reuse in your own key and style. As the book puts it, you can't copyright a chord progression.<br><br>Analyse one favourite track a week, then rebuild its progression in the Create tab.` },
    ],
    daw: 'Load a reference track, loop 8 bars, and find the bass notes in your piano roll by ear. Then work out the key and chords.',
    mistakes: ['Deciding the key from the first chord alone. Scary Monsters starts on E♭, but it\'s in G minor.'],
    links: [['Roman numeral analysis', W('Roman_numeral_analysis')]],
  },

  modes: {
    book: 'Book ch. 27–28', mins: 6,
    cards: [
      { t: 'Same notes, new home', b: `Play C major's notes but treat <b>D</b> as home and you get <b>D Dorian</b>. Start on E and it's <b>E Phrygian</b>, and so on. Seven starting points give <b>seven modes</b>, each with its own mood.`, ex: [['D Dorian', 'arp', ['D', 'E', 'F', 'G', 'A', 'B', 'C', 'D']], ['E Phrygian', 'arp', ['E', 'F', 'G', 'A', 'B', 'C', 'D', 'E']]] },
      { t: 'From brightest to darkest', b: `<b>Lydian</b> (major with ♯4): dreamy, floating.<br><b>Ionian</b>: the plain major scale.<br><b>Mixolydian</b> (major with ♭7): bluesy, rock.<br><b>Dorian</b> (minor with a ♮6): soulful, funky.<br><b>Aeolian</b>: the plain natural minor.<br><b>Phrygian</b> (minor with ♭2): dark, exotic, metal/techno.<br><b>Locrian</b> (♭2 and ♭5): unstable, rarely home.` },
      { t: 'Signature notes', b: `Each mode has one note that sets it apart from plain major or minor: Dorian's <b>♮6</b>, Phrygian's <b>♭2</b>, Lydian's <b>♯4</b>, Mixolydian's <b>♭7</b>.<br><br>If you don't feature that note, listeners just hear major or minor.`, ex: [['F Lydian (B natural)', 'arp', ['F', 'G', 'A', 'B', 'C', 'D', 'E', 'F']], ['G Mixolydian (F natural)', 'arp', ['G', 'A', 'B', 'C', 'D', 'E', 'F', 'G']]] },
      { t: 'Modal chord loops', b: `Modes shine as two- to four-chord vamps:<br>• Dorian: <b>i – IV</b> (the major IV is the giveaway).<br>• Mixolydian: <b>I – ♭VII</b>.<br>• Phrygian: <b>i – ♭II</b>.<br><br>The book's Get Lucky analysis: <b>B Dorian, i–III–v–IV</b>. The E major chord (with G♯) is the Dorian flavour.`, ex: [['Dorian vamp: Dm – G', 'seq', [['D', 'F', 'A'], ['G', 'B', 'D'], ['D', 'F', 'A'], ['G', 'B', 'D']]]], create: { tonic: 'D', mode: 'minor', romans: ['i', 'IV', 'i', 'IV'] } },
    ],
    daw: 'Pick a mode for mood, write a 2-chord vamp that includes the signature note, and keep the bass on the tonic so the mode\'s home is clear.',
    mistakes: ['Writing "in Dorian" but never using the ♮6. That\'s just minor.'],
    links: [['Mode (music)', W('Mode_(music)')]],
  },

  penta: {
    book: 'Course Part 3', mins: 4,
    cards: [
      { t: 'Five notes, zero clashes', b: `Pentatonic scales drop the two notes that form half steps, so nothing rubs.<br><b>Major pentatonic</b>: 1 2 3 5 6 (C D E G A).<br><b>Minor pentatonic</b>: 1 ♭3 4 5 ♭7 (A C D E G).`, ex: [['C major pentatonic', 'arp', ['C', 'D', 'E', 'G', 'A', 'C']], ['A minor pentatonic', 'arp', ['A', 'C', 'D', 'E', 'G', 'A']]] },
      { t: 'Relatives and the blues', b: `C major pentatonic and A minor pentatonic use the <b>same five notes</b>, like relative keys. Add the <b>♭5</b> to minor pentatonic and you get the <b>blues scale</b>: A C D <b>E♭</b> E G.`, ex: [['A blues scale', 'arp', ['A', 'C', 'D', 'Eb', 'E', 'G', 'A']]] },
      { t: 'Using pentatonics', b: `Because there are no half steps, the key's pentatonic sounds good over <b>every diatonic chord</b>. That makes it perfect for quick hooks, vocal chops, arps and basslines. When you're stuck, write the first idea in pentatonic and add the other notes later.` },
    ],
    daw: 'Set your DAW scale mode to minor pentatonic and improvise a lead over your loop: it\'s almost impossible to hit a wrong note.',
    mistakes: ['Only ever using pentatonic, which can sound generic. Add the missing notes as passing tones.'],
    links: [['Pentatonic scale', W('Pentatonic_scale')], ['Blues scale', W('Blues_scale')]],
  },

  mediants: {
    book: 'Course Part 3', mins: 4,
    cards: [
      { t: 'Chords a 3rd apart', b: `Chords whose roots are a <b>3rd apart</b> are <b>mediants</b>. Inside a key they share two notes (C and Am share C and E), so they swap smoothly.` },
      { t: 'Chromatic mediants', b: `Make both chords the <b>same quality</b> (both major) with roots a major or minor 3rd apart, and you get a <b>chromatic mediant</b>. From C major: <b>E, A♭, A and E♭ major</b>.<br><br>They share only one note and bring in outside notes, giving that sudden, cinematic, "camera-pans-up" feeling.`, ex: [['C → E', 'seq', [['C', 'E', 'G'], ['E', 'G#', 'B']]], ['C → A♭', 'seq', [['C', 'E', 'G'], ['Ab', 'C', 'Eb']]], ['C → E♭', 'seq', [['C', 'E', 'G'], ['Eb', 'G', 'Bb']]]] },
      { t: 'Using them well', b: `Hold the <b>common tone</b> in the same voice and move the other notes by small steps. That keeps the shift magical rather than random. They work best at <b>section changes</b>: into a drop, a breakdown, or a final chorus lift.` },
    ],
    daw: 'At the end of a breakdown, jump from I to the major chord a major 3rd up (C → E) for a dramatic lift into the next section.',
    mistakes: ['Using them every bar, which loses the sense of key.'],
    links: [['Chromatic mediant', W('Chromatic_mediant')]],
  },

  advanced: {
    book: 'Book ch. 19.4 · Course Part 3', mins: 6,
    cards: [
      { t: 'Modal borrowing', b: `Borrow chords from the <b>parallel</b> key (same root, opposite mode). In a major key, the favourites from minor are <b>iv, ♭VI, ♭VII, ♭III</b>.<br><br>One borrowed chord instantly adds emotion. <b>IV → iv → I</b> is the classic bittersweet move.`, ex: [['C – F – Fm – C', 'seq', [['C', 'E', 'G'], ['F', 'A', 'C'], ['F', 'Ab', 'C'], ['C', 'E', 'G']]], ['C – A♭ – B♭ – C', 'seq', [['C', 'E', 'G'], ['Ab', 'C', 'Eb'], ['Bb', 'D', 'F'], ['C', 'E', 'G']]]], create: { tonic: 'C', mode: 'major', romans: ['I', 'IV', 'iv', 'I'] } },
      { t: 'Secondary dominants', b: `Any chord can get its own "V". <b>V7/vi</b> in C is E7, which points hard at Am. <b>V7/V</b> is D7, which points at G.<br><br>You're briefly treating another chord as home, using one chromatic note for a strong pull.`, ex: [['C – E7 – Am', 'seq', [['C', 'E', 'G'], ['E', 'G#', 'B', 'D'], ['A', 'C', 'E']]], ['C – D7 – G', 'seq', [['C', 'E', 'G'], ['D', 'F#', 'A', 'C'], ['G', 'B', 'D']]]] },
      { t: 'More colours', b: `<b>Picardy third</b>: a minor song ends on a major tonic, a bright surprise.<br><b>Neapolitan ♭II</b>: a major chord on the lowered 2nd, dark and dramatic (D♭ in C minor).<br><b>Tritone substitution</b>: replace V7 with the dominant 7th a tritone away (D♭7 for G7). It shares the same tension notes.`, ex: [['Am – Dm – E – A (Picardy)', 'seq', [['A', 'C', 'E'], ['D', 'F', 'A'], ['E', 'G#', 'B'], ['A', 'C#', 'E']]]] },
    ],
    daw: 'Take a loop you like and change just one chord to a borrowed or secondary chord. ✨ Spice it in the Create tab does this and explains it.',
    mistakes: ['Stacking several colour chords in a row, which loses the key. One per loop is plenty.'],
    links: [['Borrowed chord', W('Borrowed_chord')], ['Secondary chord', W('Secondary_chord')], ['Neapolitan chord', W('Neapolitan_chord')]],
  },

  exotic: {
    book: 'Book ch. 17 · Course Part 3', mins: 5,
    cards: [
      { t: 'Beyond major and minor', b: `"Exotic" scales use unusual step sizes, especially the <b>augmented 2nd</b> (3 semitones between neighbouring notes), which instantly sounds Middle-Eastern, Eastern European or cinematic.` },
      { t: 'The harmonic-minor family', b: `<b>Harmonic minor</b>: natural minor with a raised 7th.<br><b>Phrygian dominant</b>: its 5th mode (E F G♯ A B C D), the classic "desert" sound.<br><b>Hungarian minor</b>: harmonic minor with a raised 4th.<br><b>Double harmonic</b>: major with ♭2 and ♭6.`, ex: [['E Phrygian dominant', 'arp', ['E', 'F', 'G#', 'A', 'B', 'C', 'D', 'E']], ['C double harmonic', 'arp', ['C', 'Db', 'E', 'F', 'G', 'Ab', 'B', 'C']]] },
      { t: 'Symmetrical scales', b: `<b>Whole tone</b>: only whole steps, six notes, no clear home, so it sounds like a dream sequence.<br><b>Diminished</b> (half-whole): alternating half and whole steps, eight notes, tense and spooky.`, ex: [['C whole tone', 'arp', ['C', 'D', 'E', 'F#', 'G#', 'A#', 'C']], ['C diminished (H–W)', 'arp', ['C', 'Db', 'Eb', 'E', 'F#', 'G', 'A', 'Bb', 'C']]] },
      { t: 'Using exotic scales', b: `A little goes a long way. Use one exotic run in a lead, or one phrygian-dominant riff over an otherwise normal minor track. Keep the bass on the tonic so the ear has something stable to hold onto.` },
    ],
    daw: 'Over a simple i-chord drone, improvise with E Phrygian dominant, then switch back to natural minor and hear the difference.',
    mistakes: ['Writing a whole track in an exotic scale, which quickly sounds like a cliché.'],
    links: [['Phrygian dominant scale', W('Phrygian_dominant_scale')], ['Whole-tone scale', W('Whole-tone_scale')], ['Octatonic scale', W('Octatonic_scale')]],
  },

  progressions: {
    book: 'Book appendix & ch. 9, 13', mins: 6,
    cards: [
      { t: 'What makes a progression work', b: `• <b>Motion</b>: move between functions (home → away → tension → home).<br>• <b>Bass movement</b>: roots moving by 4ths and 5ths sound strong; moving by step sounds smooth.<br>• <b>The loop point</b>: ending on V or VII pulls you back to the start, so loops feel endless.` },
      { t: 'Mood recipes', b: `__LIB__` },
      { t: 'Making a progression yours', b: `The same four chords can sound completely different. Change:<br>• <b>Rhythm</b>: stabs, pulses, syncopation.<br>• <b>Voicing</b>: inversions, open spacing.<br>• <b>Colour</b>: 7ths and 9ths.<br>• <b>One borrowed chord</b>: emotion.<br>• <b>Pedal bass</b>: keep one bass note under changing chords.<br><br>Then build it in Create and press ✨ Spice it.`, create: { tonic: 'A', mode: 'minor', romans: ['i', 'VI', 'III', 'VII'] } },
    ],
    daw: 'Build the progression in Create, export the MIDI, and change only rhythm and sound in your DAW: you\'ll hear how much the arrangement shapes the mood.',
    mistakes: ['Using the same progression for the whole track. Vary it in the breakdown.', 'Picking chords at random instead of by function and mood.'],
    links: [['Chord progression', W('Chord_progression')], ['I–V–vi–IV progression', W('I%E2%80%93V%E2%80%93vi%E2%80%93IV_progression')]],
  },

  rhythm: {
    book: 'Producer toolkit', mins: 5,
    cards: [
      { t: 'Tempo and the beat', b: `<b>BPM</b> = beats per minute. Most electronic music is in <b>4/4</b>: four beats per bar.<br><br>One beat lasts <b>60,000 ÷ BPM</b> milliseconds (468.75 ms at 128 BPM). That number syncs delays, LFOs and sidechain release to the groove.` },
      { t: 'The 16-step grid', b: `A 16-step sequencer is one bar of 1/16 notes. Steps <b>1, 5, 9, 13</b> are the beats (four-on-the-floor kick). Steps <b>5 and 13</b> are the backbeat (clap/snare). Steps <b>3, 7, 11, 15</b> are the off-beats (open hats in house).<br><br>Count it as "<b>1</b> e & a <b>2</b> e & a…".` },
      { t: 'Subdivisions', b: `• <b>Straight</b>: 1/4, 1/8, 1/16 (halving each time).<br>• <b>Triplets</b>: 3 in the space of 2 (1/8T = 12 per bar), rolling and swung.<br>• <b>Dotted</b>: ×1.5 (the dotted-1/8 delay is a classic).<br>• <b>Swing</b>: delays every second 16th for a shuffle.` },
      { t: 'Groove tricks', b: `<b>Syncopation</b>: accent the weak parts of the beat. <b>Half-time</b>: snare on beat 3 only, so 140 BPM feels like 70 (dubstep, trap). <b>Polyrhythm</b>: a 3-step pattern over a 4-step grid creates rolling movement.` },
    ],
    daw: 'Use the Tempo tool to set delay times. Try a 3/16 pattern (repeat every 3 steps) on a hat or synth over a 4/4 kick.',
    mistakes: ['Quantising everything 100%, which kills the groove. Try a little swing.'],
    links: [['Tempo', W('Tempo')], ['Syncopation', W('Syncopation')], ['Swing', W('Swing_(jazz_performance_style)')]],
  },

  structure: {
    book: 'Producer toolkit · book ch. 14 (form)', mins: 4,
    cards: [
      { t: 'Build in blocks of 8', b: `Electronic tracks are built from phrases of <b>8, 16 or 32 bars</b>. Listeners (and DJs) subconsciously expect changes at those points. Something should be added or removed every 8 bars.` },
      { t: 'The classic EDM shape', b: `<b>Intro</b> (DJ-friendly, sparse) → <b>Build-up</b> (rising tension: risers, snare rolls, filter sweeps) → <b>Drop</b> (full energy, main hook) → <b>Breakdown</b> (drums out, emotion) → <b>Build</b> → <b>Drop 2</b> → <b>Outro</b>.<br><br>Section length in seconds = bars × 4 × 60 ÷ BPM.` },
      { t: 'Harmony supports the arrangement', b: `End a build-up on the <b>V chord</b> (or hold it) so the drop's tonic lands with release. Use a <b>different progression or a borrowed chord</b> in the breakdown for contrast, then bring the main loop back.`, ex: [['Build ending on V → drop on i', 'seq', [['A', 'C', 'E'], ['F', 'A', 'C'], ['G', 'B', 'D'], ['E', 'G#', 'B'], ['A', 'C', 'E']]]] },
    ],
    daw: 'Arrange a reference track\'s sections as coloured blocks above your own track and copy the bar counts.',
    mistakes: ['A 4-minute loop with no change. Contrast is what makes a drop hit.'],
    links: [['Song structure', W('Song_structure')]],
  },

  tuning: {
    book: 'Producer toolkit · book ch. 3–4', mins: 5,
    cards: [
      { t: 'Pitch is frequency', b: `A4 = <b>440 Hz</b>. An octave up <b>doubles</b> the frequency (A5 = 880 Hz); an octave down halves it (A3 = 220 Hz). Each semitone multiplies by about 1.059.<br><br><b>100 cents = 1 semitone</b>. Detuning oscillators by 5–20 cents makes supersaws wide.` },
      { t: 'The harmonic series', b: `Every musical tone contains <b>overtones</b> at whole-number multiples of its frequency: octave, octave + 5th, two octaves, + major 3rd, + 5th, + ♭7…<br><br>That's why 5ths and major triads sound "natural", and why saw waves (all harmonics) sound bright and full.`, ex: [['Harmonics of C', 'arp', ['C', 'C', 'G', 'C', 'E', 'G', 'Bb', 'C']]] },
      { t: 'Tune your kick and 808', b: `A kick's sustained tone and an 808's fundamental are <b>notes</b>. If they don't match the key, the low end clashes. Tune them to the <b>root</b> (or the 5th) of your key.<br><br>Anchors: A1 = 55 Hz, E1 ≈ 41 Hz, C2 ≈ 65 Hz, F1 ≈ 44 Hz.` },
      { t: 'MIDI numbers', b: `MIDI notes are numbered 0–127; <b>60 = middle C</b>. Every +12 is an octave. Different DAWs name 60 as C4 or C3 (Ableton), so trust the number, not the name.` },
    ],
    daw: 'Put a spectrum analyser on your kick or 808 and read its peak frequency, then tune it with the sampler\'s transpose and fine controls.',
    mistakes: ['Pitch-shifting an 808 slide into notes outside the key.'],
    links: [['Harmonic series', W('Harmonic_series_(music)')], ['A440', W('A440_(pitch_standard)')], ['Cent', W('Cent_(music)')]],
  },

  voicing: {
    book: 'Book ch. 10 & 23', mins: 5,
    cards: [
      { t: 'Voicing: how notes are spread', b: `<b>Closed</b> voicing packs notes within an octave: tight and punchy, good for stabs. <b>Open</b> voicing spreads them out (root – 5th – 3rd): wide and clear, good for pads.<br><br>A general rule: <b>wide intervals low, close intervals high</b>.`, ex: [['C closed', 'chord', ['C', 'E', 'G']], ['C open', 'chord', ['C', 'G', 'E']]] },
      { t: 'Voice leading', b: `When changing chords, <b>keep notes the chords share</b> and move the others by the <b>smallest step</b>. The result glides instead of jumping. In the piano roll, smooth progressions barely move up or down.`, ex: [['C – F/C – G/B – C', 'seq', [['C', 'E', 'G'], ['C', 'F', 'A'], ['B', 'D', 'G'], ['C', 'E', 'G']]]] },
      { t: 'Cadences: musical punctuation', b: `• <b>Authentic</b> V → I: a full stop.<br>• <b>Plagal</b> IV → I: a soft "amen".<br>• <b>Half</b> (ending on V): a question mark, ideal before a drop.<br>• <b>Deceptive</b> V → vi: a plot twist.`, ex: [['Authentic G → C', 'seq', [['G', 'B', 'D'], ['C', 'E', 'G']]], ['Deceptive G → Am', 'seq', [['G', 'B', 'D'], ['A', 'C', 'E']]]] },
      { t: 'Register and mud', b: `Below roughly C3, close intervals (especially 3rds) blur together. Keep the low end to <b>roots, octaves and 5ths</b>, and move 3rds and 7ths up around middle C and above.` },
    ],
    daw: 'Turn on Smooth voice leading in Create and compare it with off: same chords, very different feel.',
    mistakes: ['Root-position chords jumping around the keyboard.', 'Thick chords in the bass register.'],
    links: [['Voice leading', W('Voice_leading')], ['Cadence', W('Cadence')]],
  },

  camelot: {
    book: 'Producer toolkit', mins: 3,
    cards: [
      { t: 'The circle of fifths, numbered', b: `The <b>Camelot wheel</b> relabels the circle of fifths for DJs: numbers <b>1–12</b> around the wheel, <b>A = minor</b>, <b>B = major</b>. 8B = C major, 8A = A minor.` },
      { t: 'Mixing rules', b: `Harmonically safe moves:<br>• <b>Same code</b> (8A → 8A).<br>• <b>±1</b> (8A → 7A or 9A): neighbouring key.<br>• <b>Switch letter</b> (8A ↔ 8B): relative major/minor.<br><br>Big jumps around the wheel tend to clash.` },
      { t: 'For producers', b: `Write tracks in keys that mix well with each other, and with the tracks you'd play them next to. Key-detection tools (and DJ software) show Camelot codes, so knowing your track's key helps DJs play it.` },
    ],
    daw: 'Note the key (and Camelot code) of every track you finish in its file name.',
    mistakes: ['Trusting key detection blindly. Check by ear, since it often confuses relative keys.'],
    links: [['Harmonic mixing', W('Harmonic_mixing')], ['Camelot wheel (Mixed In Key)', 'https://mixedinkey.com/camelot-wheel/']],
  },

  earkey: {
    book: 'Producer toolkit', mins: 4,
    cards: [
      { t: 'Notes have feelings inside a key', b: `A note on its own means nothing. Inside a key, each scale degree has a <b>feeling</b> compared with home:<br>• <b>1</b> is home. <b>5</b> is strong and open. <b>3</b> carries the mood.<br>• <b>7</b> pulls up to 1. <b>4</b> leans down to 3. <b>2</b> wants to fall to 1.<br><br>Learn those feelings and you can name notes by ear, which is how producers work out melodies and bass lines from tracks they love.`, ex: [['1 – 3 – 5 – 1', 'arp', ['C', 'E', 'G', 'C']], ['7 → 1', 'arp', ['B', 'C']], ['4 → 3', 'mel', ['F', 'E']], ['2 → 1', 'mel', ['D', 'C']]] },
      { t: 'Set the key first', b: `Before you can hear a degree, your ear needs to know where home is. The chords <b>I – IV – V – I</b> do that, and every question in this topic plays them first.<br><br>Then compare the mystery note with home: <b>sing the note</b>, walk down the scale to the tonic, and count the steps you took.`, ex: [['I – IV – V – I in C', 'seq', [['C', 'E', 'G'], ['F', 'A', 'C'], ['G', 'B', 'D'], ['C', 'E', 'G']]]] },
      { t: 'Home or away', b: `A phrase that ends on <b>1</b> sounds finished. Ending on <b>5</b> sounds like a question. Ending on <b>2</b> or <b>7</b> sounds unfinished.<br><br>Use that on purpose: stop a build-up on an unfinished note, then resolve it on the drop.`, ex: [['Ends on 1 (finished)', 'mel', ['E', 'D', 'C', 'D', 'C']], ['Ends on 5 (a question)', 'mel', ['E', 'D', 'C', 'E', 'G']], ['Ends on 2 (unfinished)', 'mel', ['E', 'F', 'E', 'C', 'D']]] },
      { t: 'Follow the bass', b: `Bass notes are usually chord roots. If you can hear where the bass moves (1 → 4, 1 → 5, 1 → 6), you can work out a track's whole chord progression.<br><br>With a MIDI keyboard connected, the "find the note" questions let you answer by playing, which is the same thing you do when figuring out a tune.`, ex: [['Bass: 1 → 4 → 5 → 1', 'mel', ['C', 'F', 'G', 'C']]] },
    ],
    daw: 'Loop 4 bars of a track you like, hum the bass note under each chord, and find those notes on your keyboard. Check with the Circle & keys tool which key they fit.',
    mistakes: ['Guessing before the key is clear in your ear. Replay the chords first (R).', 'Trying to name the note without singing it. Singing is the shortcut.'],
    links: [['Ear training', W('Ear_training')], ['Scale degree', W('Degree_(music)')], ['musictheory.net exercises', 'https://www.musictheory.net/exercises']],
  },

  ear: {
    book: 'Producer toolkit', mins: 4,
    cards: [
      { t: 'Why ear training matters', b: `Theory tells you the names; your ear tells you what you're <i>hearing</i>. Producers use it constantly: finding a sample's key, remixing, fixing a clashing note, or writing the melody in your head.` },
      { t: 'Hearing chord quality', b: `Listen for <b>mood first</b>: major is bright, minor is dark, diminished is tense and small, augmented is unresolved and dreamy. Hum the middle note, because the 3rd is what changes.`, ex: [['Major → minor → dim → aug', 'seq', [['C', 'E', 'G'], ['C', 'Eb', 'G'], ['C', 'Eb', 'Gb'], ['C', 'E', 'G#']]]] },
      { t: 'Hearing intervals', b: `Link each interval to a sound you know: the perfect 5th is the "power chord" sound, the octave is the same note higher, the tritone is the unsettled "siren", the minor 2nd is the "shark attack" rub. Sing the bottom note, then the top.`, ex: [['Perfect 5th', 'arp', ['C', 'G']], ['Tritone', 'arp', ['C', 'F#']], ['Minor 2nd', 'arp', ['C', 'Db']]] },
      { t: 'Make it a habit', b: `Ear skills grow with <b>frequency, not long sessions</b>. A few minutes of ear questions every day beats an hour once a week. In practice, press <b>R</b> to replay as often as you like. There's no penalty.` },
    ],
    daw: 'Loop a reference track and try to find its bass notes on your keyboard before checking with a tuner.',
    mistakes: ['Guessing instantly instead of listening twice and humming along.'],
    links: [['Ear training', W('Ear_training')], ['musictheory.net exercises', 'https://www.musictheory.net/exercises']],
  },
};
