'use client';
import React, { useMemo, useState, useEffect } from 'react';
import GridView from '@/components/organisms/gridView';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  asIntGridFromLines,
  astar,
  greedyBestFirst,
  bfsShortestPath,
} from '@/lib/algorithms';
import { examples } from '@/lib/examples';
import Button from '@/components/atoms/Button';
import { Slider } from '@/components/ui/slider';
import { speedToDelayMs } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

type Alg = 'astar' | 'greedy';
const SPEED_MIN = 5;
const SPEED_MAX = 100;

export default function Page() {
  const [caseIdx, setCaseIdx] = useState(0);
  const [alg, setAlg] = useState<Alg>('astar');
  const [showOptimalPath, setShowOptimalPath] = useState(true);
  const [speed, setSpeed] = useState(40); // ms/frame
  const lines = examples[caseIdx][1];

  const { grid, start, goal } = useMemo(
    () => asIntGridFromLines(lines),
    [lines]
  );

  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof astar> | null>(null);

  // roda o solver quando muda caso/alg
  useEffect(() => {
    setPlaying(false);
    setFrame(0);
    const run = () => {
      const solver = alg === 'astar' ? astar : greedyBestFirst;
      const res = solver(grid, start, goal, undefined, { collectSteps: true });
      setResult(res);
    };

    run();
  }, [caseIdx, alg, grid, start, goal]);

  // anima os steps
  useEffect(() => {
    if (!playing) return;
    if (!result?.steps?.length) return;
    if (frame >= result.steps.length - 1) {
      setPlaying(false);
      setFrame(result.steps.length - 1);
      return;
    }

    const delay = speedToDelayMs(speed);
    const t = setTimeout(() => setFrame((f) => f + 1), delay);
    return () => clearTimeout(t);
  }, [playing, frame, result?.steps, speed]);

  const step = result?.steps?.[frame];

  // extra: comparar com BFS (ótimo)
  const optimal = useMemo(
    () => bfsShortestPath(grid, start, goal),
    [grid, start, goal]
  );
  const k = (p: [number, number]) => `${p[0]},${p[1]}`;

  const greenProgressive = useMemo(() => {
    if (!optimal) return null;
    if (!step || !optimal.path?.length) return null;

    const optimalSet = new Set(optimal.path.map(k));

    const visitedNow = new Set((step.visitedOrPopped ?? []).map(k));

    const greens: [number, number][] = [];
    for (const p of optimal.path) {
      if (visitedNow.has(k(p))) greens.push(p);
    }
    return greens;
  }, [step, optimal.path]);

  const lastFrame = (result?.steps?.length ?? 1) - 1;
  const completed = !!result?.steps && frame >= lastFrame;

  const pathForGrid =
    completed && result?.path ? result.path : greenProgressive;

  return (
    <main className="p-6 flex flex-col gap-5 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold">Greedy vs A*</h1>
      <div className="flex gap-4 flex-wrap items-center">
        <label className="flex items-center gap-2">
          Caso:
          <Select
            onValueChange={(value) => setCaseIdx(Number(value))}
            value={String(caseIdx)}
          >
            <SelectTrigger className="w-[180px] border px-2 py-1 rounded">
              <SelectValue placeholder="Selecione um caso" />
            </SelectTrigger>
            <SelectContent>
              {examples.map(([name], i) => (
                <SelectItem key={i} value={String(i)}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="flex items-center gap-2">
          Algoritmo:
          <Select onValueChange={(value) => setAlg(value as Alg)} value={alg}>
            <SelectTrigger className="border px-2 py-1 rounded">
              <SelectValue placeholder="Selecione um algoritmo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="astar" onClick={() => setAlg('astar')}>
                A*
              </SelectItem>
              <SelectItem value="greedy" onClick={() => setAlg('greedy')}>
                Greedy Best-First
              </SelectItem>
            </SelectContent>
          </Select>
        </label>

        <label className="flex items-center gap-2">
          Velocidade:
          <Slider
            min={SPEED_MIN}
            max={SPEED_MAX}
            step={1}
            value={[speed]}
            onValueChange={(v) => setSpeed(v[0] ?? speed)}
            className="w-40"
          />
        </label>

        <Button
          onClick={() => setPlaying((p) => !p)}
          className="px-3 py-1 rounded bg-black text-white"
        >
          {playing ? 'Pausar' : 'Reproduzir'}
        </Button>

        <Button
          onClick={() => setFrame(0)}
          className="px-3 py-1 rounded border"
        >
          Reiniciar
        </Button>
        <div className="flex items-center">
          <Switch
            checked={showOptimalPath}
            onCheckedChange={setShowOptimalPath}
          />
          <Label className="ml-2 select-none text-sm">
            Mostrar caminho ótimo (BFS)
          </Label>
        </div>
      </div>

      <div className="flex gap-10 flex-wrap items-start">
        <div className="flex flex-col gap-3">
          <GridView
            grid={grid}
            start={start}
            goal={goal}
            frontier={step?.frontier}
            visited={step?.visitedOrPopped}
            path={showOptimalPath ? optimal.path : pathForGrid}
            cellSize={20}
          />
          <div className="text-sm text-gray-600">
            Frame {Math.min(frame, (result?.steps?.length ?? 1) - 1)} /{' '}
            {(result?.steps?.length ?? 1) - 1}
          </div>
        </div>

        <div className="text-sm leading-7 min-w-[320px]">
          <h2 className="font-medium mb-2">Métricas</h2>
          <ul className="list-disc ml-5">
            <li>
              Encontrou caminho? <b>{result?.path ? 'Sim' : 'Não'}</b>
            </li>
            <li>
              Custo/Comprimento: <b>{result?.cost ?? '—'}</b>
            </li>
            <li>
              Ótimo (BFS): <b>{optimal.distance ?? '—'}</b>
            </li>
            <li>
              Expanded: <b>{result?.expanded ?? '—'}</b>
            </li>
            <li>
              Relaxations: <b>{result?.relaxations ?? '—'}</b>
            </li>
            <li>
              Frontier Peak: <b>{result?.frontier_peak ?? '—'}</b>
            </li>
            <li>
              Tempo (ms):{' '}
              <b>
                {result && result.elapsed_ms != null
                  ? result.elapsed_ms.toFixed(2)
                  : '—'}
              </b>
            </li>
          </ul>
          {/* <p className="mt-3 text-gray-500">
            Dica: Greedy prioriza apenas h(n) e não garante ótimo; A* combina
            g(n)+h(n) (ótimo com heurística admissível).
            :contentReference[oaicite:18]{(index = 18)}{' '}
            :contentReference[oaicite:19]{(index = 19)}
          </p> */}
        </div>
      </div>
    </main>
  );
}
