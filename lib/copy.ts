export const COPY = {
  landing: {
    title: "Save Majnu Bhai",
    subtitle: "Guess the word. Save the man.",
    line: "Five wrong guesses and he swings.",
    cta: "Start the execution",
    secondary: "View leaderboards",
    dailyChip: "Daily Word · +2 Bonus",
    highlights: [
      "Dark-comedy hangman with Bollywood flair.",
      "Anonymous play. No accounts. All execution.",
      "Leaderboards remember the saviors. And the fallen.",
    ],
  },
  game: {
    wrongBar: (current: number, max: number) => `Wrong guesses: ${current} / ${max}`,
    hintLabel: (hint: string) => `Hint: ${hint}`,
    dailyHint: "Daily word. One shot. Resets at 00:00 UTC.",
    dailyLabel: "Daily Word",
    domainPlaceholder: "Pick a domain to play",
    domainCard: {
      title: "Choose Majnu's fate",
      description: "Pick a preset domain or whisper a new topic. Every letter counts toward the gallows.",
      emptyHint: "Pick a domain chip to start a new execution.",
    },
    keyboard: {
      tipBefore: "Tip: Highlight a domain chip and smash",
      tipAfter: "to start the execution.",
      shortcuts: "Keyboard shortcuts: letters A–Z guess directly.",
    },
    emptyState: {
      title: "Pick a domain to summon Majnu Bhai.",
    },
    statusDescription: "Guess wisely before the rope tightens. Five strikes and Majnu drops.",
    dailyDomain: (domain: string) => `Daily domain: ${domain}`,
    dailyBonusNote: "Win here for an extra +2.",
    start: {
      title: "Majnu approaches the gallows.",
      description: (domain: string) => `Domain locked: ${domain}.`,
    },
    dailyStart: {
      title: "Daily word armed.",
      description: (domain: string) => `Domain: ${domain}. One try. +2 bonus.`,
    },
    dailyLocked: {
      title: "Daily word already cleared.",
      description: "Come back at midnight UTC for the next rope.",
    },
    slowDown: {
      title: "Slow down, hero.",
      description: "This finish didn't count toward the leaderboard.",
    },
    handlePrompt: {
      title: "Claim your handle",
      description: "Set a handle so we can crown you on the leaderboard.",
    },
    giveUp: {
      title: "You walked away",
      description: "Majnu stares as the stool kicks out.",
    },
    giveUpError: {
      title: "The knot tightens",
      description: (message: string) => message,
    },
    startError: {
      title: "Could not start game",
      description: (message: string) => message,
    },
    dailyError: {
      title: "Could not start daily",
      description: (message: string) => message,
    },
    guessError: {
      title: "Steel your nerves",
      description: (message: string) => message,
    },
    repeatToast: (letter: string) => ({
      title: "You already tried that letter.",
      description: `"${letter.toUpperCase()}" has already been tried.`,
    }),
    correctToast: (letter: string) => ({
      title: "Majnu breathes another second.",
      description: `Letter ${letter.toUpperCase()} bought Majnu a heartbeat.`,
    }),
    wrongToast: (letter: string) => ({
      title: "That rope gets tighter.",
      description: `Letter ${letter.toUpperCase()} tightened the knot.`,
    }),
    lastChanceToast: {
      title: "Last chance. Do not miss.",
      description: "One more mistake and the rope snaps.",
    },
    resultToast: {
      win: "Majnu survived.",
      loss: "Majnu is dead.",
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
    subtitle: "Wins earn +3, losses shave off 1. Survive consecutive rounds to stack streak bonuses.",
    reset: (time: string) => `Resets in ${time}`,
    weeklyBanner: (count: number) => `This week's saviors saved Majnu ${count} times.`,
    profileCard: {
      heading: "Your rope report",
      subheading: "Stay sharp. Wins pay the don.",
      score: "Score",
      bestStreak: "Best streak",
      badges: "Badges",
      anonymous: "Anonymous executioner",
    },
  },
  share: {
    button: "Share Your Score",
    win: [
      "i saved majnu bhai. score +{delta}. rank #{rank}.",
      "rope missed. i live to tell. score {total}.",
    ],
    loss: [
      "majnu is gone. i failed. rank #{rank}.",
      "i could not save him. try your luck.",
    ],
    successToast: {
      title: "Tweet ready - copy looks killer.",
      description: "Preview the card and send it into the timeline.",
    },
    blockedToast: {
      title: "Pop-up blocked.",
      description: "Allow pop-ups for Save Majnu Bhai and try again.",
    },
  },
  error: {
    title: "The rope snarled.",
    description: "We couldn't load that scene. Try again.",
    retry: "Retry",
  },
};

export type CopyType = typeof COPY;
