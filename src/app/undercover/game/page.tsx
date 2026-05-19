"use client";

import { useMemo, useReducer } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/undercover/Header";
import { PlayerSetup } from "@/components/undercover/PlayerSetup";
import { GameConfig } from "@/components/undercover/GameConfig";
import { DistributionPhase } from "@/components/undercover/DistributionPhase";
import { DescriptionPhase } from "@/components/undercover/DescriptionPhase";
import { VotePhase } from "@/components/undercover/VotePhase";
import { RevealPhase } from "@/components/undercover/RevealPhase";
import { MrWhiteGuess } from "@/components/undercover/MrWhiteGuess";
import { GameOver } from "@/components/undercover/GameOver";
import {
  aliveCount,
  assignRoles,
  buildSpeakingOrder,
  determineWinner,
  eliminatePlayer,
  initialState,
  nextRound,
  pickRandomFromTie,
  startTiebreakerVote,
  startVotingRound,
  tallyVotes,
} from "@/lib/undercover/game-logic";
import type {
  GameState,
  Phase,
  Player,
  WordPair,
} from "@/lib/undercover/types";

type Action =
  | { type: "SET_PLAYERS"; names: string[] }
  | { type: "GO_TO_SETUP" }
  | {
      type: "START_GAME";
      numUndercovers: number;
      hasMrWhite: boolean;
      wordPair: WordPair;
    }
  | { type: "NEXT_DISTRIBUTION" }
  | { type: "START_DESCRIPTION" }
  | { type: "CAST_VOTE"; voterId: string; targetId: string }
  | { type: "ACK_REVEAL" }
  | { type: "MRWHITE_GUESS"; guess: string }
  | { type: "REPLAY_SAME" };

type DraftState = GameState & {
  pendingNames: string[];
  pendingNumUndercovers: number;
  pendingHasMrWhite: boolean;
  pendingWordPair: WordPair | null;
  lastVoteCounts: Record<string, number>;
};

const ROUND_PHASES: ReadonlySet<Phase> = new Set<Phase>([
  "description",
  "vote",
  "reveal",
  "mrWhiteGuess",
]);

function normalizeForCompare(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("fr-FR")
    .trim();
}

function makeDraft(): DraftState {
  return {
    ...initialState(),
    pendingNames: [],
    pendingNumUndercovers: 1,
    pendingHasMrWhite: false,
    pendingWordPair: null,
    lastVoteCounts: {},
  };
}

function reducer(state: DraftState, action: Action): DraftState {
  switch (action.type) {
    case "SET_PLAYERS": {
      const suggestedUC = Math.max(
        1,
        Math.min(state.pendingNumUndercovers, Math.floor(action.names.length / 3)),
      );
      return {
        ...state,
        pendingNames: action.names,
        pendingNumUndercovers: suggestedUC,
        phase: "config",
      };
    }
    case "START_GAME": {
      const players = assignRoles(
        state.pendingNames,
        action.numUndercovers,
        action.hasMrWhite,
        action.wordPair,
      );
      return {
        ...state,
        pendingNumUndercovers: action.numUndercovers,
        pendingHasMrWhite: action.hasMrWhite,
        pendingWordPair: action.wordPair,
        phase: "distribution",
        players,
        wordPair: action.wordPair,
        numUndercovers: action.numUndercovers,
        hasMrWhite: action.hasMrWhite,
        distributionIndex: 0,
        speakingOrder: [],
        votes: {},
        voterIndex: 0,
        voterPool: [],
        tieCandidates: null,
        eliminatedPlayerId: null,
        winner: null,
        round: 0,
        lastVoteCounts: {},
      };
    }
    case "NEXT_DISTRIBUTION": {
      const next = state.distributionIndex + 1;
      if (next >= state.players.length) {
        return {
          ...state,
          phase: "description",
          distributionIndex: next,
          round: 1,
          speakingOrder: buildSpeakingOrder(state.players),
        };
      }
      return { ...state, distributionIndex: next };
    }
    case "START_DESCRIPTION": {
      return startVotingRound(state) as DraftState;
    }
    case "CAST_VOTE": {
      const newVotes = { ...state.votes, [action.voterId]: action.targetId };
      const nextVoterIndex = state.voterIndex + 1;

      if (nextVoterIndex < state.voterPool.length) {
        return {
          ...state,
          votes: newVotes,
          voterIndex: nextVoterIndex,
        };
      }

      const { topCandidates, counts } = tallyVotes(newVotes);

      if (topCandidates.length > 1 && state.tieCandidates === null) {
        return {
          ...startTiebreakerVote(
            { ...state, votes: newVotes },
            topCandidates,
          ) as DraftState,
          lastVoteCounts: counts,
        };
      }

      let eliminatedId: string;
      if (topCandidates.length > 1) {
        eliminatedId = pickRandomFromTie(topCandidates);
      } else {
        eliminatedId = topCandidates[0];
      }

      const eliminatedState = eliminatePlayer(
        { ...state, votes: newVotes },
        eliminatedId,
      );
      return {
        ...eliminatedState,
        phase: "reveal",
        lastVoteCounts: counts,
      } as DraftState;
    }
    case "ACK_REVEAL": {
      const eliminated = state.players.find(
        (p) => p.id === state.eliminatedPlayerId,
      );
      if (!eliminated) return state;

      if (eliminated.role === "mrwhite") {
        return { ...state, phase: "mrWhiteGuess" };
      }

      const winner = determineWinner(state.players, false, false);
      if (winner) {
        return { ...state, phase: "gameOver", winner };
      }
      return nextRound(state) as DraftState;
    }
    case "MRWHITE_GUESS": {
      const guessedRight =
        normalizeForCompare(action.guess) ===
        normalizeForCompare(state.wordPair.civilian);
      const winner = determineWinner(state.players, true, guessedRight);
      if (winner) {
        return { ...state, phase: "gameOver", winner };
      }
      return nextRound(state) as DraftState;
    }
    case "REPLAY_SAME": {
      const names = state.players.map((p) => p.name);
      const players = assignRoles(
        names,
        state.numUndercovers,
        state.hasMrWhite,
        state.wordPair,
      );
      return {
        ...state,
        phase: "distribution",
        players,
        distributionIndex: 0,
        speakingOrder: [],
        votes: {},
        voterIndex: 0,
        voterPool: [],
        tieCandidates: null,
        eliminatedPlayerId: null,
        winner: null,
        round: 0,
        lastVoteCounts: {},
      };
    }
    case "GO_TO_SETUP": {
      return { ...state, phase: "setup" };
    }
    default:
      return state;
  }
}

export default function GamePage() {
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, undefined, makeDraft);

  const subtitle = useMemo(() => {
    if (ROUND_PHASES.has(state.phase) && state.round > 0) {
      return `Tour ${state.round} · ${aliveCount(state.players)} en jeu`;
    }
    if (state.phase === "distribution") {
      return `Distribution ${state.distributionIndex + 1}/${state.players.length}`;
    }
    return undefined;
  }, [state.phase, state.round, state.players, state.distributionIndex]);

  const eliminatedPlayer: Player | undefined = useMemo(
    () =>
      state.eliminatedPlayerId
        ? state.players.find((p) => p.id === state.eliminatedPlayerId)
        : undefined,
    [state.players, state.eliminatedPlayerId],
  );

  return (
    <main className="min-h-screen flex flex-col">
      <Header subtitle={subtitle} />

      <div className="flex-1 px-5 py-6 max-w-md mx-auto w-full">
        {state.phase === "setup" && (
          <PlayerSetup
            initialNames={state.pendingNames}
            onConfirm={(names) => dispatch({ type: "SET_PLAYERS", names })}
          />
        )}

        {state.phase === "config" && (
          <GameConfig
            playerCount={state.pendingNames.length}
            initialNumUndercovers={state.pendingNumUndercovers}
            initialHasMrWhite={state.pendingHasMrWhite}
            initialWordPair={state.pendingWordPair}
            onBack={() => dispatch({ type: "GO_TO_SETUP" })}
            onConfirm={(config) => dispatch({ type: "START_GAME", ...config })}
          />
        )}

        {state.phase === "distribution" &&
          state.players[state.distributionIndex] && (
            <DistributionPhase
              key={state.distributionIndex}
              player={state.players[state.distributionIndex]}
              index={state.distributionIndex}
              total={state.players.length}
              onSeen={() => dispatch({ type: "NEXT_DISTRIBUTION" })}
            />
          )}

        {state.phase === "description" && (
          <DescriptionPhase
            players={state.players}
            speakingOrder={state.speakingOrder}
            round={state.round}
            onContinue={() => dispatch({ type: "START_DESCRIPTION" })}
          />
        )}

        {state.phase === "vote" && (
          <VotePhase
            key={`${state.round}-${state.voterIndex}-${state.tieCandidates ? "tb" : "main"}`}
            players={state.players}
            voterPool={state.voterPool}
            voterIndex={state.voterIndex}
            candidatesFilter={state.tieCandidates}
            isTiebreaker={state.tieCandidates !== null}
            onCastVote={(voterId, targetId) =>
              dispatch({ type: "CAST_VOTE", voterId, targetId })
            }
          />
        )}

        {state.phase === "reveal" && eliminatedPlayer && (
          <RevealPhase
            eliminated={eliminatedPlayer}
            voteCounts={state.lastVoteCounts}
            players={state.players}
            continueLabel={
              eliminatedPlayer.role === "mrwhite"
                ? "Dernière chance pour Mr. White"
                : "Continuer"
            }
            onContinue={() => dispatch({ type: "ACK_REVEAL" })}
          />
        )}

        {state.phase === "mrWhiteGuess" && eliminatedPlayer && (
          <MrWhiteGuess
            mrWhite={eliminatedPlayer}
            onSubmit={(guess) => dispatch({ type: "MRWHITE_GUESS", guess })}
          />
        )}

        {state.phase === "gameOver" && state.winner && (
          <GameOver
            winner={state.winner}
            players={state.players}
            wordPair={state.wordPair}
            onReplay={() => dispatch({ type: "REPLAY_SAME" })}
            onNewGame={() => router.push("/undercover")}
          />
        )}
      </div>
    </main>
  );
}
