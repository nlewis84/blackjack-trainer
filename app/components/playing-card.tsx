import type { Card } from "~/lib/types";

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
};

function isRed(suit: string) {
  return suit === "hearts" || suit === "diamonds";
}

export function PlayingCard({
  card,
  index = 0,
  className = "",
}: {
  card: Card;
  index?: number;
  className?: string;
}) {
  if (!card.faceUp) {
    return (
      <div
        className={`relative w-[72px] h-[100px] rounded-lg shadow-lg shrink-0 ${className}`}
        style={{
          animationDelay: `${index * 100}ms`,
          background:
            "repeating-linear-gradient(45deg, #1e3a5f, #1e3a5f 4px, #1a3356 4px, #1a3356 8px)",
          border: "3px solid #f0e6d3",
          boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
        }}
      >
        <div className="absolute inset-1 rounded border border-white/20" />
      </div>
    );
  }

  const suit = SUIT_SYMBOLS[card.suit];
  const color = isRed(card.suit) ? "text-red-600" : "text-gray-900";

  return (
    <div
      className={`relative w-[72px] h-[100px] bg-white rounded-lg shadow-lg shrink-0 select-none ${className}`}
      style={{
        animationDelay: `${index * 100}ms`,
        border: "1px solid #d4d4d4",
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
      }}
    >
      <div className={`absolute top-1.5 left-1.5 leading-none text-center ${color}`}>
        <div className="text-[13px] font-bold">{card.rank}</div>
        <div className="text-[10px] mt-0.5">{suit}</div>
      </div>
      <div className={`absolute inset-0 flex items-center justify-center ${color}`}>
        <span className="text-[26px]">{suit}</span>
      </div>
      <div className={`absolute bottom-1.5 right-1.5 leading-none rotate-180 text-center ${color}`}>
        <div className="text-[13px] font-bold">{card.rank}</div>
        <div className="text-[10px] mt-0.5">{suit}</div>
      </div>
    </div>
  );
}
