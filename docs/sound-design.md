# 🎵 Bombay Noir Sound Design Guide

## Audio Philosophy
The sound design should evoke:
- **Vintage Bollywood Cinema**: Dramatic orchestral stings, tabla rhythms
- **Film Noir**: Suspenseful jazz, detective thriller ambiance
- **Indian Classical Fusion**: Sitar, harmonium, tabla mixed with noir jazz
- **Typewriter/Telegraph**: Mechanical, bureaucratic sounds for UI interactions

---

## 🎬 Current Audio Files (To Replace/Enhance)

### 1. **correct-guess.mp3** → `tabla-hit.mp3`
**Current**: Generic success sound  
**New Concept**: Single tabla "dha" hit with reverb
- **Vibe**: Confident, rhythmic, Indian percussion
- **Duration**: ~0.5s
- **Alternative**: Harmonium chord (Sa-Pa-Sa) with quick decay

### 2. **wrong-guess.mp3** → `sitar-pluck-wrong.mp3`
**Current**: Generic error sound  
**New Concept**: Dissonant sitar string pluck (komal notes)
- **Vibe**: Unsettling, slightly off-key, creates tension
- **Duration**: ~0.7s
- **Alternative**: Low tabla "ge" with descending pitch

### 3. **win.mp3** → `bollywood-victory.mp3`
**Current**: Generic celebration  
**New Concept**: Triumphant orchestral sting with tabla flourish
- **Vibe**: Bollywood movie climax, heroic, dramatic
- **Elements**: 
  - Orchestral brass swell (0-1s)
  - Tabla tihai pattern (1-2s)
  - Optional: Shehnai melody snippet
- **Duration**: 2-3s
- **Reference**: Classic RD Burman victory themes

### 4. **loss.mp3** → `noir-tragedy.mp3`
**Current**: Generic failure sound  
**New Concept**: Dramatic descending strings + single gong hit
- **Vibe**: Film noir tragedy, somber, cinematic
- **Elements**:
  - Descending violin/cello phrase (0-1.5s)
  - Deep gong/bell toll (1.5-2.5s)
  - Reverb tail with sitar harmonics
- **Duration**: 2.5-3s
- **Reference**: Classic noir film endings

---

## 🆕 Additional Sound Effects (To Add)

### 5. **stamp-press.mp3** (NEW)
**Use**: Button clicks, especially "stamp" variant buttons
- **Vibe**: Rubber stamp hitting ink pad + paper
- **Elements**: Mechanical "thunk" + slight paper rustle
- **Duration**: ~0.3s

### 6. **typewriter-key.mp3** (NEW)
**Use**: Keyboard letter selection, typing animations
- **Vibe**: Vintage typewriter key strike
- **Duration**: ~0.2s
- **Variation**: Could have 3-4 variations to avoid repetition

### 7. **paper-shuffle.mp3** (NEW)
**Use**: Page transitions, card reveals
- **Vibe**: Shuffling through case files/dossiers
- **Duration**: ~0.5s

### 8. **case-open.mp3** (NEW)
**Use**: Game start, modal opens
- **Vibe**: Opening a manila folder + slight creak
- **Duration**: ~0.6s

### 9. **verdict-stamp.mp3** (NEW)
**Use**: Result page "PARDONED" / "EXECUTED" stamp animation
- **Vibe**: Heavy official stamp slam with echo
- **Elements**: 
  - Heavy impact (0-0.1s)
  - Ink squelch (0.1-0.2s)
  - Paper vibration (0.2-0.5s)
- **Duration**: ~0.5s

### 10. **ambient-loop.mp3** (OPTIONAL)
**Use**: Background ambiance (very subtle, toggle-able)
- **Vibe**: Distant Mumbai street sounds + noir jazz undertones
- **Elements**: 
  - Faint traffic/city hum
  - Occasional distant tabla
  - Subtle jazz bass line
- **Duration**: 30-60s loop
- **Volume**: Very low (0.1-0.2)

---

## 🎚️ Volume Guidelines

| Sound Type | Volume | Priority |
|------------|--------|----------|
| UI Clicks (stamp, typewriter) | 0.3-0.4 | Low |
| Correct Guess | 0.5-0.6 | Medium |
| Wrong Guess | 0.6-0.7 | Medium-High |
| Win | 0.8-0.85 | High |
| Loss | 0.85-0.9 | High |
| Ambient Loop | 0.1-0.15 | Very Low |

---

## 🎼 Implementation Strategy

### Phase 1: Replace Core Sounds (Priority)
1. Replace `correct-guess.mp3` with tabla hit
2. Replace `wrong-guess.mp3` with sitar pluck
3. Replace `win.mp3` with Bollywood victory theme
4. Replace `loss.mp3` with noir tragedy theme

### Phase 2: Add UI Sounds
5. Add `stamp-press.mp3` for button interactions
6. Add `typewriter-key.mp3` for keyboard
7. Add `verdict-stamp.mp3` for result page

### Phase 3: Polish
8. Add `paper-shuffle.mp3` for transitions
9. Add `case-open.mp3` for modals
10. (Optional) Add ambient loop

---

## 🎹 Sound Sources & Tools

### Free Resources:
- **Freesound.org**: Search "tabla", "sitar", "typewriter", "stamp"
- **BBC Sound Effects**: Free archive with vintage sounds
- **YouTube Audio Library**: Bollywood-style music snippets

### Recommended Tools:
- **Audacity** (Free): Edit, trim, add reverb
- **GarageBand** (Mac): Layer Indian instruments
- **Splice** (Paid): High-quality Bollywood sample packs

### Key Search Terms:
- "Bollywood percussion"
- "Indian classical instruments"
- "Film noir music"
- "Vintage typewriter"
- "Rubber stamp sound"

---

## 🎭 Mood Board References

**Music Inspiration**:
- RD Burman (Classic Bollywood composer)
- Ennio Morricone (Spaghetti Western/Noir)
- "The Good, The Bad and The Ugly" theme (dramatic tension)
- Classic Detective Noir soundtracks

**Sound Design**:
- Typewriter ASMR videos
- Vintage office sounds
- Mumbai street ambiance
- 1960s Bollywood film audio

---

## 📝 Next Steps

1. **Gather/Create Audio Files**: Use the sources above
2. **Replace Files**: Drop new audio into `/public/audio/`
3. **Test Volume Levels**: Ensure balance across all sounds
4. **Add New Hooks**: Implement stamp-press, typewriter sounds in components
5. **User Testing**: Get feedback on audio mix

---

**Goal**: Create an immersive, cinematic audio experience that transports players to a 1960s Bombay detective thriller! 🎬🎵
