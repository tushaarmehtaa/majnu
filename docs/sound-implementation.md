# 🎵 Sound Implementation Checklist

## ✅ Completed
- [x] Created centralized sound constants (`lib/sounds.ts`)
- [x] Updated game page to use sound constants
- [x] Updated result effects to use sound constants
- [x] Created comprehensive sound design guide

## 📋 Next Steps: Adding New Sounds

### 1. **Acquire/Create Audio Files**

#### Option A: Find Free Sounds
Visit these sites and search for the terms below:
- **Freesound.org**: Best for specific sounds
- **Zapsplat.com**: Good UI sound library
- **BBC Sound Effects**: Archive of vintage sounds

**Search Terms**:
- "rubber stamp" or "stamp press"
- "typewriter key" or "mechanical keyboard"
- "paper shuffle" or "paper rustle"
- "folder open" or "file cabinet"
- "tabla" or "Indian drum"
- "sitar pluck"

#### Option B: Use AI Sound Generation
- **ElevenLabs Sound Effects** (if available)
- **Soundraw.io** (AI music/sound generation)

#### Option C: Record Your Own
- Use your phone to record:
  - Actual stamp pressing
  - Typing on mechanical keyboard
  - Shuffling papers
  - Opening folders

### 2. **Process Audio Files**

Use **Audacity** (free) or **GarageBand**:

1. **Trim**: Keep sounds short (0.2-0.7s for UI sounds)
2. **Normalize**: Ensure consistent volume levels
3. **Add Reverb** (subtle): For cinematic feel
4. **Export**: 
   - Format: MP3
   - Bitrate: 128kbps (good quality, small size)
   - Sample Rate: 44.1kHz

### 3. **Add Files to Project**

Drop the following files into `/public/audio/`:

**Priority 1 (Core Replacements)**:
- [ ] `tabla-hit.mp3` (replace correct-guess.mp3)
- [ ] `sitar-pluck-wrong.mp3` (replace wrong-guess.mp3)
- [ ] `bollywood-victory.mp3` (replace win.mp3)
- [ ] `noir-tragedy.mp3` (replace loss.mp3)

**Priority 2 (New UI Sounds)**:
- [ ] `stamp-press.mp3`
- [ ] `typewriter-key.mp3`
- [ ] `verdict-stamp.mp3`

**Priority 3 (Polish)**:
- [ ] `paper-shuffle.mp3`
- [ ] `case-open.mp3`

### 4. **Update Sound Constants**

Once you have the files, update `/lib/sounds.ts`:

```typescript
export const SOUNDS = {
  // Replace these paths with your new files
  correctGuess: "/audio/tabla-hit.mp3",
  wrongGuess: "/audio/sitar-pluck-wrong.mp3",
  win: "/audio/bollywood-victory.mp3",
  loss: "/audio/noir-tragedy.mp3",
  
  // Add these new sounds
  stampPress: "/audio/stamp-press.mp3",
  typewriterKey: "/audio/typewriter-key.mp3",
  verdictStamp: "/audio/verdict-stamp.mp3",
  paperShuffle: "/audio/paper-shuffle.mp3",
  caseOpen: "/audio/case-open.mp3",
} as const;
```

### 5. **Implement UI Sounds**

#### A. Add Stamp Sound to Buttons

In `components/ui/button.tsx`:

```tsx
import { useSound } from "@/hooks/use-sound";
import { SOUNDS, SOUND_VOLUMES } from "@/lib/sounds";

// Inside Button component
const { play: playStamp } = useSound(SOUNDS.stampPress, { volume: SOUND_VOLUMES.ui });

// On click handler
onClick={(e) => {
  playStamp();
  props.onClick?.(e);
}}
```

#### B. Add Typewriter Sound to Keyboard

In `app/play/page.tsx`, add to keyboard buttons:

```tsx
const { play: playTypewriter } = useSound(SOUNDS.typewriterKey, { volume: SOUND_VOLUMES.ui });

// In keyboard button onClick
onClick={() => {
  playTypewriter();
  void handleGuess(letter);
}}
```

#### C. Add Verdict Stamp to Result Page

In `app/result/result-view.tsx`:

```tsx
import { useSound } from "@/hooks/use-sound";
import { SOUNDS, SOUND_VOLUMES } from "@/lib/sounds";

// Inside component
const { play: playVerdictStamp } = useSound(SOUNDS.verdictStamp, { volume: SOUND_VOLUMES.stamp });

useEffect(() => {
  const timer = setTimeout(() => {
    playVerdictStamp();
  }, 300); // Sync with stamp animation
  return () => clearTimeout(timer);
}, [playVerdictStamp]);
```

### 6. **Test & Adjust**

1. **Volume Balance**: Ensure no sound is too loud/quiet
2. **Timing**: Sync sounds with animations
3. **Performance**: Check that sounds don't lag
4. **Mobile**: Test on mobile devices (some browsers restrict autoplay)

### 7. **Optional: Add Sound Toggle**

The app already has a sound toggle (`components/sound/sound-toggle.tsx`), so users can mute if needed.

---

## 🎬 Quick Win: Replace Just the Core Sounds

If you want to start simple, just replace these 4 files:

1. Find/create:
   - Tabla hit sound → `correct-guess.mp3`
   - Sitar pluck → `wrong-guess.mp3`
   - Bollywood victory → `win.mp3`
   - Noir tragedy → `loss.mp3`

2. Drop them into `/public/audio/` (overwrite existing)

3. Done! The app will automatically use the new sounds.

---

## 🎯 Recommended Timeline

- **Week 1**: Replace core 4 sounds (correct, wrong, win, loss)
- **Week 2**: Add stamp and typewriter UI sounds
- **Week 3**: Add verdict stamp and polish sounds

---

## 📞 Need Help?

If you need help finding/creating specific sounds, let me know and I can:
- Provide more specific search queries
- Suggest exact Freesound.org links
- Help with audio editing tips
- Create sample sound descriptions for AI generation

**The sound design will elevate the experience from great to LEGENDARY!** 🎬✨
