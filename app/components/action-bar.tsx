import { Button } from "~/components/ui/button";

export function ActionBar({
  canHit,
  canStand,
  canDouble,
  canSplit,
  canSurrender,
  surrenderEnabled,
  selectedIndex,
  onHit,
  onStand,
  onDouble,
  onSplit,
  onSurrender,
}: {
  canHit: boolean;
  canStand: boolean;
  canDouble: boolean;
  canSplit: boolean;
  canSurrender: boolean;
  surrenderEnabled: boolean;
  selectedIndex: number;
  onHit: () => void;
  onStand: () => void;
  onDouble: () => void;
  onSplit: () => void;
  onSurrender: () => void;
}) {
  const actions = [
    { label: "Hit", enabled: canHit, onClick: onHit, base: "bg-emerald-600 hover:bg-emerald-500" },
    { label: "Stand", enabled: canStand, onClick: onStand, base: "bg-amber-600 hover:bg-amber-500" },
    { label: "Double", enabled: canDouble, onClick: onDouble, base: "bg-blue-600 hover:bg-blue-500" },
    { label: "Split", enabled: canSplit, onClick: onSplit, base: "bg-purple-600 hover:bg-purple-500" },
  ];

  if (surrenderEnabled) {
    actions.push({
      label: "Surrender",
      enabled: canSurrender,
      onClick: onSurrender,
      base: "border border-red-400/60 text-red-300 hover:bg-red-500/20",
    });
  }

  const enabledIndices = actions.reduce<number[]>((acc, a, i) => {
    if (a.enabled) acc.push(i);
    return acc;
  }, []);

  const highlightedAction = enabledIndices[selectedIndex] ?? enabledIndices[0];

  return (
    <div className="flex gap-2 flex-wrap justify-center">
      {actions.map((a, i) => {
        const isSelected = i === highlightedAction;
        return (
          <Button
            key={a.label}
            onClick={a.onClick}
            disabled={!a.enabled}
            className={`${a.base} text-white font-bold px-6 py-3 text-base shadow-lg disabled:opacity-40 duration-200 ease-out ${
              isSelected
                ? "selected-glow ring-2 ring-white/80 ring-offset-2 ring-offset-transparent scale-105"
                : "hover:scale-[1.03] hover:shadow-xl hover:brightness-110"
            }`}
          >
            {a.label}
          </Button>
        );
      })}
      <div className="w-full text-center mt-1">
        <span className="text-white/30 text-[10px]">
          ← → select &nbsp; Enter confirm
        </span>
      </div>
    </div>
  );
}
