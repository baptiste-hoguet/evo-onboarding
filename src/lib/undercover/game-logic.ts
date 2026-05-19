import type { GameState, Player, Role, WordPair, Winner } from "./types";

export function maxUndercovers(playerCount: number): number {
  return Math.max(1, Math.floor(playerCount / 3));
}

export function shuffle<T>(items: readonly T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function assignRoles(
  names: readonly string[],
  numUndercovers: number,
  hasMrWhite: boolean,
  wordPair: WordPair,
  randomize: boolean = true,
): Player[] {
  const total = names.length;
  const mrWhiteCount = hasMrWhite ? 1 : 0;
  const numCivilians = total - numUndercovers - mrWhiteCount;
  if (numCivilians < 1) {
    throw new Error("Pas assez de civils. Réduis le nombre d'undercovers.");
  }

  const roles: Role[] = [
    ...Array.from({ length: numCivilians }, () => "civilian" as Role),
    ...Array.from({ length: numUndercovers }, () => "undercover" as Role),
    ...(hasMrWhite ? (["mrwhite"] as Role[]) : []),
  ];

  const shuffledRoles = randomize ? shuffle(roles) : roles;

  return names.map((name, index) => {
    const role = shuffledRoles[index];
    return {
      id: `p-${index}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      role,
      word:
        role === "civilian"
          ? wordPair.civilian
          : role === "undercover"
            ? wordPair.undercover
            : null,
      alive: true,
    };
  });
}

export function buildSpeakingOrder(players: readonly Player[]): string[] {
  const alive = players.filter((p) => p.alive);
  const order = shuffle(alive);
  const mrWhiteAlive = alive.some((p) => p.role === "mrwhite");
  if (mrWhiteAlive && order[0]?.role === "mrwhite" && order.length > 1) {
    const swapIdx = 1 + Math.floor(Math.random() * (order.length - 1));
    [order[0], order[swapIdx]] = [order[swapIdx], order[0]];
  }
  return order.map((p) => p.id);
}

export function tallyVotes(votes: Record<string, string>): {
  topCandidates: string[];
  counts: Record<string, number>;
} {
  const counts: Record<string, number> = {};
  for (const targetId of Object.values(votes)) {
    counts[targetId] = (counts[targetId] ?? 0) + 1;
  }
  let max = 0;
  for (const v of Object.values(counts)) {
    if (v > max) max = v;
  }
  const topCandidates = Object.entries(counts)
    .filter(([, v]) => v === max && max > 0)
    .map(([id]) => id);
  return { topCandidates, counts };
}

export function pickRandomFromTie(candidates: readonly string[]): string {
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function determineWinner(
  players: readonly Player[],
  mrWhiteJustEliminated: boolean,
  mrWhiteGuessedRight: boolean,
): Winner | null {
  if (mrWhiteJustEliminated && mrWhiteGuessedRight) return "mrwhite";

  const aliveCivilians = players.filter(
    (p) => p.alive && p.role === "civilian",
  ).length;
  const aliveUndercovers = players.filter(
    (p) => p.alive && p.role === "undercover",
  ).length;
  const aliveMrWhite = players.filter(
    (p) => p.alive && p.role === "mrwhite",
  ).length;
  const totalAlive = aliveCivilians + aliveUndercovers + aliveMrWhite;

  if (aliveUndercovers === 0 && aliveMrWhite === 0) return "civilians";

  if (aliveMrWhite > 0 && totalAlive <= 2) return "mrwhite";

  if (aliveUndercovers > 0 && aliveUndercovers >= aliveCivilians) {
    return "undercovers";
  }

  if (aliveCivilians === 0 && aliveMrWhite > 0) return "mrwhite";

  return null;
}

export function normalizeName(name: string): string {
  return name.trim().toLocaleLowerCase("fr-FR");
}

export function validatePlayerNames(names: readonly string[]): {
  ok: boolean;
  error?: string;
} {
  const trimmed = names.map((n) => n.trim());
  if (trimmed.length < 3) {
    return { ok: false, error: "Au moins 3 joueurs sont requis." };
  }
  if (trimmed.length > 20) {
    return { ok: false, error: "Maximum 20 joueurs." };
  }
  if (trimmed.some((n) => n.length === 0)) {
    return { ok: false, error: "Chaque joueur doit avoir un pseudo." };
  }
  const seen = new Set<string>();
  for (const n of trimmed) {
    const key = normalizeName(n);
    if (seen.has(key)) {
      return { ok: false, error: `Le pseudo « ${n} » est en double.` };
    }
    seen.add(key);
  }
  return { ok: true };
}

export function initialState(): GameState {
  return {
    phase: "setup",
    players: [],
    wordPair: { civilian: "", undercover: "" },
    numUndercovers: 1,
    hasMrWhite: false,
    distributionIndex: 0,
    speakingOrder: [],
    votes: {},
    voterIndex: 0,
    voterPool: [],
    tieCandidates: null,
    eliminatedPlayerId: null,
    winner: null,
    round: 0,
  };
}

export function startVotingRound(state: GameState): GameState {
  const voterPool = state.players.filter((p) => p.alive).map((p) => p.id);
  return {
    ...state,
    phase: "vote",
    votes: {},
    voterIndex: 0,
    voterPool: shuffle(voterPool),
    tieCandidates: null,
  };
}

export function startTiebreakerVote(
  state: GameState,
  tied: readonly string[],
): GameState {
  const voterPool = state.players.filter((p) => p.alive).map((p) => p.id);
  return {
    ...state,
    phase: "vote",
    votes: {},
    voterIndex: 0,
    voterPool: shuffle(voterPool),
    tieCandidates: [...tied],
  };
}

export function eliminatePlayer(
  state: GameState,
  playerId: string,
): GameState {
  return {
    ...state,
    players: state.players.map((p) =>
      p.id === playerId ? { ...p, alive: false } : p,
    ),
    eliminatedPlayerId: playerId,
  };
}

export function nextRound(state: GameState): GameState {
  return {
    ...state,
    phase: "description",
    round: state.round + 1,
    speakingOrder: buildSpeakingOrder(state.players),
    votes: {},
    voterIndex: 0,
    voterPool: [],
    tieCandidates: null,
    eliminatedPlayerId: null,
  };
}

export function findPlayer(
  players: readonly Player[],
  id: string,
): Player | undefined {
  return players.find((p) => p.id === id);
}

export function aliveCount(players: readonly Player[]): number {
  return players.filter((p) => p.alive).length;
}
