export type Suit = "hearts" | "diamonds" | "clubs" | "spades";
export type Rank =
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K"
  | "A";

export interface Card {
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
}

export interface PlayerHand {
  cards: Card[];
  bet: number;
  isDoubled: boolean;
  isSplit: boolean;
  isStanding: boolean;
  isBusted: boolean;
  splitFromAces: boolean;
}

export type ActionType = "hit" | "stand" | "double" | "split" | "surrender";
export type StrategyAction =
  | "H"
  | "S"
  | "D"
  | "Ds"
  | "Y"
  | "Y/N"
  | "N"
  | "SUR";

export interface Decision {
  playerCards: Card[];
  dealerUpcard: Card;
  action: ActionType;
  correctAction: ActionType;
  chartAction: StrategyAction;
  wasCorrect: boolean;
  handIndex: number;
}

export type GamePhase = "betting" | "playing" | "dealer-turn" | "result";

export interface GameSettings {
  dealerHitsSoft17: boolean;
  doubleAfterSplit: boolean;
  surrenderAllowed: boolean;
  blackjackPayout: "3:2" | "6:5";
}

export const DEFAULT_SETTINGS: GameSettings = {
  dealerHitsSoft17: true,
  doubleAfterSplit: true,
  surrenderAllowed: true,
  blackjackPayout: "3:2",
};

export type Outcome = "win" | "lose" | "push" | "blackjack" | "surrender";

export interface HandResult {
  outcome: Outcome;
  payout: number;
}

export interface SessionStats {
  handsPlayed: number;
  correctDecisions: number;
  totalDecisions: number;
}

export interface GameState {
  deck: Card[];
  dealerHand: Card[];
  playerHands: PlayerHand[];
  activeHandIndex: number;
  phase: GamePhase;
  balance: number;
  currentBet: number;
  decisions: Decision[];
  handResults: HandResult[];
  sessionStats: SessionStats;
  message: string;
}
