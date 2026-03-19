import type { Card } from "~/lib/types";
import { getHandValue } from "~/lib/blackjack";
import { PlayingCard } from "./playing-card";

export function HandDisplay({
  cards,
  isActive = false,
  label,
  hideTotal = false,
}: {
  cards: Card[];
  isActive?: boolean;
  label?: string;
  hideTotal?: boolean;
}) {
  const visibleCards = cards.filter((c) => c.faceUp);
  const handValue = visibleCards.length > 0 ? getHandValue(visibleCards) : null;
  const hasFaceDown = cards.some((c) => !c.faceUp);

  return (
    <div className="flex flex-col items-center gap-2">
      {label && (
        <span
          className={`text-xs font-semibold uppercase tracking-wider ${
            isActive ? "text-yellow-300" : "text-white/60"
          }`}
        >
          {label}
        </span>
      )}
      <div className="flex items-center">
        {cards.map((card, i) => (
          <div
            key={i}
            className="animate-deal-in"
            style={{
              marginLeft: i > 0 ? "-20px" : "0",
              zIndex: i,
              animationDelay: `${i * 120}ms`,
            }}
          >
            <PlayingCard card={card} index={i} />
          </div>
        ))}
      </div>
      {!hideTotal && handValue && (
        <div
          className={`px-3 py-1 rounded-full text-sm font-bold ${
            isActive
              ? "bg-yellow-400/90 text-gray-900"
              : "bg-black/50 text-white"
          }`}
        >
          {handValue.total}
          {handValue.isSoft && handValue.total <= 21 && (
            <span className="text-xs ml-1 opacity-70">soft</span>
          )}
          {hasFaceDown && !hideTotal && (
            <span className="text-xs ml-1 opacity-70">+ ?</span>
          )}
        </div>
      )}
    </div>
  );
}
