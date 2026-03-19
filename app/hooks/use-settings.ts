import { useState, useCallback } from "react";
import { DEFAULT_SETTINGS, type GameSettings } from "~/lib/types";

const STORAGE_KEY = "blackjack-trainer-settings";

function loadSettings(): GameSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
  } catch {
    // ignore parse errors
  }
  return DEFAULT_SETTINGS;
}

export function useSettings() {
  const [settings, setSettings] = useState<GameSettings>(loadSettings);

  const updateSettings = useCallback((next: GameSettings) => {
    setSettings(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // storage full or unavailable
    }
  }, []);

  return [settings, updateSettings] as const;
}
