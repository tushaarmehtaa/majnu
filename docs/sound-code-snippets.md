# 🎵 Ready-to-Use Sound Implementation Code

## Copy-Paste These Snippets After Adding Sound Files

### 1. Add Stamp Sound to All Stamp Buttons

**File**: `components/ui/button.tsx`

Add this import at the top:
```tsx
import { useSound } from "@/hooks/use-sound";
import { SOUNDS, SOUND_VOLUMES } from "@/lib/sounds";
```

Inside the `Button` component, add:
```tsx
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, onClick, ...props }, ref) => {
    const { play: playStamp } = useSound(SOUNDS.stampPress, { volume: SOUND_VOLUMES.ui });
    
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      // Play stamp sound only for stamp variant
      if (variant === "stamp") {
        playStamp();
      }
      onClick?.(e);
    };

    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        onClick={handleClick}
        {...props}
      />
    );
  }
);
```

---

### 2. Add Typewriter Sound to Keyboard

**File**: `app/play/page.tsx`

Add this hook near the other sound hooks (around line 105):
```tsx
const { play: playTypewriter } = useSound(SOUNDS.typewriterKey, { volume: SOUND_VOLUMES.ui });
```

Update the keyboard button onClick (around line 999):
```tsx
<Button
  key={letter}
  variant={isGuessed ? "outline" : "stamp"}
  disabled={isGuessed || game?.status !== "active" || isGuessing}
  onClick={() => {
    playTypewriter(); // Add this line
    void handleGuess(letter);
  }}
  className={cn(
    "h-12 w-full text-lg font-bold transition-all",
    isCorrect && "border-green-600 text-green-600 bg-green-50 opacity-100",
    isWrong && "border-red-200 text-red-200 opacity-50 decoration-slice line-through",
    flashingLetter === letter.toLowerCase() && "animate-shake bg-red-100 text-red-600"
  )}
>
  {letter}
</Button>
```

---

### 3. Add Verdict Stamp Sound to Result Page

**File**: `app/result/result-view.tsx`

Add imports at the top:
```tsx
import { useEffect } from "react"; // If not already imported
import { useSound } from "@/hooks/use-sound";
import { SOUNDS, SOUND_VOLUMES } from "@/lib/sounds";
```

Inside the `ResultView` component, add this hook:
```tsx
const { play: playVerdictStamp } = useSound(SOUNDS.verdictStamp, { volume: SOUND_VOLUMES.stamp });
```

Add this effect to play the sound when the stamp animates:
```tsx
useEffect(() => {
  // Play stamp sound after a short delay to sync with animation
  const timer = setTimeout(() => {
    playVerdictStamp();
  }, 500); // Adjust timing to match your stamp animation
  
  return () => clearTimeout(timer);
}, [playVerdictStamp]);
```

---

### 4. Add Paper Shuffle to Page Transitions (Optional)

**File**: `app/layout.tsx` or wherever you handle route changes

```tsx
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useSound } from "@/hooks/use-sound";
import { SOUNDS, SOUND_VOLUMES } from "@/lib/sounds";

export function PageTransitionSound() {
  const pathname = usePathname();
  const { play: playPaperShuffle } = useSound(SOUNDS.paperShuffle, { volume: SOUND_VOLUMES.ui });

  useEffect(() => {
    playPaperShuffle();
  }, [pathname, playPaperShuffle]);

  return null;
}

// Add <PageTransitionSound /> to your layout
```

---

### 5. Add Case Open Sound to Game Start

**File**: `app/play/page.tsx`

Add this hook:
```tsx
const { play: playCaseOpen } = useSound(SOUNDS.caseOpen, { volume: SOUND_VOLUMES.ui });
```

In the `beginNewGame` function, add after successful game creation (around line 405):
```tsx
setGame(nextState);
playCaseOpen(); // Add this line
roundStartRef.current[nextState.gameId] = Date.now();
```

And in `beginDailyGame` (around line 502):
```tsx
setGame(nextState);
playCaseOpen(); // Add this line
roundStartRef.current[nextState.gameId] = Date.now();
```

---

## 🎚️ Volume Adjustment

If any sound is too loud/quiet, adjust in `/lib/sounds.ts`:

```typescript
export const SOUND_VOLUMES = {
  ui: 0.35,           // Typewriter, stamp, paper - adjust if too loud
  feedback: 0.6,      // Correct/wrong guesses
  outcome: 0.85,      // Win/loss
  ambient: 0.12,      // Background loop (if added)
  stamp: 0.5,         // Verdict stamp
} as const;
```

---

## 🧪 Testing Checklist

After implementing:

- [ ] Click a stamp button → hear stamp sound
- [ ] Type a letter in game → hear typewriter sound
- [ ] Get correct answer → hear tabla hit
- [ ] Get wrong answer → hear sitar pluck
- [ ] Win game → hear Bollywood victory + verdict stamp
- [ ] Lose game → hear noir tragedy + verdict stamp
- [ ] Start new game → hear case open
- [ ] Navigate pages → hear paper shuffle (if implemented)

---

## 🔇 Mute Toggle

The app already has a mute toggle in the header. Users can click it to disable all sounds.

**Location**: `components/sound/sound-toggle.tsx`

---

## 🎯 Priority Order

If you're adding sounds gradually:

1. **First**: Replace the 4 core sounds (correct, wrong, win, loss)
2. **Second**: Add verdict stamp (most impactful)
3. **Third**: Add typewriter to keyboard (great UX)
4. **Fourth**: Add stamp to buttons
5. **Fifth**: Add case open and paper shuffle (polish)

---

## 🐛 Troubleshooting

**Sound doesn't play?**
- Check browser console for errors
- Ensure file exists in `/public/audio/`
- Check file path in `SOUNDS` constant
- Try clicking something first (browsers block autoplay until user interaction)

**Sound plays multiple times?**
- Check you're not calling `play()` in a loop
- Ensure `useEffect` has proper dependencies

**Sound is choppy?**
- File might be too large (compress to 128kbps MP3)
- Check browser performance

---

**You're all set! Just add the audio files and copy-paste these snippets!** 🎵✨
