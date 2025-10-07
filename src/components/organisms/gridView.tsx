'use client';
import React from 'react';
import type { Grid, Point } from '@/lib/algorithms';

const cellColors = {
  obstaculo: '#111',
  visitado: '#ffb74d',
  fronteira: '#64b5f6',
  caminho: '#81c784',
  inicio: '#26a69a',
  objetivo: '#ef5350',
};

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
  const gridRef = React.useRef<HTMLDivElement>(null);
  const [maxWidthCaption, setMaxWidthCaption] = React.useState(0);

  React.useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setMaxWidthCaption(el.offsetWidth));
    ro.observe(el);
    setMaxWidthCaption(el.offsetWidth);
    return () => ro.disconnect();
  }, []);
  const frontierSet = new Set(frontier.map((p) => `${p[0]},${p[1]}`));
  const visitedSet = new Set(visited.map((p) => `${p[0]},${p[1]}`));
  const pathSet = new Set((path ?? []).map((p) => `${p[0]},${p[1]}`));

  return (
    <>
      <div
        ref={gridRef}
        style={{
          display: 'grid',
          width: cols * (cellSize + 2),
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
      <div
        className="flex flex-row flex-wrap justify-around"
        style={{
          maxWidth: maxWidthCaption !== 0 ? maxWidthCaption : undefined,
        }}
      >
        {Object.entries(cellColors).map(([label, color]) => (
          <div key={label} className="flex gap-1 flex-1 items-center">
            <div
              style={{
                width: cellSize * 0.8,
                height: cellSize * 0.8,
                background: color,
                borderRadius: 3,
              }}
            />
            <span className="">
              {label.charAt(0).toUpperCase() + label.slice(1)}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
