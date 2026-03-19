import type { Decision, HandResult } from "~/lib/types";
import { getActionLabel } from "~/lib/strategy";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Badge } from "~/components/ui/badge";
import { cardValue } from "~/lib/deck";
import { getHandValue } from "~/lib/blackjack";

function formatCards(cards: { rank: string; suit: string }[]): string {
  const suitMap: Record<string, string> = {
    hearts: "♥",
    diamonds: "♦",
    clubs: "♣",
    spades: "♠",
  };
  return cards.map((c) => `${c.rank}${suitMap[c.suit]}`).join(" ");
}

function actionName(action: string): string {
  const names: Record<string, string> = {
    hit: "Hit",
    stand: "Stand",
    double: "Double",
    split: "Split",
    surrender: "Surrender",
  };
  return names[action] ?? action;
}

function outcomeColor(outcome: string) {
  if (outcome === "win" || outcome === "blackjack") return "text-green-400";
  if (outcome === "push") return "text-yellow-300";
  return "text-red-400";
}

function OutcomeSummary({
  handResults,
  message,
}: {
  handResults: HandResult[];
  message: string;
}) {
  if (handResults.length === 0) return null;

  return (
    <div className="p-3 rounded-lg bg-black/30 border border-white/10 text-center space-y-1">
      <div className="text-white font-bold text-base">{message}</div>
      {handResults.length > 1 && (
        <div className="flex flex-wrap justify-center gap-3 text-xs">
          {handResults.map((r, i) => (
            <span key={i} className={outcomeColor(r.outcome)}>
              Hand {i + 1}: {r.outcome.toUpperCase()}{" "}
              {r.payout !== 0 &&
                `(${r.payout > 0 ? "+" : ""}$${r.payout})`}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function StrategyFeedback({
  decisions,
  handResults,
  message,
  open,
  onClose,
  onNewHand,
  sessionCorrect,
  sessionTotal,
}: {
  decisions: Decision[];
  handResults: HandResult[];
  message: string;
  open: boolean;
  onClose: () => void;
  onNewHand: () => void;
  sessionCorrect: number;
  sessionTotal: number;
}) {
  if (decisions.length === 0) {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Hand Complete</DialogTitle>
          </DialogHeader>
          <OutcomeSummary handResults={handResults} message={message} />
          <div className="flex justify-center mt-2">
            <button
              onClick={onNewHand}
              className="bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold px-10 py-3 text-lg shadow-xl rounded-full transition-all"
            >
              Next Hand
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const allCorrect = decisions.every((d) => d.wasCorrect);
  const pct = sessionTotal > 0 ? Math.round((sessionCorrect / sessionTotal) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            Strategy Review
            {allCorrect ? (
              <Badge className="bg-green-600 text-white">Perfect!</Badge>
            ) : (
              <Badge className="bg-amber-600 text-white">Mistakes Made</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <OutcomeSummary handResults={handResults} message={message} />

        <div className="space-y-3">
          {decisions.map((d, i) => {
            const hv = getHandValue(d.playerCards);
            return (
              <div
                key={i}
                className={`p-3 rounded-lg border ${
                  d.wasCorrect
                    ? "border-green-600/40 bg-green-950/30"
                    : "border-red-500/40 bg-red-950/30"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm space-y-1">
                    <div className="text-white/80">
                      <span className="font-mono">{formatCards(d.playerCards)}</span>
                      <span className="text-white/50 mx-1">
                        ({hv.isSoft ? "soft " : ""}
                        {hv.total})
                      </span>
                      <span className="text-white/50">vs</span>
                      <span className="font-mono ml-1">
                        {d.dealerUpcard.rank}
                      </span>
                    </div>
                    <div>
                      You chose:{" "}
                      <span
                        className={`font-semibold ${
                          d.wasCorrect ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {actionName(d.action)}
                      </span>
                    </div>
                    {!d.wasCorrect && (
                      <div className="text-yellow-300 text-xs">
                        Correct play: {getActionLabel(d.chartAction)}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0">
                    {d.wasCorrect ? (
                      <span className="text-green-400 text-lg">✓</span>
                    ) : (
                      <span className="text-red-400 text-lg">✗</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-gray-700 space-y-3">
          <div className="text-sm text-white/60 text-center">
            Session accuracy:{" "}
            <span className="text-white font-bold">{pct}%</span>
            <span className="text-white/40 ml-1">
              ({sessionCorrect}/{sessionTotal})
            </span>
          </div>
          <div className="flex justify-center">
            <button
              onClick={onNewHand}
              className="bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold px-10 py-3 text-lg shadow-xl rounded-full transition-all"
            >
              Next Hand
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
