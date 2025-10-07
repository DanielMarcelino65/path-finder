'use client';
import React from 'react';

export type UserCase = {
  id: string; // uuid
  name: string; // rótulo do caso
  lines: string[]; // mesmas linhas dos exemplos ('.', '#', 'S', 'G')
  createdAt: number;
};

const LS_KEY = 'pathviz:cases:v1';

function readCases(): UserCase[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as UserCase[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeCases(cases: UserCase[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(cases));
  } catch {}
}

type Ctx = {
  cases: UserCase[];
  addCase: (c: Omit<UserCase, 'id' | 'createdAt'>) => UserCase;
  updateCase: (id: string, patch: Partial<UserCase>) => void;
  removeCase: (id: string) => void;
  mounted: boolean;
};

const CasesContext = React.createContext<Ctx | null>(null);

export function CasesProvider({ children }: { children: React.ReactNode }) {
  const [cases, setCases] = React.useState<UserCase[]>([]);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setCases(readCases());
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    writeCases(cases);
  }, [cases, mounted]);

  const addCase: Ctx['addCase'] = (c) => {
    const nc: UserCase = {
      ...c,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    setCases((prev) => [nc, ...prev]);
    return nc;
  };

  const updateCase: Ctx['updateCase'] = (id, patch) => {
    setCases((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };

  const removeCase: Ctx['removeCase'] = (id) => {
    setCases((prev) => prev.filter((x) => x.id !== id));
  };

  const value = React.useMemo(
    () => ({
      cases,
      addCase,
      updateCase,
      removeCase,
      mounted,
    }),
    [cases, mounted]
  );

  return (
    <CasesContext.Provider value={value}>{children}</CasesContext.Provider>
  );
}

export function useCases() {
  const ctx = React.useContext(CasesContext);
  if (!ctx)
    throw new Error('useCases deve ser usado dentro de <CasesProvider>.');
  return ctx;
}
