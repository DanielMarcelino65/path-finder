// app/components/GridView.tsx
'use client';
import React from 'react';
import type { Grid, Point } from '@/lib/algorithms';

type Props = {
  grid: Grid;
  start: Point;
  goal: Point;
  frontier?: Point[];
  visited?: Point[];
  path?: Point[] | null;
  cellSize?: number; // px
};

export default function GridView({
  grid,
  start,
  goal,
  frontier = [],
  visited = [],
  path = null,
  cellSize = 22,
}: Props) {
  const rows = grid.length,
    cols = grid[0].length;
  const frontierSet = new Set(frontier.map((p) => `${p[0]},${p[1]}`));
  const visitedSet = new Set(visited.map((p) => `${p[0]},${p[1]}`));
  const pathSet = new Set((path ?? []).map((p) => `${p[0]},${p[1]}`));
  //Verificar se a celula visitada é igual a uma celula do caminho
  visited.forEach((cell) => {
    if (pathSet.has(`${cell[0]},${cell[1]}`)) {
      console.log(`Célula visitada ${cell} está no caminho`);
    }
  });

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
        gap: 2,
      }}
    >
      {grid.map((row, r) =>
        row.map((cell, c) => {
          const id = `${r},${c}`;
          let bg = cell === 1 ? '#111' : '#eee'; // obstáculo / livre
          if (visitedSet.has(id)) bg = '#ffb74d'; // laranja: expandidos
          if (frontierSet.has(id)) bg = '#64b5f6'; // azul: fronteira
          if (pathSet.has(id)) bg = '#81c784'; // verde: caminho

          if (r === start[0] && c === start[1]) bg = '#26a69a'; // S
          if (r === goal[0] && c === goal[1]) bg = '#ef5350'; // G
          return (
            <div
              key={id}
              style={{
                width: cellSize,
                height: cellSize,
                background: bg,
                borderRadius: 3,
              }}
            />
          );
        })
      )}
    </div>
  );
}
