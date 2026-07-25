export type Role = "civilian" | "undercover" | "mrwhite";

export type Player = {
  id: string;
  name: string;
  role: Role;
  word: string | null;
  alive: boolean;
};

export type WordPair = {
  civilian: string;
  undercover: string;
};

export type Phase =
  | "setup"
  | "config"
  | "distribution"
  | "description"
  | "vote"
  | "reveal"
  | "mrWhiteGuess"
  | "gameOver";

export type Winner = "civilians" | "undercovers" | "mrwhite";

export type GameState = {
  phase: Phase;
  players: Player[];
  wordPair: WordPair;
  numUndercovers: number;
  hasMrWhite: boolean;
  distributionIndex: number;
  speakingOrder: string[];
  votes: Record<string, string>;
  voterIndex: number;
  voterPool: string[];
  tieCandidates: string[] | null;
  eliminatedPlayerId: string | null;
  winner: Winner | null;
  round: number;
};
