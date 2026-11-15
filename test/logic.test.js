import { describe, it, expect } from 'vitest';
import {
  INGS, PER_DAY, MAX_ING, LAST_DAY, TIMER_DAY, TIMER_FLOOR,
  apply, patienceFor, dayCfg, untimedBonus, solveMap, genOrders, mixColor, shuffle,
} from '../src/logic.js';

const ing = id => INGS.find(g => g.id === id);

// Tiny seeded PRNG (mulberry32) so order generation is reproducible.
function seeded(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Independent brute force: fewest ingredients from 0 to target, or Infinity.
function fewestSteps(ings, target, maxD) {
  let frontier = new Set([0]);
  if (target === 0) return 0;
  for (let d = 1; d <= maxD; d++) {
    const next = new Set();
    for (const v of frontier) for (const g of ings) {
      const r = apply(v, g);
      if (r.err) continue;
      if (r.v === target) return d;
      next.add(r.v);
    }
    frontier = next;
  }
  return Infinity;
}

describe('apply', () => {
  it('adds', () => expect(apply(3, ing('ember'))).toEqual({ v: 13 }));
  it('subtracts but never below zero', () => {
    expect(apply(10, ing('frost'))).toEqual({ v: 3 });
    expect(apply(3, ing('salt'))).toEqual({ v: 0 });
    expect(apply(2, ing('salt')).err).toMatch(/below zero/);
  });
  it('multiplies up to the cauldron limit', () => {
    expect(apply(21, ing('dragon'))).toEqual({ v: 63 });
    expect(apply(500, ing('moon')).err).toMatch(/can’t hold/);
  });
  it('divides only evenly, with the ingredient’s own message', () => {
    expect(apply(27, ing('star'))).toEqual({ v: 9 });
    expect(apply(28, ing('star')).err).toBe(ing('star').err);
    expect(apply(7, ing('mist')).err).toBe(ing('mist').err);
  });
  it('every ingredient has a known op, and divisors carry an error message', () => {
    for (const g of INGS) {
      expect(['+', '−', '×', '÷']).toContain(g.op);
      if (g.op === '÷') expect(g.err).toBeTruthy();
    }
  });
});

describe('patienceFor', () => {
  it('is untimed before the timer day', () => {
    expect(patienceFor(1)).toBe(0);
    expect(patienceFor(TIMER_DAY - 1)).toBe(0);
  });
  it('starts at 30s and drops 5s a day to the floor', () => {
    expect(patienceFor(TIMER_DAY)).toBe(30);
    expect(patienceFor(TIMER_DAY + 1)).toBe(25);
    expect(patienceFor(LAST_DAY)).toBe(TIMER_FLOOR);
  });
});

describe('untimedBonus', () => {
  it('starts at 6 and loses one every 6 seconds', () => {
    expect(untimedBonus(0)).toBe(6);
    expect(untimedBonus(6)).toBe(5);
    expect(untimedBonus(36)).toBe(0);
    expect(untimedBonus(1000)).toBe(0);
  });
});

describe('dayCfg', () => {
  it('unlocks ingredients on their day', () => {
    expect(dayCfg(1).ings.map(g => g.id)).toEqual(['dew', 'bone', 'newt', 'ember']);
    expect(dayCfg(5).ings.map(g => g.id)).toContain('moon');
    expect(dayCfg(LAST_DAY).ings).toHaveLength(INGS.length);
  });
  it('keeps step ranges within the cauldron size', () => {
    for (let d = 1; d <= LAST_DAY; d++) {
      const c = dayCfg(d);
      expect(c.minD).toBeLessThanOrEqual(c.maxD);
      expect(c.maxD).toBeLessThanOrEqual(MAX_ING);
      expect(c.timed).toBe(d >= TIMER_DAY);
    }
  });
});

describe('solveMap', () => {
  it('finds shortest paths', () => {
    const dist = solveMap([ing('dew'), ing('ember')], 3);
    expect(dist.get(0)).toBe(0);
    expect(dist.get(10)).toBe(1);
    expect(dist.get(11)).toBe(2);
    expect(dist.get(30)).toBe(3);
    expect(dist.has(31)).toBe(false);
  });
});

describe('genOrders', () => {
  for (let d = 1; d <= LAST_DAY; d++) {
    it(`day ${d}: ${PER_DAY} distinct, solvable orders with an honest par`, () => {
      const c = dayCfg(d);
      for (const seed of [1, 42, 1337]) {
        const orders = genOrders(d, seeded(seed * 100 + d));
        expect(orders).toHaveLength(PER_DAY);
        expect(new Set(orders.map(o => o.t)).size).toBe(PER_DAY);
        for (const { t, par } of orders) {
          expect(par).toBeGreaterThanOrEqual(2);
          expect(par).toBeLessThanOrEqual(MAX_ING);
          // par is the true minimum, so the master's tip is always achievable
          expect(fewestSteps(c.ings, t, par)).toBe(par);
        }
      }
    });
  }
});

describe('shuffle', () => {
  it('keeps every element and does not mutate', () => {
    const a = [1, 2, 3, 4, 5];
    const s = shuffle(a, seeded(7));
    expect(a).toEqual([1, 2, 3, 4, 5]);
    expect([...s].sort()).toEqual(a);
  });
});

describe('mixColor', () => {
  it('uses broth for an empty cauldron', () => expect(mixColor([])).toBe('var(--broth)'));
  it('averages ingredient colours', () => {
    expect(mixColor([{ color: '#ff0000' }, { color: '#0000ff' }])).toBe('rgb(127,0,127)');
  });
});
