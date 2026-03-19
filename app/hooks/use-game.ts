import { useReducer, useCallback } from "react";
import type {
  GameState,
  GameSettings,
  PlayerHand,
  Card,
  Decision,
  HandResult,
  ActionType,
} from "~/lib/types";
import { createDeck, shuffle, drawCard, cardValue } from "~/lib/deck";
import {
  getHandValue,
  isBusted,
  isBlackjack,
  shouldDealerHit,
  getOutcome,
  calculatePayout,
} from "~/lib/blackjack";
import { getCorrectAction } from "~/lib/strategy";

type GameAction =
  | { type: "PLACE_BET"; amount: number; settings: GameSettings }
  | { type: "HIT"; settings: GameSettings }
  | { type: "STAND"; settings: GameSettings }
  | { type: "DOUBLE"; settings: GameSettings }
  | { type: "SPLIT"; settings: GameSettings }
  | { type: "SURRENDER"; settings: GameSettings }
  | { type: "NEW_HAND" }
  | { type: "RESET" };

function createInitialState(): GameState {
  return {
    deck: [],
    dealerHand: [],
    playerHands: [],
    activeHandIndex: 0,
    phase: "betting",
    balance: 1000,
    currentBet: 25,
    decisions: [],
    handResults: [],
    sessionStats: { handsPlayed: 0, correctDecisions: 0, totalDecisions: 0 },
    message: "",
  };
}

function createEmptyHand(bet: number): PlayerHand {
  return {
    cards: [],
    bet,
    isDoubled: false,
    isSplit: false,
    isStanding: false,
    isBusted: false,
    splitFromAces: false,
  };
}

function recordDecision(
  state: GameState,
  action: ActionType,
  settings: GameSettings
): Decision {
  const hand = state.playerHands[state.activeHandIndex];
  const dealerUpcard = state.dealerHand.find((c) => c.faceUp)!;
  const isFirstAction = hand.cards.length === 2 && !hand.isDoubled;
  const correct = getCorrectAction(
    hand,
    dealerUpcard,
    settings,
    state.playerHands.length,
    isFirstAction
  );

  return {
    playerCards: [...hand.cards],
    dealerUpcard,
    action,
    correctAction: correct.action,
    chartAction: correct.chartAction,
    wasCorrect: action === correct.action,
    handIndex: state.activeHandIndex,
  };
}

function advanceToNextHand(state: GameState, settings: GameSettings): GameState {
  const nextIndex = state.activeHandIndex + 1;
  if (nextIndex < state.playerHands.length) {
    const nextHand = state.playerHands[nextIndex];
    if (nextHand.splitFromAces) {
      const draw = drawCard(state.deck);
      const updatedHands = [...state.playerHands];
      updatedHands[nextIndex] = {
        ...nextHand,
        cards: [...nextHand.cards, draw.card],
        isStanding: true,
      };
      return advanceToNextHand(
        { ...state, deck: draw.remaining, playerHands: updatedHands, activeHandIndex: nextIndex },
        settings
      );
    }
    return { ...state, activeHandIndex: nextIndex };
  }
  return resolveDealerAndFinish(state, settings);
}

function resolveDealerAndFinish(
  state: GameState,
  settings: GameSettings
): GameState {
  const allBusted = state.playerHands.every((h) => h.isBusted);

  let deck = [...state.deck];
  let dealerHand = state.dealerHand.map((c) => ({ ...c, faceUp: true }));

  if (!allBusted) {
    while (shouldDealerHit(dealerHand, settings.dealerHitsSoft17)) {
      const draw = drawCard(deck);
      dealerHand = [...dealerHand, draw.card];
      deck = draw.remaining;
    }
  }

  const handResults: HandResult[] = state.playerHands.map((hand) => {
    const outcome = getOutcome(hand, dealerHand);
    const payout = calculatePayout(outcome, hand.bet, settings.blackjackPayout);
    return { outcome, payout };
  });

  const totalPayout = handResults.reduce((sum, r) => sum + r.payout, 0);
  const totalBets = state.playerHands.reduce((sum, h) => sum + h.bet, 0);

  const message = buildResultMessage(handResults);

  return {
    ...state,
    deck,
    dealerHand,
    handResults,
    phase: "result",
    balance: state.balance + totalBets + totalPayout,
    sessionStats: {
      ...state.sessionStats,
      handsPlayed: state.sessionStats.handsPlayed + 1,
    },
    message,
  };
}

function buildResultMessage(results: HandResult[]): string {
  if (results.length === 1) {
    const r = results[0];
    switch (r.outcome) {
      case "blackjack": return `Blackjack! Won $${r.payout}`;
      case "win": return `You win $${r.payout}!`;
      case "lose": return `Dealer wins. Lost $${Math.abs(r.payout)}.`;
      case "push": return "Push — bet returned.";
      case "surrender": return `Surrendered. Lost $${Math.abs(r.payout)}.`;
    }
  }
  const total = results.reduce((s, r) => s + r.payout, 0);
  if (total > 0) return `Net win: +$${total}`;
  if (total < 0) return `Net loss: -$${Math.abs(total)}`;
  return "Break even.";
}

function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "PLACE_BET": {
      const { amount, settings } = action;
      let deck = shuffle(createDeck());

      const p1 = drawCard(deck);
      deck = p1.remaining;
      const d1 = drawCard(deck, true);
      deck = d1.remaining;
      const p2 = drawCard(deck);
      deck = p2.remaining;
      const d2 = drawCard(deck, false);
      deck = d2.remaining;

      const playerCards = [p1.card, p2.card];
      const dealerCards = [d1.card, d2.card];

      const hand: PlayerHand = {
        ...createEmptyHand(amount),
        cards: playerCards,
      };

      const newState: GameState = {
        ...state,
        deck,
        dealerHand: dealerCards,
        playerHands: [hand],
        activeHandIndex: 0,
        phase: "playing",
        currentBet: amount,
        balance: state.balance - amount,
        decisions: [],
        handResults: [],
        message: "",
      };

      const dealerUp = dealerCards.find((c) => c.faceUp)!;
      const dealerVal = cardValue(dealerUp);

      if (dealerVal === 11 || dealerVal === 10) {
        if (isBlackjack(dealerCards)) {
          if (isBlackjack(playerCards)) {
            return {
              ...newState,
              dealerHand: dealerCards.map((c) => ({ ...c, faceUp: true })),
              phase: "result",
              handResults: [{ outcome: "push", payout: 0 }],
              balance: state.balance,
              sessionStats: {
                ...state.sessionStats,
                handsPlayed: state.sessionStats.handsPlayed + 1,
              },
              message: "Both have Blackjack — push!",
            };
          }
          return {
            ...newState,
            dealerHand: dealerCards.map((c) => ({ ...c, faceUp: true })),
            phase: "result",
            handResults: [{ outcome: "lose", payout: -amount }],
            sessionStats: {
              ...state.sessionStats,
              handsPlayed: state.sessionStats.handsPlayed + 1,
            },
            message: `Dealer Blackjack! Lost $${amount}.`,
          };
        }
      }

      if (isBlackjack(playerCards)) {
        const payout = calculatePayout("blackjack", amount, settings.blackjackPayout);
        return {
          ...newState,
          dealerHand: dealerCards.map((c) => ({ ...c, faceUp: true })),
          phase: "result",
          handResults: [{ outcome: "blackjack", payout }],
          balance: state.balance + payout,
          sessionStats: {
            ...state.sessionStats,
            handsPlayed: state.sessionStats.handsPlayed + 1,
          },
          message: `Blackjack! Won $${payout}!`,
        };
      }

      return newState;
    }

    case "HIT": {
      const { settings } = action;
      const decision = recordDecision(state, "hit", settings);
      const draw = drawCard(state.deck);
      const hands = [...state.playerHands];
      const hand = { ...hands[state.activeHandIndex] };
      hand.cards = [...hand.cards, draw.card];

      if (isBusted(hand.cards)) {
        hand.isBusted = true;
        hand.isStanding = true;
      }

      hands[state.activeHandIndex] = hand;

      const newState: GameState = {
        ...state,
        deck: draw.remaining,
        playerHands: hands,
        decisions: [...state.decisions, decision],
        sessionStats: {
          ...state.sessionStats,
          totalDecisions: state.sessionStats.totalDecisions + 1,
          correctDecisions:
            state.sessionStats.correctDecisions + (decision.wasCorrect ? 1 : 0),
        },
      };

      if (hand.isBusted || getHandValue(hand.cards).total === 21) {
        return advanceToNextHand(newState, settings);
      }
      return newState;
    }

    case "STAND": {
      const { settings } = action;
      const decision = recordDecision(state, "stand", settings);
      const hands = [...state.playerHands];
      hands[state.activeHandIndex] = {
        ...hands[state.activeHandIndex],
        isStanding: true,
      };

      const newState: GameState = {
        ...state,
        playerHands: hands,
        decisions: [...state.decisions, decision],
        sessionStats: {
          ...state.sessionStats,
          totalDecisions: state.sessionStats.totalDecisions + 1,
          correctDecisions:
            state.sessionStats.correctDecisions + (decision.wasCorrect ? 1 : 0),
        },
      };

      return advanceToNextHand(newState, settings);
    }

    case "DOUBLE": {
      const { settings } = action;
      const decision = recordDecision(state, "double", settings);
      const draw = drawCard(state.deck);
      const hands = [...state.playerHands];
      const hand = { ...hands[state.activeHandIndex] };
      hand.cards = [...hand.cards, draw.card];
      hand.isDoubled = true;
      hand.bet = hand.bet * 2;
      hand.isStanding = true;

      if (isBusted(hand.cards)) {
        hand.isBusted = true;
      }

      hands[state.activeHandIndex] = hand;

      const newState: GameState = {
        ...state,
        deck: draw.remaining,
        playerHands: hands,
        balance: state.balance - state.currentBet,
        decisions: [...state.decisions, decision],
        sessionStats: {
          ...state.sessionStats,
          totalDecisions: state.sessionStats.totalDecisions + 1,
          correctDecisions:
            state.sessionStats.correctDecisions + (decision.wasCorrect ? 1 : 0),
        },
      };

      return advanceToNextHand(newState, settings);
    }

    case "SPLIT": {
      const { settings } = action;
      const decision = recordDecision(state, "split", settings);
      const hands = [...state.playerHands];
      const hand = hands[state.activeHandIndex];
      const [card1, card2] = hand.cards;
      const isAces = cardValue(card1) === 11;

      const draw1 = drawCard(state.deck);
      const draw2 = drawCard(draw1.remaining);

      const hand1: PlayerHand = {
        ...createEmptyHand(hand.bet),
        cards: [card1, draw1.card],
        isSplit: true,
        splitFromAces: isAces,
        isStanding: isAces,
      };

      const hand2: PlayerHand = {
        ...createEmptyHand(hand.bet),
        cards: [card2, draw2.card],
        isSplit: true,
        splitFromAces: isAces,
        isStanding: isAces,
      };

      hands.splice(state.activeHandIndex, 1, hand1, hand2);

      const newState: GameState = {
        ...state,
        deck: draw2.remaining,
        playerHands: hands,
        balance: state.balance - hand.bet,
        decisions: [...state.decisions, decision],
        sessionStats: {
          ...state.sessionStats,
          totalDecisions: state.sessionStats.totalDecisions + 1,
          correctDecisions:
            state.sessionStats.correctDecisions + (decision.wasCorrect ? 1 : 0),
        },
      };

      if (isAces) {
        return advanceToNextHand(
          { ...newState, activeHandIndex: state.activeHandIndex + 1 },
          settings
        );
      }

      return newState;
    }

    case "SURRENDER": {
      const { settings } = action;
      const decision = recordDecision(state, "surrender", settings);
      const hands = [...state.playerHands];
      hands[state.activeHandIndex] = {
        ...hands[state.activeHandIndex],
        isStanding: true,
      };

      const payout = calculatePayout("surrender", state.currentBet, settings.blackjackPayout);

      return {
        ...state,
        playerHands: hands,
        dealerHand: state.dealerHand.map((c) => ({ ...c, faceUp: true })),
        phase: "result",
        handResults: [{ outcome: "surrender", payout }],
        balance: state.balance + state.currentBet + payout,
        decisions: [...state.decisions, decision],
        sessionStats: {
          ...state.sessionStats,
          handsPlayed: state.sessionStats.handsPlayed + 1,
          totalDecisions: state.sessionStats.totalDecisions + 1,
          correctDecisions:
            state.sessionStats.correctDecisions + (decision.wasCorrect ? 1 : 0),
        },
        message: `Surrendered. Lost $${Math.abs(payout)}.`,
      };
    }

    case "NEW_HAND": {
      return {
        ...state,
        deck: [],
        dealerHand: [],
        playerHands: [],
        activeHandIndex: 0,
        phase: "betting",
        decisions: [],
        handResults: [],
        message: "",
      };
    }

    case "RESET": {
      return createInitialState();
    }

    default:
      return state;
  }
}

export function useGame() {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);

  const placeBet = useCallback(
    (amount: number, settings: GameSettings) =>
      dispatch({ type: "PLACE_BET", amount, settings }),
    []
  );

  const hit = useCallback(
    (settings: GameSettings) => dispatch({ type: "HIT", settings }),
    []
  );

  const stand = useCallback(
    (settings: GameSettings) => dispatch({ type: "STAND", settings }),
    []
  );

  const double = useCallback(
    (settings: GameSettings) => dispatch({ type: "DOUBLE", settings }),
    []
  );

  const split = useCallback(
    (settings: GameSettings) => dispatch({ type: "SPLIT", settings }),
    []
  );

  const surrender = useCallback(
    (settings: GameSettings) => dispatch({ type: "SURRENDER", settings }),
    []
  );

  const newHand = useCallback(() => dispatch({ type: "NEW_HAND" }), []);
  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  return {
    state,
    placeBet,
    hit,
    stand,
    double,
    split,
    surrender,
    newHand,
    reset,
  };
}
