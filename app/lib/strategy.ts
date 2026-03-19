import type {
  Card,
  PlayerHand,
  GameSettings,
  ActionType,
  StrategyAction,
} from "./types";
import { cardValue } from "./deck";
import { getHandValue, isPair } from "./blackjack";

type DealerCard = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
type StrategyRow = Record<DealerCard, StrategyAction>;

const HARD: Record<number, StrategyRow> = {
  17: { 2: "S", 3: "S", 4: "S", 5: "S", 6: "S", 7: "S", 8: "S", 9: "S", 10: "S", 11: "S" },
  16: { 2: "S", 3: "S", 4: "S", 5: "S", 6: "S", 7: "H", 8: "H", 9: "H", 10: "H", 11: "H" },
  15: { 2: "S", 3: "S", 4: "S", 5: "S", 6: "S", 7: "H", 8: "H", 9: "H", 10: "H", 11: "H" },
  14: { 2: "S", 3: "S", 4: "S", 5: "S", 6: "S", 7: "H", 8: "H", 9: "H", 10: "H", 11: "H" },
  13: { 2: "S", 3: "S", 4: "S", 5: "S", 6: "S", 7: "H", 8: "H", 9: "H", 10: "H", 11: "H" },
  12: { 2: "H", 3: "H", 4: "S", 5: "S", 6: "S", 7: "H", 8: "H", 9: "H", 10: "H", 11: "H" },
  11: { 2: "D", 3: "D", 4: "D", 5: "D", 6: "D", 7: "D", 8: "D", 9: "D", 10: "D", 11: "D" },
  10: { 2: "D", 3: "D", 4: "D", 5: "D", 6: "D", 7: "D", 8: "D", 9: "D", 10: "D", 11: "H" },
  9:  { 2: "H", 3: "D", 4: "D", 5: "D", 6: "D", 7: "H", 8: "H", 9: "H", 10: "H", 11: "H" },
  8:  { 2: "H", 3: "H", 4: "H", 5: "H", 6: "H", 7: "H", 8: "H", 9: "H", 10: "H", 11: "H" },
};

const SOFT: Record<number, StrategyRow> = {
  20: { 2: "S",  3: "S",  4: "S",  5: "S",  6: "S",  7: "S", 8: "S", 9: "S",  10: "S",  11: "S" },
  19: { 2: "S",  3: "S",  4: "S",  5: "S",  6: "Ds", 7: "S", 8: "S", 9: "S",  10: "S",  11: "S" },
  18: { 2: "Ds", 3: "Ds", 4: "Ds", 5: "Ds", 6: "Ds", 7: "S", 8: "S", 9: "H",  10: "H",  11: "H" },
  17: { 2: "H",  3: "D",  4: "D",  5: "D",  6: "D",  7: "H", 8: "H", 9: "H",  10: "H",  11: "H" },
  16: { 2: "H",  3: "H",  4: "D",  5: "D",  6: "D",  7: "H", 8: "H", 9: "H",  10: "H",  11: "H" },
  15: { 2: "H",  3: "H",  4: "D",  5: "D",  6: "D",  7: "H", 8: "H", 9: "H",  10: "H",  11: "H" },
  14: { 2: "H",  3: "H",  4: "H",  5: "D",  6: "D",  7: "H", 8: "H", 9: "H",  10: "H",  11: "H" },
  13: { 2: "H",  3: "H",  4: "H",  5: "D",  6: "D",  7: "H", 8: "H", 9: "H",  10: "H",  11: "H" },
};

const PAIRS: Record<number, Record<DealerCard, StrategyAction>> = {
  11: { 2: "Y",   3: "Y",   4: "Y",   5: "Y",   6: "Y",   7: "Y", 8: "Y", 9: "Y",   10: "Y",   11: "Y" },
  10: { 2: "N",   3: "N",   4: "N",   5: "N",   6: "N",   7: "N", 8: "N", 9: "N",   10: "N",   11: "N" },
  9:  { 2: "Y",   3: "Y",   4: "Y",   5: "Y",   6: "Y",   7: "N", 8: "Y", 9: "Y",   10: "N",   11: "N" },
  8:  { 2: "Y",   3: "Y",   4: "Y",   5: "Y",   6: "Y",   7: "Y", 8: "Y", 9: "Y",   10: "Y",   11: "Y" },
  7:  { 2: "Y",   3: "Y",   4: "Y",   5: "Y",   6: "Y",   7: "Y", 8: "N", 9: "N",   10: "N",   11: "N" },
  6:  { 2: "Y/N", 3: "Y",   4: "Y",   5: "Y",   6: "Y",   7: "N", 8: "N", 9: "N",   10: "N",   11: "N" },
  5:  { 2: "N",   3: "N",   4: "N",   5: "N",   6: "N",   7: "N", 8: "N", 9: "N",   10: "N",   11: "N" },
  4:  { 2: "N",   3: "N",   4: "N",   5: "N",   6: "Y/N", 7: "Y/N", 8: "N", 9: "N", 10: "N",   11: "N" },
  3:  { 2: "Y/N", 3: "Y/N", 4: "Y",   5: "Y",   6: "Y",   7: "Y", 8: "N", 9: "N",   10: "N",   11: "N" },
  2:  { 2: "Y/N", 3: "Y/N", 4: "Y",   5: "Y",   6: "Y",   7: "Y", 8: "N", 9: "N",   10: "N",   11: "N" },
};

const SURRENDER_MAP: Record<number, DealerCard[]> = {
  16: [9, 10, 11],
  15: [10],
  14: [10],
};

function getDealerCardValue(card: Card): DealerCard {
  return cardValue(card) as DealerCard;
}

export function getCorrectAction(
  hand: PlayerHand,
  dealerUpcard: Card,
  settings: GameSettings,
  numHands: number,
  isFirstAction: boolean
): { action: ActionType; chartAction: StrategyAction } {
  const dealer = getDealerCardValue(dealerUpcard);
  const handVal = getHandValue(hand.cards);
  const canDbl = hand.cards.length === 2 && (!hand.isSplit || settings.doubleAfterSplit) && !hand.splitFromAces;
  const canSpl = isPair(hand.cards) && hand.cards.length === 2 && numHands < 4;

  if (canSpl) {
    const pairVal = cardValue(hand.cards[0]) as number;
    const pairRow = PAIRS[pairVal];
    if (pairRow) {
      const pairAction = pairRow[dealer];
      if (pairAction === "Y") {
        return { action: "split", chartAction: "Y" };
      }
      if (pairAction === "Y/N") {
        if (settings.doubleAfterSplit) {
          return { action: "split", chartAction: "Y/N" };
        }
      }
    }
  }

  if (isFirstAction && settings.surrenderAllowed && !hand.isSplit) {
    const surDealers = SURRENDER_MAP[handVal.total];
    if (surDealers && surDealers.includes(dealer)) {
      return { action: "surrender", chartAction: "SUR" };
    }
  }

  if (handVal.isSoft && SOFT[handVal.total]) {
    const softAction = SOFT[handVal.total][dealer];
    if (softAction === "D") {
      return canDbl
        ? { action: "double", chartAction: "D" }
        : { action: "hit", chartAction: "D" };
    }
    if (softAction === "Ds") {
      return canDbl
        ? { action: "double", chartAction: "Ds" }
        : { action: "stand", chartAction: "Ds" };
    }
    return {
      action: softAction === "S" ? "stand" : "hit",
      chartAction: softAction,
    };
  }

  if (handVal.total >= 17) {
    return { action: "stand", chartAction: "S" };
  }
  if (handVal.total <= 7) {
    return { action: "hit", chartAction: "H" };
  }

  const hardAction = HARD[handVal.total]?.[dealer] ?? "H";
  if (hardAction === "D") {
    return canDbl
      ? { action: "double", chartAction: "D" }
      : { action: "hit", chartAction: "D" };
  }
  return {
    action: hardAction === "S" ? "stand" : "hit",
    chartAction: hardAction,
  };
}

export function getActionLabel(action: StrategyAction): string {
  switch (action) {
    case "H": return "Hit";
    case "S": return "Stand";
    case "D": return "Double (hit if not allowed)";
    case "Ds": return "Double (stand if not allowed)";
    case "Y": return "Split";
    case "Y/N": return "Split (if DAS allowed)";
    case "N": return "Don't split";
    case "SUR": return "Surrender";
  }
}

export { HARD, SOFT, PAIRS, SURRENDER_MAP };
