// app/lib/examples.ts
export const examples: Array<[string, string[]]> = [
  [
    '🟢 Simples',
    [
      '..........',
      '.S........',
      '.#######..',
      '..........',
      '.......G..',
      '..........',
    ],
  ],
  [
    '🟢 Corredor',
    ['S####.....', '....#.....', '#######.##', '.....#...G', '.....#####'],
  ],
  [
    '🟢 Heurística enganosa',
    [
      'S.....#####................',
      '#####.#####.##############.',
      '..........#...............G',
      '.########.#.###############',
      '..........#.................',
    ],
  ],
  [
    '🟢 Becos',
    [
      'S..#..#..#..#..#..#..#..#G',
      '##.#..#..#..#..#..#..#..##',
      '..#..#..#..#..#..#..#..#..',
      '##..#..#..#..#..#..#..#..#',
      '..#..#..#..#..#..#..#..#..',
    ],
  ],
  // Ex5: pseudo-aleatória (fixa) — mesma ideia do Python
  [
    '🟢 Grande aleatória',
    (() => {
      const rows = 20,
        cols = 35;
      const rnd = mulberry32(42); // seed
      const g: string[] = [];
      for (let r = 0; r < rows; r++) {
        let line = '';
        for (let c = 0; c < cols; c++) {
          if ((r === 0 && c === 0) || (r === rows - 1 && c === cols - 1))
            line += '.';
          else line += rnd() < 0.22 ? '#' : '.';
        }
        g.push(line);
      }
      g[0] = 'S' + g[0].slice(1);
      g[rows - 1] = g[rows - 1].slice(0, cols - 1) + 'G';
      return g;
    })(),
  ],
];

// PRNG simples e determinístico pra seed 42 (substitui random.seed do Python)
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
