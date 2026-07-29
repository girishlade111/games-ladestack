import type React from "react"

interface GameIconProps { gameId: string; className?: string; size?: number }

export default function GameIcon({ gameId, className = "", size = 24 }: GameIconProps) {
  const s = size
  const h = s / 2
  const stroke = "currentColor"

  const icons: Record<string, React.ReactNode> = {
    snake: (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 12a2 2 0 1 0 0-4 6 6 0 0 0 0 8h3l3 3h8M16 12v-3a2 2 0 0 1 2-2h0M3 12h0"/>
        <circle cx="6" cy="6" r="1.5" fill={stroke}/>
      </svg>
    ),

    tetris: (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="5" height="5" rx="1" fill={stroke} fillOpacity="0.3"/>
        <rect x="8" y="3" width="5" height="5" rx="1" fill={stroke} fillOpacity="0.3"/>
        <rect x="13" y="3" width="5" height="5" rx="1" fill={stroke} fillOpacity="0.3"/>
        <rect x="13" y="8" width="5" height="5" rx="1" fill={stroke} fillOpacity="0.3"/>
      </svg>
    ),

    pong: (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="2" x2="12" y2="22" strokeDasharray="2 3"/>
        <rect x="2" y="4" width="2" height="6" rx="1"/>
        <rect x="20" y="10" width="2" height="6" rx="1"/>
        <circle cx="10" cy="11" r="2" fill={stroke}/>
      </svg>
    ),

    flappy: (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L20 18H4L12 2Z"/>
        <path d="M12 7v5"/>
      </svg>
    ),

    dino: (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 18v-4a6 6 0 0 1 6-6h1M10 8l2-4M12 4l2 4M12 4v4"/>
        <path d="M6 8l-2 2"/>
        <circle cx="17" cy="11" r="1" fill={stroke}/>
        <path d="M10 18h8a3 3 0 0 0 3-3v-1a3 3 0 0 0-3-3h-2l-4-3"/>
        <line x1="3" y1="22" x2="21" y2="22"/>
      </svg>
    ),

    breakout: (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="4" height="3" rx="0.5" fill={stroke} fillOpacity="0.3"/>
        <rect x="7" y="2" width="4" height="3" rx="0.5" fill={stroke} fillOpacity="0.3"/>
        <rect x="12" y="2" width="4" height="3" rx="0.5" fill={stroke} fillOpacity="0.3"/>
        <rect x="17" y="2" width="4" height="3" rx="0.5" fill={stroke} fillOpacity="0.3"/>
        <rect x="2" y="6" width="4" height="3" rx="0.5" fill={stroke} fillOpacity="0.3"/>
        <line x1="9" y1="18" x2="16" y2="18" strokeWidth="3"/>
        <circle cx="12" cy="15" r="2" fill={stroke}/>
      </svg>
    ),

    reaction: (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9"/>
        <polyline points="12 6 12 12 16 14"/>
        <line x1="8" y1="2" x2="8" y2="5"/>
        <line x1="16" y1="2" x2="16" y2="5"/>
        <line x1="12" y1="22" x2="12" y2="19"/>
      </svg>
    ),

    "color-match": (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="8"/>
        <path d="M12 4a4 4 0 0 0 0 16"/>
        <path d="M12 4a4 4 0 0 1 0 16"/>
        <circle cx="8" cy="8" r="1.5" fill="#ef4444" stroke="none"/>
        <circle cx="16" cy="8" r="1.5" fill="#3b82f6" stroke="none"/>
        <circle cx="8" cy="16" r="1.5" fill="#22c55e" stroke="none"/>
        <circle cx="16" cy="16" r="1.5" fill="#f59e0b" stroke="none"/>
      </svg>
    ),

    "space-invaders": (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7l1-1h3l1 1M16 7l1-1h3l1 1"/>
        <rect x="7" y="6" width="10" height="3" rx="1"/>
        <path d="M8 9v2m4 0v2m4-2v2"/>
        <path d="M12 18l-2 4M12 18l2 4"/>
        <line x1="5" y1="9" x2="5" y2="13"/>
        <line x1="19" y1="9" x2="19" y2="13"/>
        <rect x="10" y="20" width="4" height="2" rx="1"/>
      </svg>
    ),

    "simon-says": (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round">
        <path d="M12 2l-8 8h16l-8-8z" fill="#ef4444" fillOpacity="0.5"/>
        <path d="M4 10l8 8-8-8z" fill="#3b82f6" fillOpacity="0.5"/>
        <path d="M20 10l-8 8 8-8z" fill="#22c55e" fillOpacity="0.5"/>
        <path d="M12 18l-8-8h16l-8 8z" fill="#f59e0b" fillOpacity="0.5"/>
      </svg>
    ),

    "whack-a-mole": (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" fill={stroke} fillOpacity="0.2"/>
        <circle cx="7" cy="5" r="1" fill={stroke}/>
        <circle cx="12" cy="4" r="1" fill={stroke}/>
        <circle cx="17" cy="5" r="1" fill={stroke}/>
        <circle cx="9" cy="7" r="0.7" fill={stroke}/>
        <circle cx="15" cy="7" r="0.7" fill={stroke}/>
        <path d="M4 22v-4a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v4"/>
        <line x1="9" y1="18" x2="15" y2="18"/>
      </svg>
    ),

    "2048": (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="6" height="6" rx="1.5" fill={stroke} fillOpacity="0.2"/>
        <rect x="9" y="2" width="6" height="6" rx="1.5" fill={stroke} fillOpacity="0.3"/>
        <rect x="16" y="2" width="6" height="6" rx="1.5" fill={stroke} fillOpacity="0.2"/>
        <rect x="2" y="9" width="6" height="6" rx="1.5" fill={stroke} fillOpacity="0.3"/>
        <rect x="9" y="9" width="6" height="6" rx="1.5" fill={stroke} fillOpacity="0.4"/>
        <rect x="16" y="9" width="6" height="6" rx="1.5" fill={stroke} fillOpacity="0.1"/>
        <rect x="2" y="16" width="6" height="6" rx="1.5" fill={stroke} fillOpacity="0.1"/>
        <rect x="9" y="16" width="6" height="6" rx="1.5" fill={stroke} fillOpacity="0.2"/>
        <rect x="16" y="16" width="6" height="6" rx="1.5" fill={stroke} fillOpacity="0.3"/>
      </svg>
    ),

    "memory-match": (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="8" rx="1.5"/>
        <rect x="14" y="3" width="7" height="8" rx="1.5"/>
        <rect x="3" y="14" width="7" height="8" rx="1.5"/>
        <rect x="14" y="14" width="7" height="8" rx="1.5"/>
        <circle cx="6.5" cy="7" r="1.5" fill={stroke}/>
        <circle cx="17.5" cy="7" r="1.5" fill={stroke}/>
        <circle cx="17.5" cy="18" r="1.5" fill={stroke}/>
      </svg>
    ),

    "word-scramble": (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 8L8 6l2 2M18 8l-2-2-2 2"/>
        <path d="M6 16l2 2 2-2M18 16l-2 2-2-2"/>
        <path d="M6 12l2 2 2-2M18 12l-2 2-2-2"/>
        <line x1="12" y1="4" x2="12" y2="20"/>
      </svg>
    ),

    minesweeper: (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <line x1="9" y1="3" x2="9" y2="21"/>
        <line x1="15" y1="3" x2="15" y2="21"/>
        <line x1="3" y1="9" x2="21" y2="9"/>
        <line x1="3" y1="15" x2="21" y2="15"/>
        <circle cx="12" cy="12" r="2.5" fill={stroke}/>
        <line x1="10" y1="10" x2="14" y2="14" stroke="white" strokeWidth="1"/>
        <line x1="14" y1="10" x2="10" y2="14" stroke="white" strokeWidth="1"/>
      </svg>
    ),

    "tic-tac-toe": (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="2" x2="8" y2="22"/>
        <line x1="16" y1="2" x2="16" y2="22"/>
        <line x1="2" y1="8" x2="22" y2="8"/>
        <line x1="2" y1="16" x2="22" y2="16"/>
        <line x1="4" y1="4" x2="7" y2="7"/>
        <line x1="7" y1="4" x2="4" y2="7"/>
        <circle cx="13" cy="13.5" r="2"/>
      </svg>
    ),

    "connect-four": (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="18" rx="2"/>
        <line x1="5" y1="4" x2="5" y2="22"/>
        <line x1="8" y1="4" x2="8" y2="22"/>
        <line x1="11" y1="4" x2="11" y2="22"/>
        <line x1="14" y1="4" x2="14" y2="22"/>
        <line x1="17" y1="4" x2="17" y2="22"/>
        <line x1="20" y1="4" x2="20" y2="22"/>
        <circle cx="5" cy="19" r="1.5" fill="#ef4444" stroke="none"/>
        <circle cx="8" cy="19" r="1.5" fill="#ef4444" stroke="none"/>
        <circle cx="11" cy="19" r="1.5" fill="#f59e0b" stroke="none"/>
        <circle cx="14" cy="19" r="1.5" fill="#f59e0b" stroke="none"/>
        <circle cx="5" cy="16" r="1.5" fill="#ef4444" stroke="none"/>
      </svg>
    ),

    "orbit-defense": (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" fill={stroke} fillOpacity="0.3"/>
        <circle cx="12" cy="12" r="7" strokeDasharray="3 2"/>
        <circle cx="12" cy="12" r="10" strokeDasharray="2 3"/>
        <line x1="12" y1="2" x2="12" y2="5"/>
        <line x1="12" y1="19" x2="12" y2="22"/>
        <line x1="2" y1="12" x2="5" y2="12"/>
        <line x1="19" y1="12" x2="22" y2="12"/>
        <circle cx="12" cy="5" r="1" fill={stroke}/>
        <circle cx="12" cy="19" r="1" fill={stroke}/>
      </svg>
    ),

    "coin-collector": (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="10" r="5"/>
        <text x="12" y="13" textAnchor="middle" fontSize="7" fill={stroke} stroke="none" fontWeight="bold">$</text>
        <circle cx="8" cy="7" r="3" strokeWidth="1.5" fill={stroke} fillOpacity="0.15"/>
        <circle cx="17" cy="5" r="2" strokeWidth="1.5" fill={stroke} fillOpacity="0.1"/>
        <circle cx="16" cy="13" r="2" strokeWidth="1.5" fill={stroke} fillOpacity="0.1"/>
      </svg>
    ),

    "bubble-pop": (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="8" r="4" fill={stroke} fillOpacity="0.2"/>
        <circle cx="17" cy="6" r="3" fill={stroke} fillOpacity="0.15"/>
        <circle cx="5" cy="17" r="3" fill={stroke} fillOpacity="0.15"/>
        <circle cx="18" cy="14" r="4" fill={stroke} fillOpacity="0.2"/>
        <circle cx="14" cy="18" r="2.5" fill={stroke} fillOpacity="0.1"/>
      </svg>
    ),

    "typing-speed": (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="12" rx="2"/>
        <line x1="6" y1="10" x2="6" y2="14"/>
        <line x1="6" y1="10" x2="8" y2="14"/>
        <line x1="9" y1="10" x2="9" y2="14"/>
        <line x1="9" y1="12" x2="11" y2="12"/>
        <line x1="13" y1="10" x2="13" y2="14"/>
        <polyline points="15 10 17 12 15 14"/>
        <line x1="18" y1="10" x2="18" y2="14"/>
      </svg>
    ),

    sudoku: (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="2"/>
        <line x1="8.7" y1="2" x2="8.7" y2="22" strokeWidth="2"/>
        <line x1="15.3" y1="2" x2="15.3" y2="22" strokeWidth="2"/>
        <line x1="2" y1="8.7" x2="22" y2="8.7" strokeWidth="2"/>
        <line x1="2" y1="15.3" x2="22" y2="15.3" strokeWidth="2"/>
      </svg>
    ),

    pacman: (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Z" fill={stroke} fillOpacity="0.7"/>
        <path d="M12 12l5-5M12 12l5 5" stroke="white" strokeWidth="2"/>
        <circle cx="7" cy="7" r="1.5" fill="white" stroke="none"/>
        <circle cx="17" cy="7" r="1.5" fill="white" stroke="none"/>
        <circle cx="7" cy="17" r="1.5" fill="white" stroke="none"/>
        <circle cx="17" cy="17" r="1.5" fill="white" stroke="none"/>
      </svg>
    ),

    solitaire: (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="2" width="5" height="7" rx="1"/>
        <rect x="9" y="2" width="5" height="7" rx="1"/>
        <rect x="15" y="2" width="5" height="7" rx="1"/>
        <rect x="6" y="11" width="5" height="7" rx="1"/>
        <rect x="12" y="11" width="5" height="7" rx="1"/>
        <rect x="9" y="20" width="5" height="2" rx="0.5"/>
        <text x="5.5" y="7" textAnchor="middle" fontSize="6" fill={stroke} stroke="none" fontWeight="bold">A</text>
        <text x="11.5" y="14" textAnchor="middle" fontSize="5" fill={stroke} stroke="none">K</text>
      </svg>
    ),

    "trivia-quiz": (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9"/>
        <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 3-2.5 5"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),

    blackjack: (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="3" width="7" height="10" rx="1.5" fill={stroke} fillOpacity="0.15"/>
        <rect x="13" y="3" width="7" height="10" rx="1.5" fill={stroke} fillOpacity="0.15"/>
        <text x="7.5" y="9" textAnchor="middle" fontSize="8" fill={stroke} stroke="none" fontWeight="bold">A</text>
        <text x="16.5" y="9" textAnchor="middle" fontSize="8" fill={stroke} stroke="none" fontWeight="bold">J</text>
        <text x="12" y="20" textAnchor="middle" fontSize="6" fill={stroke} stroke="none" fontWeight="bold">21</text>
      </svg>
    ),

    poker: (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="5" height="8" rx="1" fill={stroke} fillOpacity="0.1"/>
        <rect x="8" y="3" width="5" height="8" rx="1" fill={stroke} fillOpacity="0.15"/>
        <rect x="14" y="3" width="5" height="8" rx="1" fill={stroke} fillOpacity="0.1"/>
        <rect x="18" y="3" width="5" height="8" rx="1" fill={stroke} fillOpacity="0.15"/>
        <rect x="5" y="2" width="5" height="8" rx="1" fill={stroke} fillOpacity="0.1"/>
        <text x="4.5" y="8" textAnchor="middle" fontSize="6" fill="#ef4444" stroke="none" fontWeight="bold">A</text>
        <text x="16.5" y="8" textAnchor="middle" fontSize="6" fill="currentColor" stroke="none" fontWeight="bold">K</text>
      </svg>
    ),

    hangman: (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" y1="22" x2="10" y2="22"/>
        <line x1="7" y1="22" x2="7" y2="4"/>
        <line x1="7" y1="4" x2="15" y2="4"/>
        <line x1="15" y1="4" x2="15" y2="7"/>
        <circle cx="15" cy="9" r="2"/>
        <line x1="15" y1="11" x2="15" y2="17"/>
        <line x1="15" y1="13" x2="12" y2="15"/>
        <line x1="15" y1="13" x2="18" y2="15"/>
        <line x1="15" y1="17" x2="12" y2="20"/>
        <line x1="15" y1="17" x2="18" y2="20"/>
      </svg>
    ),

    "word-search": (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="20" rx="2"/>
        <line x1="6" y1="7" x2="6" y2="19"/>
        <line x1="10" y1="7" x2="10" y2="19"/>
        <line x1="14" y1="7" x2="14" y2="19"/>
        <line x1="18" y1="7" x2="18" y2="19"/>
        <line x1="2" y1="7" x2="22" y2="7"/>
        <line x1="2" y1="11" x2="22" y2="11"/>
        <line x1="2" y1="15" x2="22" y2="15"/>
        <line x1="2" y1="19" x2="22" y2="19"/>
        <path d="M4 5l3 3M11 3v4M18 5l-3 3"/>
      </svg>
    ),

    checkers: (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="2"/>
        <rect x="2" y="2" width="5" height="5" fill={stroke} fillOpacity="0.3"/>
        <rect x="12" y="2" width="5" height="5" fill={stroke} fillOpacity="0.3"/>
        <rect x="7" y="7" width="5" height="5" fill={stroke} fillOpacity="0.3"/>
        <rect x="17" y="7" width="5" height="5" fill={stroke} fillOpacity="0.3"/>
        <rect x="2" y="12" width="5" height="5" fill={stroke} fillOpacity="0.3"/>
        <rect x="12" y="12" width="5" height="5" fill={stroke} fillOpacity="0.3"/>
        <rect x="7" y="17" width="5" height="5" fill={stroke} fillOpacity="0.3"/>
        <rect x="17" y="17" width="5" height="5" fill={stroke} fillOpacity="0.3"/>
      </svg>
    ),

    battleship: (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 18h3l3 3h8l3-3h3V8h-3l-1-2H6L5 8H2v10Z"/>
        <rect x="5" y="10" width="3" height="2" rx="0.5" fill={stroke} fillOpacity="0.5"/>
        <rect x="10" y="12" width="5" height="2" rx="0.5" fill={stroke} fillOpacity="0.5"/>
        <rect x="17" y="10" width="3" height="2" rx="0.5" fill={stroke} fillOpacity="0.5"/>
        <line x1="5" y1="11" x2="10" y2="13"/>
        <line x1="15" y1="13" x2="20" y2="11"/>
        <line x1="12" y1="6" x2="12" y2="10"/>
      </svg>
    ),

    asteroids: (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l2 4-2 2M18 6l-2 4M12 8l-4 4 4 4M6 4l3 3"/>
        <circle cx="18" cy="14" r="2" fill={stroke} fillOpacity="0.2"/>
        <circle cx="7" cy="17" r="3" fill={stroke} fillOpacity="0.15"/>
        <circle cx="15" cy="20" r="1.5" fill={stroke} fillOpacity="0.2"/>
        <circle cx="4" cy="9" r="2" fill={stroke} fillOpacity="0.15"/>
        <circle cx="19" cy="5" r="1" fill={stroke} fillOpacity="0.2"/>
      </svg>
    ),

    match3: (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="6" r="3" fill="#ef4444" fillOpacity="0.4"/>
        <circle cx="12" cy="6" r="3" fill="#3b82f6" fillOpacity="0.4"/>
        <circle cx="18" cy="6" r="3" fill="#22c55e" fillOpacity="0.4"/>
        <circle cx="9" cy="14" r="3" fill="#f59e0b" fillOpacity="0.4"/>
        <circle cx="3" cy="18" r="3" fill="#ef4444" fillOpacity="0.4"/>
        <circle cx="15" cy="18" r="3" fill="#3b82f6" fillOpacity="0.4"/>
      </svg>
    ),
  }

  return icons[gameId] || null
}
