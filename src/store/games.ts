// src/store/games.ts
import type { StateCreator } from "zustand";

export interface GameScore {
  anonId: string;
  handle?: string;
  score: number;
  ts: number;
}

export interface GameSession {
  gameId: string;
  startTime: number;
  score: number;
  active: boolean;
}

export interface GamesSlice {
  sessions: Record<string, GameSession>;
  leaderboards: Record<string, { today: GameScore[]; allTime: GameScore[] }>;
  startGame: (gameId: string) => void;
  endGame: (gameId: string) => void;
  submitScore: (
    gameId: string,
    score: number,
    anonId: string,
    handle?: string
  ) => void;
  setLeaderboard: (
    gameId: string,
    data: { today: GameScore[]; allTime: GameScore[] }
  ) => void;
}

export const createGamesSlice: StateCreator<GamesSlice, [], [], GamesSlice> = (set) => ({
  sessions: {},
  leaderboards: {},

  startGame: (gameId) =>
    set((state) => ({
      sessions: {
        ...state.sessions,
        [gameId]: {
          gameId,
          startTime: Date.now(),
          score: 0,
          active: true,
        },
      },
    })),

  endGame: (gameId) =>
    set((state) => {
      const sess = state.sessions[gameId];
      if (!sess) return state;
      return {
        sessions: {
          ...state.sessions,
          [gameId]: { ...sess, active: false },
        },
      };
    }),

  submitScore: (gameId, score, anonId, handle) =>
    set((state) => {
      const now = Date.now();
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const isToday = now >= todayStart.getTime();

      const gameBoard = state.leaderboards[gameId] ?? { today: [], allTime: [] };
      const newScore: GameScore = { anonId, handle, score, ts: now };

      const nextToday = isToday
        ? [...gameBoard.today, newScore].sort((a, b) => b.score - a.score).slice(0, 10)
        : gameBoard.today;

      const nextAllTime = [...gameBoard.allTime, newScore]
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      return {
        leaderboards: {
          ...state.leaderboards,
          [gameId]: {
            today: nextToday,
            allTime: nextAllTime,
          },
        },
      };
    }),

  setLeaderboard: (gameId, data) =>
    set((state) => ({
      leaderboards: {
        ...state.leaderboards,
        [gameId]: data,
      },
    })),
});
