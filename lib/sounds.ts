// Sound effect paths - centralized for easy management
export const SOUNDS = {
    // Game sounds
    correctGuess: "/audio/correct-guess.mp3", // TODO: Replace with tabla-hit.mp3
    wrongGuess: "/audio/wrong-guess.mp3",     // TODO: Replace with sitar-pluck-wrong.mp3
    win: "/audio/win.mp3",                     // TODO: Replace with bollywood-victory.mp3
    loss: "/audio/loss.mp3",                   // TODO: Replace with noir-tragedy.mp3

    // UI sounds (to be added)
    stampPress: "/audio/stamp-press.mp3",      // Button clicks (stamp variant)
    typewriterKey: "/audio/typewriter-key.mp3", // Keyboard letters
    paperShuffle: "/audio/paper-shuffle.mp3",  // Page transitions
    caseOpen: "/audio/case-open.mp3",          // Modal opens
    verdictStamp: "/audio/verdict-stamp.mp3",  // Result page stamp animation

    // Ambient (optional)
    ambientLoop: "/audio/ambient-loop.mp3",    // Background ambiance
} as const;

// Volume presets for different sound types
export const SOUND_VOLUMES = {
    ui: 0.35,           // UI clicks, typewriter
    feedback: 0.6,      // Correct/wrong guesses
    outcome: 0.85,      // Win/loss
    ambient: 0.12,      // Background loop
    stamp: 0.5,         // Stamp sounds
} as const;

// Sound categories for easy management
export type SoundCategory = keyof typeof SOUNDS;
export type SoundPath = typeof SOUNDS[SoundCategory];
