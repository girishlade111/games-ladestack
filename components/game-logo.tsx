"use client"

import type React from "react"

/**
 * Per-game brand logos: a gradient badge plus a purpose-drawn geometric mark.
 * Marks are authored on a 32x32 grid, white on the gradient, and receive the
 * badge's deep colour so they can punch "cut-out" details (eyes, pips, digits).
 */

interface Brand {
  from: string
  to: string
  mark: (deep: string) => React.ReactElement
}

const HEX = (cx: number, cy: number, r: number) => {
  const w = r * 0.866
  const h = r * 0.5
  return `M${cx} ${cy - r}L${cx + w} ${cy - h}L${cx + w} ${cy + h}L${cx} ${cy + r}L${cx - w} ${cy + h}L${cx - w} ${cy - h}Z`
}

const brands: Record<string, Brand> = {
  /* ---------------------------------------------------------------- Arcade */
  snake: {
    from: "#4ade80",
    to: "#15803d",
    mark: () => (
      <>
        <path d="M7 24h10a4.5 4.5 0 0 0 0-9h-2a4.5 4.5 0 0 1 0-9h8" />
        <circle cx="25" cy="6" r="2.4" fill="#fff" stroke="none" />
      </>
    ),
  },
  pong: {
    from: "#60a5fa",
    to: "#1d4ed8",
    mark: () => (
      <>
        <path d="M16 4v24" strokeDasharray="3 3" strokeOpacity=".5" />
        <rect x="4" y="7" width="3" height="10" rx="1.5" fill="#fff" stroke="none" />
        <rect x="25" y="15" width="3" height="10" rx="1.5" fill="#fff" stroke="none" />
        <circle cx="12.5" cy="14" r="2.5" fill="#fff" stroke="none" />
      </>
    ),
  },
  flappy: {
    from: "#fbbf24",
    to: "#d97706",
    mark: (d) => (
      <>
        <path d="M9 6l14 10-14 10z" fill="#fff" stroke="none" />
        <circle cx="13" cy="16" r="1.9" fill={d} stroke="none" />
        <path d="M4 11h3M3 16h4M4 21h3" strokeOpacity=".65" />
      </>
    ),
  },
  dino: {
    from: "#94a3b8",
    to: "#334155",
    mark: (d) => (
      <>
        <path d="M9 21a4.4 4.4 0 0 1 .8-8.6 4.6 4.6 0 0 1 8-1.7A4.2 4.2 0 0 1 22 21z" fill="#fff" stroke="none" />
        <circle cx="23.5" cy="15" r="3" fill="#fff" stroke="none" />
        <circle cx="24.5" cy="14.3" r="1" fill={d} stroke="none" />
        <path d="M11 21v4M15 21v4M19.5 21v4" />
        <path d="M4 28h24" strokeOpacity=".55" />
      </>
    ),
  },
  breakout: {
    from: "#fdba74",
    to: "#ea580c",
    mark: () => (
      <>
        <rect x="4" y="5" width="7" height="4" rx="1" fill="#fff" stroke="none" />
        <rect x="12.5" y="5" width="7" height="4" rx="1" fill="#fff" stroke="none" />
        <rect x="21" y="5" width="7" height="4" rx="1" fill="#fff" stroke="none" />
        <rect x="8.5" y="11" width="7" height="4" rx="1" fill="#fff" fillOpacity=".6" stroke="none" />
        <rect x="17" y="11" width="7" height="4" rx="1" fill="#fff" fillOpacity=".6" stroke="none" />
        <circle cx="16" cy="20.5" r="2.3" fill="#fff" stroke="none" />
        <rect x="10" y="25" width="12" height="3" rx="1.5" fill="#fff" stroke="none" />
      </>
    ),
  },
  "coin-collector": {
    from: "#fcd34d",
    to: "#d97706",
    mark: () => (
      <>
        <ellipse cx="16" cy="10" rx="9" ry="4" fill="#fff" stroke="none" />
        <path d="M7 10v5c0 2.2 4 4 9 4s9-1.8 9-4v-5z" fill="#fff" fillOpacity=".72" stroke="none" />
        <path d="M7 17v5c0 2.2 4 4 9 4s9-1.8 9-4v-5z" fill="#fff" fillOpacity=".45" stroke="none" />
      </>
    ),
  },
  "bubble-pop": {
    from: "#5eead4",
    to: "#0d9488",
    mark: () => (
      <>
        <circle cx="12" cy="19" r="8" fill="#fff" fillOpacity=".85" stroke="none" />
        <circle cx="23" cy="10.5" r="5.5" fill="#fff" fillOpacity=".6" stroke="none" />
        <circle cx="24.5" cy="23.5" r="3.5" fill="#fff" fillOpacity=".45" stroke="none" />
      </>
    ),
  },
  pacman: {
    from: "#fde047",
    to: "#ca8a04",
    mark: (d) => (
      <>
        <path d="M15 16L24 9.7A11 11 0 1 1 24 22.3Z" fill="#fff" stroke="none" />
        <circle cx="14" cy="10.5" r="1.6" fill={d} stroke="none" />
        <circle cx="29" cy="16" r="1.9" fill="#fff" stroke="none" />
      </>
    ),
  },
  "stack-tower": {
    from: "#fdba74",
    to: "#c2410c",
    mark: () => (
      <>
        <rect x="6" y="22" width="20" height="5" rx="1.5" fill="#fff" stroke="none" />
        <rect x="8" y="16" width="16" height="5" rx="1.5" fill="#fff" fillOpacity=".8" stroke="none" />
        <rect x="11" y="10" width="12" height="5" rx="1.5" fill="#fff" fillOpacity=".62" stroke="none" />
        <rect x="14" y="4" width="9" height="5" rx="1.5" fill="#fff" fillOpacity=".45" stroke="none" />
      </>
    ),
  },
  "lane-racer": {
    from: "#fb7185",
    to: "#be123c",
    mark: (d) => (
      <>
        <path d="M6 5v4M6 13v4M6 21v4M26 5v4M26 13v4M26 21v4" strokeOpacity=".5" />
        <path d="M12 8h8l1.6 6.5V24a2 2 0 0 1-2 2h-7.2a2 2 0 0 1-2-2V14.5z" fill="#fff" stroke="none" />
        <path d="M13.5 13h5" stroke={d} strokeWidth="2.2" />
      </>
    ),
  },
  "road-crossing": {
    from: "#a3e635",
    to: "#4d7c0f",
    mark: (d) => (
      <>
        <path d="M3 21h26M3 28h26" strokeOpacity=".45" />
        <path d="M6 24.5h4M14 24.5h4M22 24.5h4" strokeOpacity=".65" />
        <path d="M11 16a5 5 0 0 1 10 0v2H11z" fill="#fff" stroke="none" />
        <circle cx="13" cy="12.5" r="1.5" fill={d} stroke="none" />
        <circle cx="19" cy="12.5" r="1.5" fill={d} stroke="none" />
        <path d="M11 15L7.5 11M21 15l3.5-4" />
      </>
    ),
  },

  /* ---------------------------------------------------------------- Puzzle */
  tetris: {
    from: "#c084fc",
    to: "#7e22ce",
    mark: () => (
      <>
        <rect x="4" y="7" width="7" height="7" rx="1.4" fill="#fff" stroke="none" />
        <rect x="12.5" y="7" width="7" height="7" rx="1.4" fill="#fff" fillOpacity=".85" stroke="none" />
        <rect x="21" y="7" width="7" height="7" rx="1.4" fill="#fff" stroke="none" />
        <rect x="12.5" y="15.5" width="7" height="7" rx="1.4" fill="#fff" fillOpacity=".6" stroke="none" />
      </>
    ),
  },
  "2048": {
    from: "#fbbf24",
    to: "#d97706",
    mark: (d) => (
      <>
        <rect x="4" y="4" width="11" height="11" rx="2.5" fill="#fff" fillOpacity=".45" stroke="none" />
        <rect x="17" y="4" width="11" height="11" rx="2.5" fill="#fff" fillOpacity=".7" stroke="none" />
        <rect x="4" y="17" width="11" height="11" rx="2.5" fill="#fff" fillOpacity=".7" stroke="none" />
        <rect x="17" y="17" width="11" height="11" rx="2.5" fill="#fff" stroke="none" />
        <path d="M20 22.5h5M22.5 20v5" stroke={d} strokeWidth="2.2" />
      </>
    ),
  },
  "memory-match": {
    from: "#f472b6",
    to: "#be185d",
    mark: (d) => (
      <>
        <rect x="3" y="8" width="11" height="16" rx="2" transform="rotate(-9 8.5 16)" fill="#fff" fillOpacity=".55" stroke="none" />
        <rect x="16" y="7" width="12" height="18" rx="2.5" fill="#fff" stroke="none" />
        <path d="M22 11.5l3.2 4.5-3.2 4.5-3.2-4.5z" fill={d} stroke="none" />
      </>
    ),
  },
  sudoku: {
    from: "#2dd4bf",
    to: "#0f766e",
    mark: () => (
      <>
        <rect x="4" y="4" width="24" height="24" rx="3" />
        <path d="M12 4v24M20 4v24M4 12h24M4 20h24" strokeWidth="1.5" strokeOpacity=".55" />
        <rect x="6" y="6" width="4" height="4" rx="1" fill="#fff" stroke="none" />
        <rect x="14" y="14" width="4" height="4" rx="1" fill="#fff" stroke="none" />
        <rect x="22" y="22" width="4" height="4" rx="1" fill="#fff" stroke="none" />
      </>
    ),
  },
  "trivia-quiz": {
    from: "#fb7185",
    to: "#e11d48",
    mark: () => (
      <>
        <circle cx="16" cy="16" r="11.5" fill="#fff" fillOpacity=".18" stroke="none" />
        <path d="M12.4 12.6a3.7 3.7 0 1 1 5.8 3c-1.4 1.1-2.2 1.9-2.2 3.4" strokeWidth="2.6" />
        <circle cx="16" cy="23.5" r="1.7" fill="#fff" stroke="none" />
      </>
    ),
  },
  match3: {
    from: "#2dd4bf",
    to: "#0f766e",
    mark: () => (
      <>
        <path d="M8 7l4.5 5.5L8 18l-4.5-5.5z" fill="#fff" stroke="none" />
        <path d="M16 7l4.5 5.5L16 18l-4.5-5.5z" fill="#fff" stroke="none" />
        <path d="M24 7l4.5 5.5L24 18l-4.5-5.5z" fill="#fff" stroke="none" />
        <circle cx="10.5" cy="24.5" r="3.6" fill="#fff" fillOpacity=".5" stroke="none" />
        <circle cx="19.5" cy="24.5" r="3.6" fill="#fff" fillOpacity=".5" stroke="none" />
      </>
    ),
  },
  "sliding-puzzle": {
    from: "#818cf8",
    to: "#4338ca",
    mark: () => (
      <>
        <rect x="3.5" y="3.5" width="25" height="25" rx="3" strokeOpacity=".7" />
        <rect x="5.5" y="5.5" width="7" height="7" rx="1.4" fill="#fff" stroke="none" />
        <rect x="12.5" y="5.5" width="7" height="7" rx="1.4" fill="#fff" fillOpacity=".8" stroke="none" />
        <rect x="19.5" y="5.5" width="7" height="7" rx="1.4" fill="#fff" stroke="none" />
        <rect x="5.5" y="12.5" width="7" height="7" rx="1.4" fill="#fff" fillOpacity=".8" stroke="none" />
        <rect x="12.5" y="12.5" width="7" height="7" rx="1.4" fill="#fff" stroke="none" />
        <rect x="19.5" y="12.5" width="7" height="7" rx="1.4" fill="#fff" fillOpacity=".8" stroke="none" />
        <rect x="5.5" y="19.5" width="7" height="7" rx="1.4" fill="#fff" fillOpacity=".8" stroke="none" />
        <rect x="12.5" y="19.5" width="7" height="7" rx="1.4" fill="#fff" stroke="none" />
      </>
    ),
  },
  "lights-out": {
    from: "#fcd34d",
    to: "#b45309",
    mark: () => (
      <>
        <circle cx="9" cy="9" r="3.3" fill="#fff" stroke="none" />
        <circle cx="16" cy="9" r="3.3" fill="#fff" fillOpacity=".28" stroke="none" />
        <circle cx="23" cy="9" r="3.3" fill="#fff" stroke="none" />
        <circle cx="9" cy="16" r="3.3" fill="#fff" fillOpacity=".28" stroke="none" />
        <circle cx="16" cy="16" r="3.3" fill="#fff" stroke="none" />
        <circle cx="23" cy="16" r="3.3" fill="#fff" fillOpacity=".28" stroke="none" />
        <circle cx="9" cy="23" r="3.3" fill="#fff" stroke="none" />
        <circle cx="16" cy="23" r="3.3" fill="#fff" fillOpacity=".28" stroke="none" />
        <circle cx="23" cy="23" r="3.3" fill="#fff" stroke="none" />
      </>
    ),
  },
  "tower-of-hanoi": {
    from: "#e879f9",
    to: "#a21caf",
    mark: () => (
      <>
        <path d="M4 27h24" strokeWidth="2.4" />
        <path d="M16 24V6" strokeOpacity=".7" />
        <rect x="6.5" y="20" width="19" height="4.5" rx="2.2" fill="#fff" stroke="none" />
        <rect x="9.5" y="14.5" width="13" height="4.5" rx="2.2" fill="#fff" fillOpacity=".8" stroke="none" />
        <rect x="12" y="9" width="8" height="4.5" rx="2.2" fill="#fff" fillOpacity=".6" stroke="none" />
      </>
    ),
  },

  /* -------------------------------------------------------------- Strategy */
  minesweeper: {
    from: "#94a3b8",
    to: "#1e293b",
    mark: (d) => (
      <>
        <path d="M16 5v3.5M16 23.5V27M5 16h3.5M23.5 16H27M8.2 8.2l2.5 2.5M23.8 8.2l-2.5 2.5M8.2 23.8l2.5-2.5M23.8 23.8l-2.5-2.5" />
        <circle cx="16" cy="16" r="7" fill="#fff" stroke="none" />
        <circle cx="13.4" cy="13.4" r="1.7" fill={d} stroke="none" />
      </>
    ),
  },
  "tic-tac-toe": {
    from: "#34d399",
    to: "#059669",
    mark: () => (
      <>
        <path d="M13 5v22M21 5v22M5 13h22M5 21h22" strokeOpacity=".55" strokeWidth="1.7" />
        <path d="M6.8 6.8l4.4 4.4M11.2 6.8l-4.4 4.4" strokeWidth="2.6" />
        <circle cx="25" cy="25" r="3" strokeWidth="2.6" />
      </>
    ),
  },
  "connect-four": {
    from: "#fb7185",
    to: "#b91c1c",
    mark: () => (
      <>
        <rect x="4" y="6" width="24" height="22" rx="3" fill="#fff" fillOpacity=".2" stroke="none" />
        <circle cx="10" cy="22.5" r="3.2" fill="#fff" stroke="none" />
        <circle cx="16" cy="22.5" r="3.2" fill="#fff" stroke="none" />
        <circle cx="22" cy="22.5" r="3.2" fill="#fff" fillOpacity=".5" stroke="none" />
        <circle cx="10" cy="14.5" r="3.2" fill="#fff" fillOpacity=".5" stroke="none" />
        <circle cx="16" cy="14.5" r="3.2" fill="#fff" stroke="none" />
      </>
    ),
  },
  "orbit-defense": {
    from: "#818cf8",
    to: "#4338ca",
    mark: () => (
      <>
        <ellipse cx="16" cy="16" rx="12.5" ry="5.5" transform="rotate(-28 16 16)" strokeOpacity=".8" />
        <circle cx="16" cy="16" r="4.5" fill="#fff" stroke="none" />
        <circle cx="26" cy="10.5" r="2.2" fill="#fff" stroke="none" />
        <circle cx="6" cy="21.5" r="1.6" fill="#fff" fillOpacity=".6" stroke="none" />
      </>
    ),
  },
  checkers: {
    from: "#fb7185",
    to: "#b91c1c",
    mark: (d) => (
      <>
        <rect x="4" y="4" width="24" height="24" rx="3" fill="#fff" fillOpacity=".2" stroke="none" />
        <path d="M4 4h8v8H4zM20 4h8v8h-8zM12 12h8v8h-8zM4 20h8v8H4zM20 20h8v8h-8z" fill="#fff" fillOpacity=".5" stroke="none" />
        <circle cx="16" cy="16" r="5.2" fill="#fff" stroke="none" />
        <circle cx="16" cy="16" r="2.4" fill={d} fillOpacity=".7" stroke="none" />
      </>
    ),
  },
  battleship: {
    from: "#60a5fa",
    to: "#1e3a8a",
    mark: () => (
      <>
        <path d="M4 19h24l-3.5 6.5H7.5z" fill="#fff" stroke="none" />
        <path d="M12 19v-4.5h8V19z" fill="#fff" fillOpacity=".8" stroke="none" />
        <path d="M16 14.5V8" />
        <circle cx="16" cy="6.2" r="2.1" fill="#fff" stroke="none" />
        <path d="M3 28h26" strokeOpacity=".5" />
      </>
    ),
  },
  reversi: {
    from: "#34d399",
    to: "#047857",
    mark: (d) => (
      <>
        <rect x="4" y="4" width="24" height="24" rx="3" fill="#fff" fillOpacity=".18" stroke="none" />
        <path d="M12 4v24M20 4v24M4 12h24M4 20h24" strokeWidth="1.3" strokeOpacity=".35" />
        <circle cx="16" cy="8" r="3.3" fill="#fff" stroke="none" />
        <circle cx="8" cy="16" r="3.3" fill="#fff" stroke="none" />
        <circle cx="24" cy="16" r="3.3" fill={d} stroke="none" />
        <circle cx="16" cy="24" r="3.3" fill={d} stroke="none" />
      </>
    ),
  },
  gomoku: {
    from: "#a8a29e",
    to: "#44403c",
    mark: (d) => (
      <>
        <path d="M6 6h20M6 12h20M6 18h20M6 24h20M6 6v18M12 6v18M18 6v18M24 6v18" strokeWidth="1.3" strokeOpacity=".45" />
        <circle cx="6" cy="24" r="2.7" fill="#fff" stroke="none" />
        <circle cx="12" cy="18" r="2.7" fill="#fff" stroke="none" />
        <circle cx="18" cy="12" r="2.7" fill="#fff" stroke="none" />
        <circle cx="24" cy="6" r="2.7" fill="#fff" stroke="none" />
        <circle cx="12" cy="6" r="2.7" fill={d} stroke="none" />
        <circle cx="6" cy="12" r="2.7" fill={d} stroke="none" />
      </>
    ),
  },
  "dots-and-boxes": {
    from: "#38bdf8",
    to: "#0369a1",
    mark: () => (
      <>
        <path d="M8 8h8M8 8v8M16 8v8M8 16h8" strokeWidth="2.4" />
        <rect x="10" y="10" width="4" height="4" rx="1" fill="#fff" fillOpacity=".6" stroke="none" />
        <path d="M16 24h8" strokeWidth="2.4" strokeOpacity=".55" />
        <path d="M24 8v8" strokeWidth="2.4" strokeOpacity=".55" />
        <g fill="#fff" stroke="none">
          <circle cx="8" cy="8" r="2" />
          <circle cx="16" cy="8" r="2" />
          <circle cx="24" cy="8" r="2" />
          <circle cx="8" cy="16" r="2" />
          <circle cx="16" cy="16" r="2" />
          <circle cx="24" cy="16" r="2" />
          <circle cx="8" cy="24" r="2" />
          <circle cx="16" cy="24" r="2" />
          <circle cx="24" cy="24" r="2" />
        </g>
      </>
    ),
  },

  /* ---------------------------------------------------------------- Action */
  reaction: {
    from: "#fb7185",
    to: "#dc2626",
    mark: () => (
      <>
        <circle cx="16" cy="18" r="9.5" />
        <path d="M12.5 4.5h7M16 4.5v4" />
        <path d="M17.5 12.5l-3.5 6.5h4l-2.5 6" strokeWidth="2.2" />
      </>
    ),
  },
  "color-match": {
    from: "#f472b6",
    to: "#be185d",
    mark: () => (
      <>
        <circle cx="12.5" cy="12.5" r="7.5" fill="#fff" fillOpacity=".38" stroke="none" />
        <circle cx="19.5" cy="12.5" r="7.5" fill="#fff" fillOpacity=".58" stroke="none" />
        <circle cx="16" cy="20" r="7.5" fill="#fff" fillOpacity=".85" stroke="none" />
      </>
    ),
  },
  "space-invaders": {
    from: "#22d3ee",
    to: "#0e7490",
    mark: (d) => (
      <>
        <path d="M10 8.5V5M22 8.5V5" />
        <path d="M8 20v-5.5a8 8 0 0 1 16 0V20z" fill="#fff" stroke="none" />
        <circle cx="12.8" cy="14.5" r="1.7" fill={d} stroke="none" />
        <circle cx="19.2" cy="14.5" r="1.7" fill={d} stroke="none" />
        <path d="M10 20v5M16 20v3.5M22 20v5" />
      </>
    ),
  },
  "simon-says": {
    from: "#a78bfa",
    to: "#6d28d9",
    mark: (d) => (
      <>
        <path d="M16 16V4.5A11.5 11.5 0 0 1 27.5 16z" fill="#fff" fillOpacity=".9" stroke="none" />
        <path d="M16 16h11.5A11.5 11.5 0 0 1 16 27.5z" fill="#fff" fillOpacity=".55" stroke="none" />
        <path d="M16 16v11.5A11.5 11.5 0 0 1 4.5 16z" fill="#fff" fillOpacity=".35" stroke="none" />
        <path d="M16 16H4.5A11.5 11.5 0 0 1 16 4.5z" fill="#fff" fillOpacity=".72" stroke="none" />
        <circle cx="16" cy="16" r="4" fill={d} stroke="none" />
      </>
    ),
  },
  "whack-a-mole": {
    from: "#4ade80",
    to: "#15803d",
    mark: (d) => (
      <>
        <ellipse cx="16" cy="24" rx="11.5" ry="4" fill={d} fillOpacity=".4" stroke="none" />
        <path d="M8 24a8 8 0 0 1 16 0z" fill="#fff" stroke="none" />
        <circle cx="12.8" cy="19.5" r="1.5" fill={d} stroke="none" />
        <circle cx="19.2" cy="19.5" r="1.5" fill={d} stroke="none" />
        <rect x="19" y="4" width="9" height="4.5" rx="1.6" transform="rotate(28 23.5 6.2)" fill="#fff" stroke="none" />
        <path d="M20.5 9l-4 4.5" strokeOpacity=".8" />
      </>
    ),
  },
  asteroids: {
    from: "#22d3ee",
    to: "#0e7490",
    mark: () => (
      <>
        <path d="M11 5l6 13.5-6-2.5-6 2.5z" fill="#fff" stroke="none" />
        <path d="M22 14.5l4.5 1L29 20l-3 4.5-5.5-1L19 19z" fill="#fff" fillOpacity=".65" stroke="none" />
        <circle cx="8" cy="24.5" r="2.8" fill="#fff" fillOpacity=".45" stroke="none" />
      </>
    ),
  },
  "aim-trainer": {
    from: "#fb7185",
    to: "#b91c1c",
    mark: () => (
      <>
        <circle cx="16" cy="16" r="10" />
        <circle cx="16" cy="16" r="5" strokeOpacity=".7" />
        <circle cx="16" cy="16" r="1.9" fill="#fff" stroke="none" />
        <path d="M16 2.5v4M16 25.5v4M2.5 16h4M25.5 16h4" />
      </>
    ),
  },
  "rhythm-tap": {
    from: "#f0abfc",
    to: "#a21caf",
    mark: () => (
      <>
        <path d="M8 4v20M16 4v20M24 4v20" strokeOpacity=".4" />
        <rect x="5" y="7" width="6" height="3.6" rx="1.8" fill="#fff" stroke="none" />
        <rect x="21" y="5.5" width="6" height="3.6" rx="1.8" fill="#fff" fillOpacity=".62" stroke="none" />
        <rect x="13" y="13" width="6" height="3.6" rx="1.8" fill="#fff" fillOpacity=".82" stroke="none" />
        <rect x="5" y="19" width="6" height="3.6" rx="1.8" fill="#fff" fillOpacity=".5" stroke="none" />
        <path d="M3 27h26" strokeWidth="2.6" />
      </>
    ),
  },
  "meteor-dodge": {
    from: "#fb923c",
    to: "#c2410c",
    mark: () => (
      <>
        <path d="M28 4l-5 5M29 10l-4 3" strokeOpacity=".6" />
        <circle cx="21" cy="11" r="4.6" fill="#fff" stroke="none" />
        <circle cx="9" cy="8" r="2.4" fill="#fff" fillOpacity=".5" stroke="none" />
        <path d="M16 19l6.5 9h-13z" fill="#fff" fillOpacity=".9" stroke="none" />
      </>
    ),
  },

  /* ------------------------------------------------------------------ Card */
  solitaire: {
    from: "#60a5fa",
    to: "#1d4ed8",
    mark: (d) => (
      <>
        <rect x="3" y="9" width="11" height="17" rx="2" transform="rotate(-14 8.5 17.5)" fill="#fff" fillOpacity=".5" stroke="none" />
        <rect x="12" y="6.5" width="14" height="19.5" rx="2.5" fill="#fff" stroke="none" />
        <path
          d="M19 11c-2.2 2.7-4.3 4.3-4.3 6.4a2.5 2.5 0 0 0 3.6 2.2c-.2 1-.6 1.7-1.3 2.4h4c-.7-.7-1.1-1.4-1.3-2.4a2.5 2.5 0 0 0 3.6-2.2c0-2.1-2.1-3.7-4.3-6.4z"
          fill={d}
          stroke="none"
        />
      </>
    ),
  },
  blackjack: {
    from: "#fb7185",
    to: "#b91c1c",
    mark: (d) => (
      <>
        <rect x="3" y="9" width="12" height="17" rx="2.5" transform="rotate(-13 9 17.5)" fill="#fff" fillOpacity=".55" stroke="none" />
        <rect x="14" y="6.5" width="14" height="19.5" rx="2.5" fill="#fff" stroke="none" />
        <text x="21" y="21.5" textAnchor="middle" fontSize="13" fontWeight="700" fill={d} stroke="none">
          A
        </text>
      </>
    ),
  },
  poker: {
    from: "#a78bfa",
    to: "#6d28d9",
    mark: (d) => (
      <>
        <rect x="4" y="5" width="13" height="18" rx="2.5" fill="#fff" stroke="none" />
        <path d="M10.5 9.5l3.2 4.5-3.2 4.5-3.2-4.5z" fill={d} stroke="none" />
        <circle cx="21.5" cy="21.5" r="7" fill="#fff" stroke="none" />
        <circle cx="21.5" cy="21.5" r="4" fill="none" stroke={d} strokeWidth="2.2" strokeDasharray="2.6 2.6" />
      </>
    ),
  },
  "card-war": {
    from: "#94a3b8",
    to: "#1e293b",
    mark: (d) => (
      <>
        <rect x="4" y="8" width="12" height="17" rx="2.5" transform="rotate(-18 10 16.5)" fill="#fff" fillOpacity=".6" stroke="none" />
        <rect x="16" y="8" width="12" height="17" rx="2.5" transform="rotate(18 22 16.5)" fill="#fff" stroke="none" />
        <path d="M22 14l2.6 3.5-2.6 3.5-2.6-3.5z" fill={d} stroke="none" />
      </>
    ),
  },
  "hi-lo": {
    from: "#4ade80",
    to: "#15803d",
    mark: (d) => (
      <>
        <rect x="3" y="7" width="14" height="19" rx="2.5" fill="#fff" stroke="none" />
        <text x="10" y="21.5" textAnchor="middle" fontSize="12" fontWeight="700" fill={d} stroke="none">
          7
        </text>
        <path d="M23.5 15V6.5M20.5 9.5l3-3 3 3" strokeWidth="2.4" />
        <path d="M23.5 17.5V26M20.5 23l3 3 3-3" strokeWidth="2.4" strokeOpacity=".6" />
      </>
    ),
  },
  "crazy-eights": {
    from: "#c084fc",
    to: "#6d28d9",
    mark: (d) => (
      <>
        <rect x="4" y="7" width="12" height="17" rx="2.5" transform="rotate(-12 10 15.5)" fill="#fff" fillOpacity=".5" stroke="none" />
        <rect x="10" y="5" width="18" height="22" rx="3" fill="#fff" stroke="none" />
        <text x="19" y="22.5" textAnchor="middle" fontSize="16" fontWeight="700" fill={d} stroke="none">
          8
        </text>
      </>
    ),
  },

  /* ------------------------------------------------------------------ Word */
  "word-scramble": {
    from: "#c084fc",
    to: "#7e22ce",
    mark: () => (
      <>
        <path d="M4 19l4-10 4 10M5.5 15.5h5" strokeWidth="2.2" />
        <path d="M17 9h7l-7 10h7" strokeWidth="2.2" />
        <path d="M8 25h16M20 22.5l3.5 2.5-3.5 2.5" strokeOpacity=".7" />
      </>
    ),
  },
  "typing-speed": {
    from: "#a78bfa",
    to: "#6d28d9",
    mark: () => (
      <>
        <rect x="3" y="9" width="26" height="15" rx="3" fill="#fff" fillOpacity=".2" stroke="none" />
        <g fill="#fff" stroke="none">
          <rect x="6" y="12" width="3.5" height="3" rx=".8" />
          <rect x="11" y="12" width="3.5" height="3" rx=".8" />
          <rect x="16" y="12" width="3.5" height="3" rx=".8" />
          <rect x="21" y="12" width="3.5" height="3" rx=".8" fillOpacity=".6" />
          <rect x="6" y="16.5" width="3.5" height="3" rx=".8" fillOpacity=".6" />
          <rect x="11" y="16.5" width="3.5" height="3" rx=".8" />
          <rect x="16" y="16.5" width="3.5" height="3" rx=".8" fillOpacity=".6" />
          <rect x="21" y="16.5" width="3.5" height="3" rx=".8" />
          <rect x="9" y="21" width="14" height="2.4" rx="1.2" />
        </g>
      </>
    ),
  },
  hangman: {
    from: "#c084fc",
    to: "#7e22ce",
    mark: () => (
      <>
        <path d="M6 28h9M10.5 28V5h11v4.5" strokeWidth="2.2" />
        <circle cx="21.5" cy="12.8" r="3.1" />
        <path d="M21.5 15.9v6.2M21.5 17.5l-3.2 3.2M21.5 17.5l3.2 3.2M21.5 22.1L19 26M21.5 22.1L24 26" />
      </>
    ),
  },
  "word-search": {
    from: "#38bdf8",
    to: "#0284c7",
    mark: () => (
      <>
        <rect x="4" y="4" width="19" height="19" rx="2.5" fill="#fff" fillOpacity=".2" stroke="none" />
        <path d="M10.3 4v19M16.6 4v19M4 10.3h19M4 16.6h19" strokeWidth="1.3" strokeOpacity=".45" />
        <path d="M6 7.5h2.4M12.5 14h2.4" strokeWidth="2" />
        <circle cx="21" cy="20" r="6.2" strokeWidth="2.4" />
        <path d="M25.6 24.6l3.4 3.4" strokeWidth="3" />
      </>
    ),
  },
  wordle: {
    from: "#4ade80",
    to: "#15803d",
    mark: () => (
      <>
        <rect x="4" y="7" width="7" height="7" rx="1.5" fill="#fff" stroke="none" />
        <rect x="12.5" y="7" width="7" height="7" rx="1.5" fill="#fff" fillOpacity=".4" stroke="none" />
        <rect x="21" y="7" width="7" height="7" rx="1.5" fill="#fff" stroke="none" />
        <rect x="4" y="18" width="7" height="7" rx="1.5" fill="#fff" fillOpacity=".4" stroke="none" />
        <rect x="12.5" y="18" width="7" height="7" rx="1.5" fill="#fff" stroke="none" />
        <rect x="21" y="18" width="7" height="7" rx="1.5" fill="#fff" fillOpacity=".4" stroke="none" />
      </>
    ),
  },
  "anagram-hunt": {
    from: "#fdba74",
    to: "#c2410c",
    mark: () => (
      <>
        <text x="3" y="17" fontSize="13" fontWeight="700" fill="#fff" stroke="none">
          A
        </text>
        <text x="14" y="11" fontSize="10" fontWeight="700" fill="#fff" fillOpacity=".65" stroke="none">
          N
        </text>
        <text x="5" y="28" fontSize="10" fontWeight="700" fill="#fff" fillOpacity=".65" stroke="none">
          G
        </text>
        <circle cx="21" cy="19" r="6.2" strokeWidth="2.4" />
        <path d="M25.6 23.6l3.4 3.4" strokeWidth="3" />
      </>
    ),
  },
  "spelling-bee": {
    from: "#fde047",
    to: "#ca8a04",
    mark: () => (
      <>
        <path d={HEX(16, 11.5, 7.5)} fill="#fff" stroke="none" />
        <path d={HEX(9.5, 23, 6)} fill="#fff" fillOpacity=".55" stroke="none" />
        <path d={HEX(22.5, 23, 6)} fill="#fff" fillOpacity=".55" stroke="none" />
      </>
    ),
  },
}

const fallback: Brand = {
  from: "#a1a1aa",
  to: "#3f3f46",
  mark: () => (
    <>
      <rect x="3.5" y="8.5" width="25" height="15" rx="5" />
      <path d="M10 13v5M7.5 15.5h5" strokeWidth="2.2" />
      <circle cx="21" cy="14.5" r="1.6" fill="#fff" stroke="none" />
      <circle cx="24.5" cy="18" r="1.6" fill="#fff" stroke="none" />
    </>
  ),
}

export function getGameBrand(gameId: string): { from: string; to: string } {
  const b = brands[gameId] || fallback
  return { from: b.from, to: b.to }
}

interface GameLogoProps {
  gameId: string
  size?: number
  className?: string
  rounded?: string
}

export default function GameLogo({ gameId, size = 40, className = "", rounded = "rounded-xl" }: GameLogoProps) {
  const brand = brands[gameId] || fallback

  return (
    <div
      className={`relative shrink-0 flex items-center justify-center overflow-hidden ${rounded} ${className}`}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(140deg, ${brand.from} 0%, ${brand.to} 100%)`,
        boxShadow: "0 1px 2px rgb(0 0 0 / 0.2), inset 0 1px 0 rgb(255 255 255 / 0.3)",
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 32 32"
        width={Math.round(size * 0.66)}
        height={Math.round(size * 0.66)}
        fill="none"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {brand.mark(brand.to)}
      </svg>
    </div>
  )
}
