export const CHIP_STYLES: Record<number, { bg: string; border: string; text: string; shadow: string }> = {
  1:   { bg: "bg-white",      border: "border-gray-300",   text: "text-black",    shadow: "shadow-gray-400/40" },
  5:   { bg: "bg-red-600",    border: "border-red-400",    text: "text-white",   shadow: "shadow-red-900/40" },
  10:  { bg: "bg-blue-600",   border: "border-blue-400",   text: "text-white",   shadow: "shadow-blue-900/40" },
  25:  { bg: "bg-green-600",  border: "border-green-400",  text: "text-white",   shadow: "shadow-green-900/40" },
  50:  { bg: "bg-orange-500", border: "border-orange-300", text: "text-white",   shadow: "shadow-orange-900/40" },
  100: { bg: "bg-gray-900",   border: "border-gray-500",   text: "text-gray-100", shadow: "shadow-black/50" },
};

const DENOMS = [100, 50, 25, 10, 5, 1] as const;

export function decomposeIntoChips(amount: number): Map<number, number> {
  const groups = new Map<number, number>();
  let remaining = amount;
  for (const val of DENOMS) {
    const count = Math.floor(remaining / val);
    if (count > 0) {
      groups.set(val, count);
      remaining -= count * val;
    }
  }
  return groups;
}

/** Bank-style racks: keep up to 2 of each denomination when possible, then greedy remainder. */
export function decomposeIntoChipsForBank(amount: number): Map<number, number> {
  const groups = new Map<number, number>();
  let remaining = Math.max(0, amount);

  for (const val of DENOMS) {
    const canTake = Math.floor(remaining / val);
    const take = Math.min(2, canTake);
    if (take > 0) {
      groups.set(val, take);
      remaining -= take * val;
    }
  }

  for (const val of DENOMS) {
    const add = Math.floor(remaining / val);
    if (add > 0) {
      groups.set(val, (groups.get(val) ?? 0) + add);
      remaining -= add * val;
    }
  }

  return groups;
}

function decomposeToFlatList(amount: number): number[] {
  const chips: number[] = [];
  let remaining = amount;
  for (const val of DENOMS) {
    const count = Math.floor(remaining / val);
    for (let i = 0; i < count; i++) chips.push(val);
    remaining -= count * val;
  }
  return chips;
}

const SIZES = {
  xs: { chip: 24, offset: 3, fontSize: 6, inner: 16, gap: 3 },
  sm: { chip: 32, offset: 4, fontSize: 7, inner: 24, gap: 4 },
  md: { chip: 44, offset: 5, fontSize: 9, inner: 34, gap: 5 },
} as const;

function SingleChip({
  value,
  size,
}: {
  value: number;
  size: "xs" | "sm" | "md";
}) {
  const s = SIZES[size];
  const style = CHIP_STYLES[value];
  return (
    <div
      className={`rounded-full ${style.bg} ${style.border} ${style.text} border-2 flex items-center justify-center font-bold select-none ${style.shadow} shadow-md`}
      style={{
        width: s.chip,
        height: s.chip,
        fontSize: s.fontSize,
      }}
    >
      <div
        className="rounded-full border border-current/30 flex items-center justify-center"
        style={{ width: s.inner, height: s.inner }}
      >
        ${value}
      </div>
    </div>
  );
}

function MixedPile({
  chips,
  size,
  maxPerStack,
}: {
  chips: number[];
  size: "xs" | "sm" | "md";
  maxPerStack: number;
}) {
  const s = SIZES[size];
  if (chips.length === 0) return null;

  const piles: number[][] = [];
  for (let i = 0; i < chips.length; i += maxPerStack) {
    piles.push(chips.slice(i, i + maxPerStack));
  }

  return (
    <div className="flex items-end" style={{ gap: s.gap }}>
      {piles.map((pile, pi) => {
        const totalHeight = s.chip + (pile.length - 1) * s.offset;
        return (
          <div key={pi} className="relative" style={{ width: s.chip, height: totalHeight }}>
            {pile.map((value, i) => {
              const style = CHIP_STYLES[value];
              return (
                <div
                  key={i}
                  className={`absolute rounded-full ${style.bg} ${style.border} ${style.text} border-2 flex items-center justify-center font-bold select-none ${style.shadow} shadow-md`}
                  style={{
                    width: s.chip,
                    height: s.chip,
                    bottom: i * s.offset,
                    left: 0,
                    zIndex: i,
                    fontSize: s.fontSize,
                  }}
                >
                  <div
                    className="rounded-full border border-current/30 flex items-center justify-center"
                    style={{ width: s.inner, height: s.inner }}
                  >
                    ${value}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function DenomStacks({
  value,
  count,
  size,
  maxPerStack,
}: {
  value: number;
  count: number;
  size: "xs" | "sm" | "md";
  maxPerStack: number;
}) {
  const s = SIZES[size];

  const piles: number[] = [];
  let remaining = count;
  while (remaining > 0) {
    piles.push(Math.min(remaining, maxPerStack));
    remaining -= maxPerStack;
  }

  return (
    <>
      {piles.map((pileCount, pi) => {
        const totalHeight = s.chip + (pileCount - 1) * s.offset;
        return (
          <div key={pi} className="relative" style={{ width: s.chip, height: totalHeight }}>
            {Array.from({ length: pileCount }, (_, i) => (
              <SingleChipAbsolute key={i} value={value} size={size} index={i} />
            ))}
          </div>
        );
      })}
    </>
  );
}

function SingleChipAbsolute({
  value,
  size,
  index,
}: {
  value: number;
  size: "xs" | "sm" | "md";
  index: number;
}) {
  const s = SIZES[size];
  const style = CHIP_STYLES[value];
  return (
    <div
      className={`absolute rounded-full ${style.bg} ${style.border} ${style.text} border-2 flex items-center justify-center font-bold select-none ${style.shadow} shadow-md`}
      style={{
        width: s.chip,
        height: s.chip,
        bottom: index * s.offset,
        left: 0,
        zIndex: index,
        fontSize: s.fontSize,
      }}
    >
      <div
        className="rounded-full border border-current/30 flex items-center justify-center"
        style={{ width: s.inner, height: s.inner }}
      >
        ${value}
      </div>
    </div>
  );
}

export function ChipStacks({
  amount,
  size = "md",
  maxPerStack = 6,
  mixed = false,
  bankLayout = false,
}: {
  amount: number;
  size?: "xs" | "sm" | "md";
  maxPerStack?: number;
  mixed?: boolean;
  /** When true (grouped layout only), prefer at least 2 of each denom in rack when balance allows. */
  bankLayout?: boolean;
}) {
  const s = SIZES[size];

  if (amount <= 0) {
    return (
      <div
        className="rounded-full border-2 border-dashed border-white/20 flex items-center justify-center"
        style={{ width: s.chip, height: s.chip }}
      >
        <span className="text-white/20" style={{ fontSize: s.fontSize }}>$0</span>
      </div>
    );
  }

  if (mixed) {
    const chips = decomposeToFlatList(amount);
    return <MixedPile chips={chips} size={size} maxPerStack={maxPerStack} />;
  }

  const groups = bankLayout ? decomposeIntoChipsForBank(amount) : decomposeIntoChips(amount);

  return (
    <div className="flex items-end" style={{ gap: s.gap }}>
      {DENOMS.filter((d) => groups.has(d)).map((denom) => (
        <DenomStacks
          key={denom}
          value={denom}
          count={groups.get(denom)!}
          size={size}
          maxPerStack={maxPerStack}
        />
      ))}
    </div>
  );
}
