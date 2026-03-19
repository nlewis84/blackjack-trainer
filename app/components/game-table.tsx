import { useState, useEffect, useMemo } from "react";
import { getHandValue } from "~/lib/blackjack";
import { hiLoValue } from "~/lib/deck";
import { useGame } from "~/hooks/use-game";
import { useSettings } from "~/hooks/use-settings";
import { HandDisplay } from "./hand-display";
import { ActionBar } from "./action-bar";
import { BettingControls } from "./betting-controls";
import { StrategyFeedback } from "./strategy-feedback";
import { SettingsDialog } from "./settings-dialog";
import { canDouble, canSplit } from "~/lib/blackjack";
import { GearSix } from "@phosphor-icons/react";
import { ChipStacks } from "./chip-stacks";
import type { Card } from "~/lib/types";

function computeRunningCount(dealerHand: Card[], playerHands: { cards: Card[] }[]): number {
  let rc = 0;
  for (const card of dealerHand) {
    if (card.faceUp) rc += hiLoValue(card);
  }
  for (const hand of playerHands) {
    for (const card of hand.cards) {
      if (card.faceUp) rc += hiLoValue(card);
    }
  }
  return rc;
}

export function GameTable() {
  const [settings, updateSettings] = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState(0);
  const [pendingBet, setPendingBet] = useState(0);

  const game = useGame();
  const { state } = game;

  function handlePlaceBet(amount: number) {
    setPendingBet(0);
    game.placeBet(amount, settings);
  }

  function handleHit() {
    game.hit(settings);
  }
  function handleStand() {
    game.stand(settings);
  }
  function handleDouble() {
    game.double(settings);
  }
  function handleSplit() {
    game.split(settings);
  }
  function handleSurrender() {
    game.surrender(settings);
  }

  function handleNewHand() {
    setFeedbackOpen(false);
    game.newHand();
  }

  const showFeedback = state.phase === "result" && !feedbackOpen;

  const activeHand =
    state.phase === "playing"
      ? state.playerHands[state.activeHandIndex]
      : null;

  const canDbl = activeHand
    ? canDouble(activeHand, settings) && state.balance >= activeHand.bet
    : false;
  const canSpl = activeHand
    ? canSplit(activeHand, state.playerHands.length) && state.balance >= activeHand.bet
    : false;
  const canSur =
    activeHand &&
    activeHand.cards.length === 2 &&
    !activeHand.isSplit &&
    state.playerHands.length === 1;
  const canHit = activeHand
    ? !activeHand.isStanding && !activeHand.isBusted
    : false;

  const availableHandlers = useMemo(() => {
    const handlers: (() => void)[] = [];
    if (canHit) handlers.push(handleHit);
    if (canHit) handlers.push(handleStand);
    if (canDbl) handlers.push(handleDouble);
    if (canSpl) handlers.push(handleSplit);
    if (canSur && settings.surrenderAllowed) handlers.push(handleSurrender);
    return handlers;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canHit, canDbl, canSpl, canSur, settings.surrenderAllowed]);

  useEffect(() => {
    setSelectedAction((prev) => Math.min(prev, Math.max(0, availableHandlers.length - 1)));
  }, [availableHandlers.length]);

  useEffect(() => {
    setSelectedAction(0);
  }, [state.activeHandIndex, state.phase]);

  const runningCount = useMemo(
    () => computeRunningCount(state.dealerHand, state.playerHands),
    [state.dealerHand, state.playerHands]
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === ",") {
        e.preventDefault();
        setSettingsOpen((o) => !o);
        return;
      }

      if (settingsOpen) return;

      const isNavKey = ["Enter", " ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key);

      if (feedbackOpen) {
        if (isNavKey) {
          e.preventDefault();
          e.stopPropagation();
          handleNewHand();
        }
        return;
      }

      if (state.phase === "playing") {
        switch (e.key) {
          case "ArrowLeft":
            e.preventDefault();
            setSelectedAction((i) => Math.max(0, i - 1));
            break;
          case "ArrowRight":
            e.preventDefault();
            setSelectedAction((i) => Math.min(availableHandlers.length - 1, i + 1));
            break;
          case "Enter":
          case " ":
          case "ArrowDown":
            e.preventDefault();
            availableHandlers[selectedAction]?.();
            break;
        }
      } else if (state.phase === "result") {
        if (isNavKey) {
          e.preventDefault();
          handleNewHand();
        }
      }
    }
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  });

  const pct =
    state.sessionStats.totalDecisions > 0
      ? Math.round(
          (state.sessionStats.correctDecisions /
            state.sessionStats.totalDecisions) *
            100
        )
      : 0;

  const hasCards = state.dealerHand.length > 0;

  return (
    <div className="table-felt h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-black/40 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-4">
          <h1 className="text-white font-bold text-lg tracking-wide">
            ♠ Blackjack Trainer
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {state.sessionStats.totalDecisions > 0 && (
            <div className="text-white/70 text-sm hidden sm:block">
              Accuracy:{" "}
              <span
                className={`font-bold ${
                  pct >= 80
                    ? "text-green-400"
                    : pct >= 60
                      ? "text-yellow-400"
                      : "text-red-400"
                }`}
              >
                {pct}%
              </span>
              <span className="text-white/40 ml-1">
                ({state.sessionStats.correctDecisions}/
                {state.sessionStats.totalDecisions})
              </span>
            </div>
          )}
          <div className="text-white font-semibold">
            <span className="text-yellow-400">${state.balance}</span>
          </div>
          <button
            onClick={() => setSettingsOpen(true)}
            className="text-white/70 hover:text-white transition-all duration-200 hover:scale-110 hover:rotate-45 p-1"
            aria-label="Settings"
          >
            <GearSix size={20} weight="bold" />
          </button>
        </div>
      </header>

      {/* Table area */}
      <main className="flex-1 min-h-0 flex flex-col items-center justify-between py-4 px-4 gap-2 max-w-2xl mx-auto w-full overflow-y-auto">
        {/* Dealer section */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-3">
            <span className="text-white/40 text-xs font-semibold uppercase tracking-widest">
              Dealer
            </span>
            {hasCards && (
              <span
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                  runningCount > 0
                    ? "bg-green-600/30 text-green-400"
                    : runningCount < 0
                      ? "bg-red-600/30 text-red-400"
                      : "bg-white/10 text-white/50"
                }`}
              >
                RC: {runningCount > 0 ? "+" : ""}{runningCount}
              </span>
            )}
          </div>
          {hasCards ? (
            <HandDisplay cards={state.dealerHand} />
          ) : (
            <div className="h-[130px]" />
          )}
          {state.phase === "result" && hasCards && (
            <div className="text-white/60 text-xs">
              {getHandValue(state.dealerHand).total > 21
                ? "BUST"
                : getHandValue(state.dealerHand).total}
            </div>
          )}
        </div>

        {/* Result message */}
        {state.phase === "result" && state.message && (
          <div className="text-center">
            <div className="inline-block px-6 py-2 rounded-full bg-black/60 backdrop-blur">
              <span className="text-white font-bold text-lg">
                {state.message}
              </span>
            </div>
          </div>
        )}

        {/* Player hands */}
        <div className="flex flex-col items-center gap-4">
          {state.playerHands.length > 0 && (
            <div className="flex gap-6 flex-wrap justify-center">
              {state.playerHands.map((hand, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <HandDisplay
                    cards={hand.cards}
                    isActive={
                      state.phase === "playing" &&
                      i === state.activeHandIndex
                    }
                    label={
                      state.playerHands.length > 1
                        ? `Hand ${i + 1}`
                        : undefined
                    }
                  />
                  {hand.isBusted && (
                    <span className="text-xs text-red-400 font-bold">
                      BUST
                    </span>
                  )}
                  {state.phase === "result" && state.handResults[i] && (
                    <span
                      className={`text-xs font-bold ${
                        state.handResults[i].outcome === "win" ||
                        state.handResults[i].outcome === "blackjack"
                          ? "text-green-400"
                          : state.handResults[i].outcome === "push"
                            ? "text-yellow-300"
                            : "text-red-400"
                      }`}
                    >
                      {state.handResults[i].outcome === "blackjack"
                        ? "BLACKJACK!"
                        : state.handResults[i].outcome.toUpperCase()}
                      {state.handResults[i].payout !== 0 && (
                        <span className="ml-1">
                          ({state.handResults[i].payout > 0 ? "+" : ""}$
                          {state.handResults[i].payout})
                        </span>
                      )}
                    </span>
                  )}
                  {hand.isDoubled ? (
                    <div className="flex items-end gap-1 mt-0.5">
                      <ChipStacks amount={hand.bet / 2} size="xs" maxPerStack={4} mixed />
                      <ChipStacks amount={hand.bet / 2} size="xs" maxPerStack={4} mixed />
                    </div>
                  ) : (
                    <div className="mt-0.5">
                      <ChipStacks amount={hand.bet} size="xs" maxPerStack={4} mixed />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="w-full">
          {state.phase === "betting" && state.balance <= 0 && (
            <div className="flex flex-col items-center gap-5">
              <div className="text-white/60 text-xs font-semibold uppercase tracking-widest">
                Game Over
              </div>
              <div className="text-white/40 text-sm text-center max-w-xs">
                You&apos;re out of chips.
                {state.sessionStats.totalDecisions > 0 && (
                  <span className="block mt-2">
                    Session: {state.sessionStats.correctDecisions}/{state.sessionStats.totalDecisions} correct
                    ({Math.round((state.sessionStats.correctDecisions / state.sessionStats.totalDecisions) * 100)}%)
                    over {state.sessionStats.handsPlayed} hands.
                  </span>
                )}
              </div>
              <button
                onClick={() => game.reset()}
                className="btn-premium bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold px-10 py-3 text-lg shadow-xl rounded-full"
              >
                Start Fresh — $1,000
              </button>
            </div>
          )}

          {state.phase === "betting" && state.balance > 0 && (
            <BettingControls
              balance={state.balance}
              lastBet={state.currentBet}
              onPlaceBet={handlePlaceBet}
              onBetChange={setPendingBet}
            />
          )}

          {state.phase === "playing" && (
            <ActionBar
              canHit={canHit}
              canStand={canHit}
              canDouble={canDbl}
              canSplit={canSpl}
              canSurrender={!!canSur}
              surrenderEnabled={settings.surrenderAllowed}
              selectedIndex={selectedAction}
              onHit={handleHit}
              onStand={handleStand}
              onDouble={handleDouble}
              onSplit={handleSplit}
              onSurrender={handleSurrender}
            />
          )}

          {state.phase === "result" && (
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={() => setFeedbackOpen(true)}
                className="text-yellow-300 hover:text-yellow-200 text-sm underline underline-offset-2 transition-all duration-200 hover:scale-105"
              >
                Review Strategy
              </button>
              <button
                onClick={handleNewHand}
                className="btn-premium bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold px-10 py-3 text-lg shadow-xl rounded-full"
              >
                New Hand
              </button>
              <span className="text-white/30 text-[10px]">
                press any key
              </span>
            </div>
          )}
        </div>
      </main>

      {/* Bank */}
      {(() => {
        const displayBalance = state.phase === "betting" ? state.balance - pendingBet : state.balance;
        return (
          <div className="flex items-center justify-center gap-3 px-4 py-2">
            <ChipStacks amount={displayBalance} size="sm" maxPerStack={8} />
            <span className="text-yellow-400 text-xs font-bold">${displayBalance}</span>
          </div>
        );
      })()}

      {/* Rules badge */}
      <footer className="px-4 py-2 bg-black/30 border-t border-white/10">
        <div className="flex items-center justify-center gap-3 text-white/40 text-xs flex-wrap">
          <span>{settings.dealerHitsSoft17 ? "H17" : "S17"}</span>
          <span>•</span>
          <span>{settings.doubleAfterSplit ? "DAS" : "No DAS"}</span>
          <span>•</span>
          <span>{settings.surrenderAllowed ? "LS" : "No Surrender"}</span>
          <span>•</span>
          <span>BJ pays {settings.blackjackPayout}</span>
        </div>
      </footer>

      {/* Dialogs */}
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onSettingsChange={updateSettings}
      />

      <StrategyFeedback
        decisions={state.decisions}
        handResults={state.handResults}
        message={state.message}
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        onNewHand={handleNewHand}
        sessionCorrect={state.sessionStats.correctDecisions}
        sessionTotal={state.sessionStats.totalDecisions}
      />

      {showFeedback && state.decisions.length > 0 && (
        <StrategyAutoOpen onOpen={() => setFeedbackOpen(true)} />
      )}
    </div>
  );
}

function StrategyAutoOpen({ onOpen }: { onOpen: () => void }) {
  useEffect(() => {
    const id = setTimeout(onOpen, 800);
    return () => clearTimeout(id);
  }, [onOpen]);
  return null;
}
