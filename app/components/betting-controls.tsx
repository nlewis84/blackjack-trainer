import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { ChipStacks, CHIP_STYLES } from "./chip-stacks";

const CHIP_VALUES = [1, 5, 10, 25, 50, 100] as const;

export function BettingControls({
  balance,
  lastBet,
  onPlaceBet,
  onBetChange,
}: {
  balance: number;
  lastBet: number;
  onPlaceBet: (amount: number) => void;
  onBetChange?: (amount: number) => void;
}) {
  const initialBet = Math.min(lastBet, balance);
  const [bet, setBetRaw] = useState(initialBet);
  const [selectedChip, setSelectedChip] = useState(0);

  useEffect(() => {
    onBetChange?.(initialBet);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setBet(updater: number | ((prev: number) => number)) {
    setBetRaw((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      onBetChange?.(next);
      return next;
    });
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          setSelectedChip((i) => Math.max(0, i - 1));
          break;
        case "ArrowRight":
          e.preventDefault();
          setSelectedChip((i) => Math.min(CHIP_VALUES.length - 1, i + 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setBet((prev) => Math.min(balance, prev + CHIP_VALUES[selectedChip]));
          break;
        case "ArrowDown":
          e.preventDefault();
          setBet((prev) => Math.max(0, prev - CHIP_VALUES[selectedChip]));
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          if (bet >= 1 && bet <= balance) onPlaceBet(bet);
          break;
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-white/80 text-sm font-medium uppercase tracking-wider">
        Place Your Bet
      </div>

      <div className="flex flex-col items-center gap-1">
        <ChipStacks amount={bet} size="md" maxPerStack={6} mixed />
        <span className="text-white font-bold text-lg">${bet}</span>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {CHIP_VALUES.map((val, i) => {
          const style = CHIP_STYLES[val];
          const isSelected = i === selectedChip;
          return (
            <button
              key={val}
              onClick={() => {
                setSelectedChip(i);
                setBet((prev) => Math.min(balance, prev + val));
              }}
              className={`w-10 h-10 rounded-full text-[10px] font-bold border-2 duration-200 ease-out ${style.bg} ${style.border} ${style.text} ${
                isSelected
                  ? "scale-110 selected-glow ring-2 ring-white/80 ring-offset-2 ring-offset-transparent"
                  : "opacity-70 hover:opacity-100 hover:scale-105 hover:shadow-lg shadow-md"
              }`}
            >
              ${val}
            </button>
          );
        })}
      </div>

      <div className="text-white/30 text-[10px] text-center">
        ← → chip &nbsp; ↑ add &nbsp; ↓ remove
      </div>

      <Button
        onClick={() => onPlaceBet(bet)}
        disabled={bet > balance || bet < 1}
        className="btn-premium bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold px-10 py-3 text-lg shadow-xl rounded-full"
      >
        Deal
        <kbd className="ml-1.5 text-[10px] opacity-50 bg-white/10 px-1 py-0.5 rounded font-mono hidden sm:inline">
          ↵
        </kbd>
      </Button>
    </div>
  );
}
