# Theory Lab 🎹

A music theory practice app for **electronic music producers**. It runs entirely in the browser: no install, no build step, no account.

**▶ Use it online:** https://ganeshaha.github.io/theory-lab/
(or download the repo and open `index.html`)

The topics follow the structure of J. Anthony Allen's course and book *Music Theory for Electronic Music Producers*, plus a "producer toolkit" section that goes beyond it.

## What's inside

- **Practice**: one-click 5-minute sessions. Questions are generated fresh every time (new keys, roots and chords), across 25 topics: intervals, triads, diatonic progressions, 7th chords, minor keys, the circle of fifths, extensions, melody, bass lines, chromaticism, modes, pentatonics, chromatic mediants, borrowed chords, exotic scales, chord progressions, rhythm and tempo, arrangement, tuning and frequency, voice leading, Camelot harmonic mixing, and ear training.
- **Create**: build a chord loop from Roman-numeral pads, hear it with smooth voice leading, bass and drums, load starter progressions by mood, hit **✨ Spice it** to apply (and learn) real techniques, then **export MIDI** to your DAW.
- **Explorer**: any key, scale, mode or chord on a labelled piano with scale-degree labels, plus a clickable circle of fifths and a tempo/delay calculator.
- **Tools during practice**: piano, piano roll, circle of fifths & key reference, chord finder, tempo calculator, cheat sheet.

## Learning design

The app is built to be a learning tool rather than a test:

- **Spaced repetition by day.** Topics move through mastery levels and come back for review just before you'd forget them.
- **Adaptive difficulty** that aims for roughly 85% success. On review days it holds back new material.
- **Mini-lessons** (a 30-second worked example) before any new topic, then a few focused questions before it joins the mix.
- **Learning mode.** Retry wrong answers, use hints, or reveal the answer. Stats count first tries only.
- **Low-friction motivation.** One-click start, short sessions, XP for effort, total practice days instead of streaks that reset, short explanations with optional detail, a focus mode, and gentle break reminders.

Progress is stored in your browser's local storage.

## Files

| File | Purpose |
|---|---|
| `index.html`, `style.css` | Layout and styling |
| `theory.js` | Music theory engine and all question generators |
| `lessons.js` | Mini-lesson content per topic |
| `coach.js` | Spaced repetition, daily plans, XP |
| `app.js` | Practice flow, piano, tools, Explorer |
| `create.js` | Progression builder, synth, MIDI export |
