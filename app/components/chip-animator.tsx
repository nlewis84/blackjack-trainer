import {
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import { CHIP_STYLES } from "./chip-stacks";

const DURATION = 450;
const ARC_HEIGHT = 80;
const CHIP_SIZE = 40;
const INNER_SIZE = 30;
const FONT_SIZE = 9;

type ActiveChip = {
  id: number;
  value: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  startTime: number;
};

export type ChipAnimatorHandle = {
  launch: (value: number, from: DOMRect, to: DOMRect) => void;
};

let nextId = 0;

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function AnimatedChip({
  chip,
  onDone,
}: {
  chip: ActiveChip;
  onDone: (id: number) => void;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    function tick() {
      const el = elRef.current;
      if (!el) return;

      const elapsed = performance.now() - chip.startTime;
      const raw = Math.min(elapsed / DURATION, 1);
      const t = easeOutCubic(raw);

      const x = chip.fromX + (chip.toX - chip.fromX) * t;
      const y =
        chip.fromY +
        (chip.toY - chip.fromY) * t -
        ARC_HEIGHT * Math.sin(Math.PI * raw);
      const scale = 1 + 0.3 * Math.sin(Math.PI * raw);
      const shadow = 4 + 12 * Math.sin(Math.PI * raw);

      el.style.transform = `translate(${x - CHIP_SIZE / 2}px, ${y - CHIP_SIZE / 2}px) scale(${scale})`;
      el.style.boxShadow = `0 ${shadow}px ${shadow * 2}px rgba(0,0,0,0.4)`;

      if (raw < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        onDone(chip.id);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [chip, onDone]);

  const style = CHIP_STYLES[chip.value];

  return (
    <div
      ref={elRef}
      className={`absolute top-0 left-0 rounded-full ${style.bg} ${style.border} ${style.text} border-2 flex items-center justify-center font-bold select-none`}
      style={{
        width: CHIP_SIZE,
        height: CHIP_SIZE,
        fontSize: FONT_SIZE,
        willChange: "transform",
        transform: `translate(${chip.fromX - CHIP_SIZE / 2}px, ${chip.fromY - CHIP_SIZE / 2}px) scale(1)`,
      }}
    >
      <div
        className="rounded-full border border-current/30 flex items-center justify-center"
        style={{ width: INNER_SIZE, height: INNER_SIZE }}
      >
        ${chip.value}
      </div>
    </div>
  );
}

export const ChipAnimator = forwardRef<ChipAnimatorHandle>(
  function ChipAnimator(_, ref) {
    const [chips, setChips] = useState<ActiveChip[]>([]);

    useImperativeHandle(ref, () => ({
      launch(value: number, from: DOMRect, to: DOMRect) {
        const chip: ActiveChip = {
          id: ++nextId,
          value,
          fromX: from.left + from.width / 2,
          fromY: from.top + from.height / 2,
          toX: to.left + to.width / 2,
          toY: to.top + to.height / 2,
          startTime: performance.now(),
        };
        setChips((prev) => [...prev, chip]);
      },
    }));

    const handleDone = useCallback((id: number) => {
      setChips((prev) => prev.filter((c) => c.id !== id));
    }, []);

    if (chips.length === 0) return null;

    return createPortal(
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        {chips.map((c) => (
          <AnimatedChip key={c.id} chip={c} onDone={handleDone} />
        ))}
      </div>,
      document.body
    );
  }
);
