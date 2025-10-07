export type Point = [number, number];
export type Grid = number[][];

export type StepSnapshot = {
  cur?: Point;
  frontier: Point[];
  visitedOrPopped?: Point[];
  cameFromPartial?: Record<string, string>;
};

export type SolveMetrics = {
  path: Point[] | null;
  cost: number | null;
  expanded: number;
  relaxations: number;
  frontier_peak: number;
  elapsed_ms: number;
  steps?: StepSnapshot[];
};

export const DIRS: Point[] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
]; // 4-neighbors

export function inBounds(grid: Grid, r: number, c: number) {
  return r >= 0 && r < grid.length && c >= 0 && c < grid[0].length; // :contentReference[oaicite:4]{index=4}
}
export function passable(grid: Grid, r: number, c: number) {
  return grid[r][c] === 0; // :contentReference[oaicite:5]{index=5}
}
export function neighbors(grid: Grid, node: Point): Point[] {
  const [r, c] = node;
  const out: Point[] = [];
  for (const [dr, dc] of DIRS) {
    const nr = r + dr,
      nc = c + dc;
    if (inBounds(grid, nr, nc) && passable(grid, nr, nc)) out.push([nr, nc]);
  }
  return out; // :contentReference[oaicite:6]{index=6}
}

export function manhattan(a: Point, b: Point) {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]); // :contentReference[oaicite:7]{index=7}
}

function key(p: Point) {
  return `${p[0]},${p[1]}`;
}
function unkey(s: string): Point {
  const [r, c] = s.split(',').map(Number);
  return [r, c];
}

export function reconstructPath(
  cameFrom: Record<string, string>,
  start: Point,
  goal: Point
): Point[] | null {
  const gk = key(goal);
  if (!cameFrom[gk]) return null;
  let cur = gk;
  const path: Point[] = [];
  while (cur !== key(start)) {
    path.push(unkey(cur));
    cur = cameFrom[cur];
  }
  path.push(start);
  path.reverse();
  return path; // :contentReference[oaicite:8]{index=8}
}

// -------- Min-heap simples (tupla) --------
class MinHeap<T> {
  constructor(private cmp: (a: T, b: T) => number, private data: T[] = []) {}
  push(x: T) {
    this.data.push(x);
    this.bubbleUp(this.data.length - 1);
  }
  pop(): T | undefined {
    if (this.data.length === 0) return undefined;
    const top = this.data[0];
    const last = this.data.pop()!;
    if (this.data.length) {
      this.data[0] = last;
      this.bubbleDown(0);
    }
    return top;
  }
  peek(): T | undefined {
    return this.data[0];
  }
  size() {
    return this.data.length;
  }
  private bubbleUp(i: number) {
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.cmp(this.data[i], this.data[p]) >= 0) break;
      [this.data[i], this.data[p]] = [this.data[p], this.data[i]];
      i = p;
    }
  }
  private bubbleDown(i: number) {
    const n = this.data.length;
    for (;;) {
      let s = i;
      const l = (i << 1) + 1,
        r = l + 1;
      if (l < n && this.cmp(this.data[l], this.data[s]) < 0) s = l;
      if (r < n && this.cmp(this.data[r], this.data[s]) < 0) s = r;
      if (s === i) break;
      [this.data[i], this.data[s]] = [this.data[s], this.data[i]];
      i = s;
    }
  }
  toArray(): T[] {
    return [...this.data];
  } // útil pra snapshot da frontier
}

export function bfsShortestPath(
  grid: number[][],
  start: [number, number],
  goal: [number, number]
): { path: [number, number][] | null; distance: number | null } {
  const rows = grid.length,
    cols = grid[0].length;
  const inBounds = (r: number, c: number) =>
    r >= 0 && r < rows && c >= 0 && c < cols;
  const passable = (r: number, c: number) => grid[r][c] === 0;
  const DIRS: [number, number][] = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  const k = (p: [number, number]) => `${p[0]},${p[1]}`;
  const unkey = (s: string) => s.split(',').map(Number) as [number, number];

  const q: [number, number][] = [start];
  const cameFrom: Record<string, string> = {};
  const dist = new Map<string, number>();
  dist.set(k(start), 0);

  while (q.length) {
    const cur = q.shift()!;
    if (cur[0] === goal[0] && cur[1] === goal[1]) {
      // reconstruct
      const path: [number, number][] = [];
      let curk = k(goal);
      const sk = k(start);
      if (!cameFrom[curk] && curk !== sk) return { path: [start], distance: 0 };
      while (curk !== sk) {
        path.push(unkey(curk));
        curk = cameFrom[curk];
      }
      path.push(start);
      path.reverse();
      return { path, distance: path.length ? path.length - 1 : null };
    }
    for (const [dr, dc] of DIRS) {
      const nr = cur[0] + dr,
        nc = cur[1] + dc;
      const nk = k([nr, nc]);
      if (inBounds(nr, nc) && passable(nr, nc) && !dist.has(nk)) {
        dist.set(nk, dist.get(k(cur))! + 1);
        cameFrom[nk] = k(cur);
        q.push([nr, nc]);
      }
    }
  }
  return { path: null, distance: null };
}

// -------- A* --------
type AStarNode = { f: number; h: number; tie: number; p: Point };

export function astar(
  grid: Grid,
  start: Point,
  goal: Point,
  h = manhattan,
  options?: { collectSteps?: boolean }
): SolveMetrics {
  const t0 = performance.now();

  const g = new Map<string, number>();
  g.set(key(start), 0);
  const cameFrom: Record<string, string> = {};

  let counter = 0;
  const pq = new MinHeap<AStarNode>((a, b) =>
    a.f !== b.f ? a.f - b.f : a.h !== b.h ? a.h - b.h : a.tie - b.tie
  );
  pq.push({ f: h(start, goal), h: 0, tie: counter, p: start });

  let expanded = 0;
  let relaxations = 0;
  let frontier_peak = 1;
  const visitedPopped = new Set<string>(); // estatística de expandidos
  const steps: StepSnapshot[] = [];

  const record = (cur?: Point) => {
    if (!options?.collectSteps) return;
    steps.push({
      cur,
      frontier: pq.toArray().map((n) => n.p),
      visitedOrPopped: [...visitedPopped].map(unkey),
      cameFromPartial: { ...cameFrom },
    });
  };

  record(); // estado inicial

  while (pq.size()) {
    frontier_peak = Math.max(frontier_peak, pq.size());
    const { p: cur } = pq.pop()!;
    const ck = key(cur);
    if (visitedPopped.has(ck)) {
      record(cur);
      continue;
    }
    visitedPopped.add(ck);
    expanded++;

    if (cur[0] === goal[0] && cur[1] === goal[1]) {
      const path = reconstructPath(cameFrom, start, goal);
      const elapsed_ms = performance.now() - t0;
      record(cur);
      return {
        path,
        cost: path ? g.get(ck)! : null,
        expanded,
        relaxations,
        frontier_peak,
        elapsed_ms,
        steps: options?.collectSteps ? steps : undefined,
      };
    }

    for (const nxt of neighbors(grid, cur)) {
      const nk = key(nxt);
      const tentative = (g.get(ck) ?? Infinity) + 1; // custo unitário // :contentReference[oaicite:10]{index=10}
      if (tentative < (g.get(nk) ?? Infinity)) {
        if (g.has(nk)) relaxations++; // relaxamento // :contentReference[oaicite:11]{index=11}
        g.set(nk, tentative);
        cameFrom[nk] = ck;
        counter++;
        const fn = tentative + h(nxt, goal);
        pq.push({ f: fn, h: h(nxt, goal), tie: counter, p: nxt });
      }
    }
    record(cur);
  }

  const elapsed_ms = performance.now() - t0;
  record();
  return {
    path: null,
    cost: null,
    expanded,
    relaxations,
    frontier_peak,
    elapsed_ms,
    steps: options?.collectSteps ? steps : undefined,
  };
}

// -------- Greedy Best-First --------
type GreedyNode = { h: number; tie: number; p: Point };

export function greedyBestFirst(
  grid: Grid,
  start: Point,
  goal: Point,
  h = manhattan,
  options?: { collectSteps?: boolean }
): SolveMetrics {
  const t0 = performance.now();
  const cameFrom: Record<string, string> = {};
  const seen = new Set<string>([key(start)]);
  let counter = 0;

  const pq = new MinHeap<GreedyNode>((a, b) =>
    a.h !== b.h ? a.h - b.h : a.tie - b.tie
  );
  pq.push({ h: h(start, goal), tie: counter, p: start });

  let expanded = 0;
  let frontier_peak = 1;

  const popped = new Set<string>(); // NEW

  const steps: StepSnapshot[] = [];
  const record = (cur?: Point) => {
    if (!options?.collectSteps) return;
    steps.push({
      cur,
      frontier: pq.toArray().map((n) => n.p),
      cameFromPartial: { ...cameFrom },
      visitedOrPopped: [...popped].map(unkey), // NEW
    });
  };

  record(); // estado inicial

  while (pq.size()) {
    frontier_peak = Math.max(frontier_peak, pq.size());

    const { p: cur } = pq.pop()!;
    popped.add(key(cur)); // NEW
    expanded++;

    if (cur[0] === goal[0] && cur[1] === goal[1]) {
      const path = reconstructPath(cameFrom, start, goal);
      const elapsed_ms = performance.now() - t0;
      record(cur);
      return {
        path,
        cost: path ? path.length - 1 : null,
        expanded,
        relaxations: 0,
        frontier_peak,
        elapsed_ms,
        steps: options?.collectSteps ? steps : undefined,
      };
    }

    for (const nxt of neighbors(grid, cur)) {
      const nk = key(nxt);
      if (!seen.has(nk)) {
        seen.add(nk);
        cameFrom[nk] = key(cur);
        counter++;
        pq.push({ h: h(nxt, goal), tie: counter, p: nxt });
      }
    }

    record(cur);
  }

  const elapsed_ms = performance.now() - t0;
  record();
  return {
    path: null,
    cost: null,
    expanded,
    relaxations: 0,
    frontier_peak,
    elapsed_ms,
    steps: options?.collectSteps ? steps : undefined,
  };
}

// -------- Parsing de mapas de texto ('.', '#', 'S', 'G') --------
export function asIntGridFromLines(lines: string[]): {
  grid: Grid;
  start: Point;
  goal: Point;
} {
  const grid: Grid = [];
  let start: Point | null = null;
  let goal: Point | null = null;

  lines.forEach((line, r) => {
    const row: number[] = [];
    [...line].forEach((ch, c) => {
      if (ch === '#') row.push(1);
      else row.push(0);
      if (ch === 'S') start = [r, c];
      if (ch === 'G') goal = [r, c];
    });
    grid.push(row);
  });

  if (!start || !goal) throw new Error("Coloque 'S' e 'G' no mapa.");
  return { grid, start, goal }; // :contentReference[oaicite:14]{index=14}
}

// (opcional) render para console, como no teu Python
export function renderWithPath(lines: string[], path: Point[] | null) {
  const mat = lines.map((row) => row.split(''));
  if (path) {
    for (const [r, c] of path) {
      if (mat[r][c] === '.') mat[r][c] = '*';
    }
  }
  return mat.map((r) => r.join('')).join('\n'); // :contentReference[oaicite:15]{index=15}
}
