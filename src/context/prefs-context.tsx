// app/context/prefs-context.tsx
'use client';
import React from 'react';

export type Alg = 'astar' | 'greedy';

type Preferences = {
  version: 1;
  alg: Alg;
  caseIdx: number;
  speed: number;
};

const DEFAULT_PREFS: Preferences = {
  version: 1,
  alg: 'astar',
  caseIdx: 0,
  speed: 40,
};

const LS_KEY = 'pathviz:prefs:v1';

const PrefsContext = React.createContext<{
  prefs: Preferences;
  setAlg: (alg: Alg) => void;
  setCaseIdx: (i: number) => void;
  setSpeed: (s: number) => void;
  resetPrefs: () => void;
  mounted: boolean;
} | null>(null);

export function PrefsProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = React.useState<Preferences>(DEFAULT_PREFS);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setPrefs((p) => ({ ...p, ...parsed }));
      }
    } catch {}
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(prefs));
    } catch {}
  }, [prefs, mounted]);

  const setAlg = (alg: Alg) => setPrefs((p) => ({ ...p, alg }));
  const setCaseIdx = (i: number) => setPrefs((p) => ({ ...p, caseIdx: i }));
  const setSpeed = (s: number) => setPrefs((p) => ({ ...p, speed: s }));
  const resetPrefs = () => setPrefs(DEFAULT_PREFS);

  const value = React.useMemo(
    () => ({ prefs, setAlg, setCaseIdx, setSpeed, resetPrefs, mounted }),
    [prefs, mounted]
  );

  return (
    <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>
  );
}

export function usePrefs() {
  const ctx = React.useContext(PrefsContext);
  if (!ctx)
    throw new Error('usePrefs deve ser usado dentro de <PrefsProvider>.');
  return ctx;
}
