export const COPY = {
  landing: {
    title: "Save Majnu Bhai",
    subtitle: "Guess the word. Save the man.",
    line: "Five wrong guesses and he swings.",
    cta: "Start the execution",
    secondary: "View leaderboards",
  },
  game: {
    wrongBar: (current: number, max: number) => `Wrong guesses: ${current} / ${max}`,
    hintLabel: (hint: string) => `Hint: ${hint}`,
    toasts: {
      correct: "Majnu breathes another second.",
      wrong: "That rope gets tighter.",
      repeat: "You already tried that letter.",
      win: "Majnu survived.",
      loss: "Majnu is dead.",
      lastChance: "Last chance. Do not miss.",
    },
  },
  result: {
    title: {
      win: "Majnu survived.",
      loss: "Majnu is dead.",
    },
    answerLabel: (word: string) => `Correct word: ${word.toUpperCase()}`,
    winDescription: "The don nods. You bought Majnu time.",
    lossDescription: "The knot snapped tight. Try again, executioner.",
  },
  leaderboard: {
    title: "Top saviors",
    reset: (time: string) => `Resets in ${time}`,
    weeklyBanner: (count: number) => `This week’s saviors saved Majnu ${count} times.`,
  },
  share: {
    win: [
      "i saved majnu bhai. score +{delta}. rank #{rank}.",
      "rope missed. i live to tell. score {total}.",
    ],
    loss: [
      "majnu is gone. i failed. rank #{rank}.",
      "i could not save him. try your luck.",
    ],
  },
};

export type CopyType = typeof COPY;
