'use client';
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import Button from '@/components/atoms/Button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

type Point = [number, number];

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (name: string, lines: string[]) => void;
};

type Brush = 'wall' | 'erase' | 'start' | 'goal';

export default function CaseEditorDialog({
  open,
  onOpenChange,
  onSave,
}: Props) {
  const [name, setName] = React.useState('Meu mapa');
  const [rows, setRows] = React.useState(15);
  const [cols, setCols] = React.useState(25);
  const [grid, setGrid] = React.useState<number[][]>(() => mkGrid(15, 25));
  const [start, setStart] = React.useState<Point>([0, 0]);
  const [goal, setGoal] = React.useState<Point>([14, 24]);
  const [brush, setBrush] = React.useState<Brush>('wall');
  const [cellSize, setCellSize] = React.useState(22);
  const [isDrawing, setIsDrawing] = React.useState(false);

  // redimensiona mantendo o que for possível
  React.useEffect(() => {
    setGrid((prev) => resizeGrid(prev, rows, cols));
    setStart(([r, c]) => [Math.min(r, rows - 1), Math.min(c, cols - 1)]);
    setGoal(([r, c]) => [Math.min(r, rows - 1), Math.min(c, cols - 1)]);
  }, [rows, cols]);

  const handleCellAction = (r: number, c: number) => {
    if (brush === 'start') {
      setStart([r, c]);
      return;
    }
    if (brush === 'goal') {
      setGoal([r, c]);
      return;
    }
    setGrid((prev) => {
      const g = prev.map((row) => [...row]);
      if (brush === 'wall') g[r][c] = 1;
      if (brush === 'erase') g[r][c] = 0;
      return g;
    });
  };

  const handlePointerDown = (r: number, c: number) => {
    setIsDrawing(true);
    handleCellAction(r, c);
  };
  const handlePointerEnter = (r: number, c: number, e: React.PointerEvent) => {
    if (!isDrawing || (e.buttons & 1) === 0) return;
    handleCellAction(r, c);
  };
  const handlePointerUp = () => setIsDrawing(false);

  React.useEffect(() => {
    const stop = () => setIsDrawing(false);
    window.addEventListener('pointerup', stop);
    return () => window.removeEventListener('pointerup', stop);
  }, []);

  const lines = React.useMemo(
    () => toLines(grid, start, goal),
    [grid, start, goal]
  );

  const canSave = name.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* limite de altura do dialog e layout em coluna */}
      <DialogContent className="max-w-[min(1000px,95vw)] max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Novo caso (desenhe seu mapa)</DialogTitle>
        </DialogHeader>

        {/* área de conteúdo com rolagem apenas no grid */}
        <div className="flex-1 min-h-0 flex flex-col gap-4 p-1 sm:p-2">
          {/* controles superiores (fixos) */}
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex flex-col gap-2">
              <Label>Nome</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Labirinto 1"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Linhas: {rows}</Label>
              <Slider
                min={5}
                max={60}
                step={1}
                value={[rows]}
                onValueChange={(v) => setRows(v[0])}
                className="w-56"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Colunas: {cols}</Label>
              <Slider
                min={5}
                max={90}
                step={1}
                value={[cols]}
                onValueChange={(v) => setCols(v[0])}
                className="w-56"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Tamanho célula: {cellSize}px</Label>
              <Slider
                min={12}
                max={32}
                step={1}
                value={[cellSize]}
                onValueChange={(v) => setCellSize(v[0])}
                className="w-48"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Ferramenta</Label>
              <ToggleGroup
                type="single"
                value={brush}
                onValueChange={(v) => v && setBrush(v as Brush)}
              >
                <ToggleGroupItem value="wall">Pintar muro</ToggleGroupItem>
                <ToggleGroupItem value="erase">Apagar</ToggleGroupItem>
                <ToggleGroupItem value="start">Início (S)</ToggleGroupItem>
                <ToggleGroupItem value="goal">Objetivo (G)</ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          {/* WRAPPER rolável do grid */}
          <div
            className="flex-1 min-h-0 overflow-auto rounded-lg border p-2"
            style={{ maxHeight: '60vh' }}
            onPointerUp={handlePointerUp}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
                gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
                gap: 2,
                width: 'max-content',
                userSelect: 'none',
                touchAction: 'none',
              }}
            >
              {grid.map((row, r) =>
                row.map((cell, c) => {
                  const isStart = r === start[0] && c === start[1];
                  const isGoal = r === goal[0] && c === goal[1];
                  let bg = cell === 1 ? '#111' : '#eee';
                  if (isStart) bg = '#26a69a';
                  if (isGoal) bg = '#ef5350';
                  return (
                    <div
                      key={`${r},${c}`}
                      style={{
                        width: cellSize,
                        height: cellSize,
                        background: bg,
                        borderRadius: 3,
                        cursor: 'crosshair',
                      }}
                      onPointerDown={() => handlePointerDown(r, c)}
                      onPointerEnter={(e) => handlePointerEnter(r, c, e)}
                    />
                  );
                })
              )}
            </div>
          </div>

          {/* legenda rápida */}
          <div className="text-xs text-muted-foreground">
            Clique ou arraste para pintar obstáculos (muro). Troque a ferramenta
            para definir Início (S) e Objetivo (G).
          </div>
        </div>

        {/* rodapé sempre acessível */}
        <DialogFooter className="sticky bottom-0 bg-background border-t mt-2">
          <Button onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            disabled={!canSave}
            onClick={() => {
              onSave(name.trim(), lines);
              onOpenChange(false);
            }}
          >
            Salvar caso
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function mkGrid(r: number, c: number) {
  return Array.from({ length: r }, () => Array.from({ length: c }, () => 0));
}

function resizeGrid(prev: number[][], nr: number, nc: number) {
  const out = Array.from({ length: nr }, (_, r) =>
    Array.from({ length: nc }, (_, c) => prev[r]?.[c] ?? 0)
  );
  return out;
}

function toLines(grid: number[][], start: Point, goal: Point) {
  const lines: string[] = [];
  for (let r = 0; r < grid.length; r++) {
    let line = '';
    for (let c = 0; c < grid[0].length; c++) {
      let ch = grid[r][c] === 1 ? '#' : '.';
      if (r === start[0] && c === start[1]) ch = 'S';
      if (r === goal[0] && c === goal[1]) ch = 'G';
      line += ch;
    }
    lines.push(line);
  }
  return lines;
}
