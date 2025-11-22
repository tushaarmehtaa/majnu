export const COPY = {
  landing: {
    title: "Save Majnu Bhai",
    subtitle: "The Don is watching. One word stands between Majnu and the rope.",
    line: "Five wrong guesses and the stool kicks out.",
    cta: "Enter the Underworld",
    secondary: "Check the Dossiers",
    dailyChip: "Daily Target • +2 Bonus",
    highlights: [
      "High stakes hangman with a filmy twist.",
      "No login. No mercy. Just pure instinct.",
      "Leaderboard remembers the brave. And the dead.",
    ],
    leaderboardError: "Intel network down. Can't fetch records.",
    leaderboardRetry: "Retry Uplink",
  },
  game: {
    wrongBar: (current: number, max: number) => `Strikes: ${current} / ${max}`,
    hintLabel: (hint: string) => `Intel: ${hint}`,
    dailyHint: "Daily target. One shot. Resets at midnight.",
    dailyLabel: "Daily Target",
    domainPlaceholder: "Pick your poison",
    domainUnavailable: {
      title: "Intel missing",
      description: "Hang tight, we are re-establishing contact.",
    },
    offline: {
      title: "Signal Lost",
      description: "Majnu is in the dark. Check your connection.",
    },
    domainCard: {
      title: "Choose the Mission",
      description: "Pick a category. Every letter counts. Don't mess this up.",
      emptyHint: "Select a chip to start the rescue operation.",
      loadError: "Mission files corrupted. Refresh to retry.",
    },
    keyboard: {
      tipBefore: "Tip: Select a mission and hit",
      tipAfter: "to start.",
      shortcuts: "Shortcuts: A-Z to guess.",
    },
    emptyState: {
      title: "Pick a mission to save Majnu.",
    },
    statusDescription: "Tread carefully. The Don doesn't forgive mistakes.",
    dailyDomain: (domain: string) => `Daily Mission: ${domain}`,
    dailyBonusNote: "Win this for a +2 bonus.",
    start: {
      title: "Majnu is on the ledge.",
      description: (domain: string) => `Target locked: ${domain}.`,
    },
    dailyStart: {
      title: "Daily target armed.",
      description: (domain: string) => `Mission: ${domain}. One shot. +2 bonus.`,
    },
    dailyLocked: {
      title: "Mission already cleared.",
      description: "Come back at midnight for the next target.",
    },
    slowDown: {
      title: "Easy there, tiger.",
      description: "Too fast. This one didn't count.",
    },
    handlePrompt: {
      title: "Identify Yourself",
      description: "Enter a handle for the records.",
    },
    giveUp: {
      title: "You walked away.",
      description: "Majnu stares as the stool kicks out.",
    },
    giveUpError: {
      title: "Can't abort now.",
      description: (message: string) => message,
    },
    startError: {
      title: "Mission aborted.",
      description: (message: string) => message,
    },
    dailyError: {
      title: "Daily mission failed to load.",
      description: (message: string) => message,
    },
    guessError: {
      title: "Jam in the gun.",
      description: (message: string) => message,
    },
    repeatToast: (letter: string) => ({
      title: "Old news.",
      description: `You already tried "${letter.toUpperCase()}".`,
    }),
    correctToast: (letter: string) => ({
      title: "Bullet dodged.",
      description: `"${letter.toUpperCase()}" bought him some time.`,
    }),
    wrongToast: (letter: string) => ({
      title: "The rope tightens.",
      description: `"${letter.toUpperCase()}" was a mistake.`,
    }),
    lastChanceToast: {
      title: "Final warning.",
      description: "One more slip and it's over.",
    },
    resultToast: {
      win: "Majnu lives.",
      loss: "Majnu is gone.",
    },
  },
  result: {
    title: {
      win: "Mission Accomplished.",
      loss: "Khel Khatam.",
    },
    subtitle: {
      win: "You bought him another day.",
      loss: "The streets will remember this failure.",
    },
    answerLabel: (word: string) => `The word was: ${word.toUpperCase()}`,
    winDescription: "The Don is pleased. You've earned your keep.",
    lossDescription: "The rope snapped tight. Better luck next life.",
  },
  leaderboard: {
    title: "The Syndicate",
    subtitle: "Wins +3 | Losses –1 | Streaks earn respect.",
    reset: (time: string) => `New targets in ${time}`,
    weeklyBanner: (count: number) => `The syndicate saved Majnu ${count} times this week.`,
    profileCard: {
      heading: "Your Rap Sheet",
      subheading: "Keep your record clean.",
      score: "Reputation",
      bestStreak: "Best Streak",
      badges: "Medals",
      anonymous: "Unknown Soldier",
    },
  },
  share: {
    button: "Spread the Word",
    win: [
      "saved majnu bhai. +{delta} rep. rank #{rank}. #SaveMajnu",
      "rope missed. i live to tell. score {total}. #SaveMajnu",
    ],
    loss: [
      "lost majnu bhai. the rope won. rank #{rank}. #SaveMajnu",
      "could not save him. mission failed. #SaveMajnu",
    ],
    successToast: {
      title: "Tweet ready.",
      description: "Show them what you did.",
    },
    blockedToast: {
      title: "Pop-up blocked.",
      description: "Allow pop-ups to share your feat.",
    },
  },
  error: {
    title: "System Failure.",
    description: "Something went wrong in the underworld.",
    retry: "Try Again",
  },
};

export type CopyType = typeof COPY;
