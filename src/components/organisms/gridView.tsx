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
  cellSize?: number;
  heuristics?: (number | null)[][];
};

export default function GridView({
  grid,
  start,
  goal,
  frontier = [],
  visited = [],
  path = null,
  cellSize = 22,
  heuristics,
}: Props) {
  const rows = grid.length,
    cols = grid[0].length;

  const frontierSet = React.useMemo(
    () => new Set(frontier.map((p) => `${p[0]},${p[1]}`)),
    [frontier]
  );
  const visitedSet = React.useMemo(
    () => new Set(visited.map((p) => `${p[0]},${p[1]}`)),
    [visited]
  );
  const pathSet = React.useMemo(
    () => new Set((path ?? []).map((p) => `${p[0]},${p[1]}`)),
    [path]
  );

  const fontSize = Math.max(9, Math.floor(cellSize * 0.55));

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
          gap: 2,
          width: 'max-content',
        }}
      >
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const id = `${r},${c}`;
            let bg = cell === 1 ? '#111' : '#eee';
            if (visitedSet.has(id)) bg = '#ffb74d';
            if (frontierSet.has(id)) bg = '#64b5f6';
            if (pathSet.has(id)) bg = '#81c784';
            if (r === start[0] && c === start[1]) bg = '#26a69a';
            if (r === goal[0] && c === goal[1]) bg = '#ef5350';

            const textOnDark = [
              '#111',
              '#26a69a',
              '#ef5350',
              '#64b5f6',
            ].includes(bg);
            const color = textOnDark ? 'white' : '#111';

            // valor h(n) se existir e se não for obstáculo
            const hVal = heuristics?.[r]?.[c] ?? null;

            return (
              <div
                key={id}
                style={{
                  width: cellSize,
                  height: cellSize,
                  background: bg,
                  borderRadius: 3,
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {hVal !== null && hVal !== undefined && (
                  <span
                    style={{
                      fontSize,
                      lineHeight: 1,
                      fontWeight: 600,
                      color,
                      userSelect: 'none',
                      pointerEvents: 'none',
                    }}
                  >
                    {hVal}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
