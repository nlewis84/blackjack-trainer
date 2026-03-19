import type { Card, PlayerHand, GameSettings, Outcome } from "./types";
import { cardValue } from "./deck";

export interface HandValue {
  total: number;
  isSoft: boolean;
}

export function getHandValue(cards: Card[]): HandValue {
  let total = 0;
  let aces = 0;

  for (const card of cards) {
    const val = cardValue(card);
    if (val === 11) aces++;
    total += val;
  }

  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }

  return { total, isSoft: aces > 0 };
}

export function isBusted(cards: Card[]): boolean {
  return getHandValue(cards).total > 21;
}

export function isBlackjack(cards: Card[]): boolean {
  return cards.length === 2 && getHandValue(cards).total === 21;
}

export function isPair(cards: Card[]): boolean {
  return cards.length === 2 && cardValue(cards[0]) === cardValue(cards[1]);
}

export function canSplit(hand: PlayerHand, numHands: number): boolean {
  return isPair(hand.cards) && hand.cards.length === 2 && numHands < 4;
}

export function canDouble(hand: PlayerHand, settings: GameSettings): boolean {
  if (hand.cards.length !== 2) return false;
  if (hand.isSplit && !settings.doubleAfterSplit) return false;
  if (hand.splitFromAces) return false;
  return true;
}

export function shouldDealerHit(
  cards: Card[],
  hitSoft17: boolean
): boolean {
  const { total, isSoft } = getHandValue(cards);
  if (total < 17) return true;
  if (total === 17 && isSoft && hitSoft17) return true;
  return false;
}

export function getOutcome(
  playerHand: PlayerHand,
  dealerCards: Card[]
): Outcome {
  if (playerHand.isBusted) return "lose";

  const playerValue = getHandValue(playerHand.cards).total;
  const dealerValue = getHandValue(dealerCards).total;
  const dealerBust = dealerValue > 21;

  const playerBJ = isBlackjack(playerHand.cards) && !playerHand.isSplit;
  const dealerBJ = isBlackjack(dealerCards);

  if (playerBJ && dealerBJ) return "push";
  if (playerBJ) return "blackjack";
  if (dealerBJ) return "lose";
  if (dealerBust) return "win";
  if (playerValue > dealerValue) return "win";
  if (playerValue < dealerValue) return "lose";
  return "push";
}

export function calculatePayout(
  outcome: Outcome,
  bet: number,
  blackjackPayout: "3:2" | "6:5"
): number {
  switch (outcome) {
    case "blackjack":
      return blackjackPayout === "3:2" ? bet * 1.5 : bet * 1.2;
    case "win":
      return bet;
    case "push":
      return 0;
    case "lose":
      return -bet;
    case "surrender":
      return -bet / 2;
  }
}
