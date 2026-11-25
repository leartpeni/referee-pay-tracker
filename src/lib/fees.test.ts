import { describe, expect, it } from 'vitest';
import { calculateFee, DEFAULT_RATES, resolveFee, toRateTable } from './fees';

const rates = toRateTable(DEFAULT_RATES);

describe('calculateFee', () => {
  it.each([
    ['U12', 'in_town', 30],
    ['U12', 'out_of_town', 40],
    ['U14', 'in_town', 30],
    ['U14', 'out_of_town', 40],
    ['U16', 'in_town', 30],
    ['U16', 'out_of_town', 40],
    ['U18', 'in_town', 35],
    ['U18', 'out_of_town', 45],
    ['U21 Women', 'in_town', 40],
    ['U21 Women', 'out_of_town', 40],
    ['First League', 'in_town', 40],
    ['First League', 'out_of_town', 40],
    ['Second League', 'in_town', 35],
    ['Second League', 'out_of_town', 35],
    ['Superleague Women', 'in_town', 50],
    ['Superleague Women', 'out_of_town', 50],
    ['Superleague Men', 'in_town', 140],
    ['Superleague Men', 'out_of_town', 140],
    ['Veteran League', 'in_town', 35],
    ['Veteran League', 'out_of_town', 35],
  ] as const)('%s %s = %d', (category, location, expected) => {
    expect(calculateFee(rates, category, location)).toBe(expected);
  });

  it('returns undefined for an unknown category', () => {
    expect(calculateFee(rates, 'U20', 'in_town')).toBeUndefined();
  });

  it('uses edited rates and custom categories', () => {
    const custom = { ...rates, U20: { inTown: 50, outOfTown: 60 }, U12: { inTown: 32, outOfTown: 42 } };
    expect(calculateFee(custom, 'U20', 'out_of_town')).toBe(60);
    expect(calculateFee(custom, 'U12', 'in_town')).toBe(32);
  });
});

describe('resolveFee', () => {
  it('calculates from rates for a new game', () => {
    expect(resolveFee({ rates, category: 'U18', location: 'out_of_town' })).toBe(45);
  });

  it('returns 0 when the category has no rate', () => {
    expect(resolveFee({ rates, category: 'Senior', location: 'in_town' })).toBe(0);
  });

  it('a manual override always wins', () => {
    expect(resolveFee({ rates, category: 'U18', location: 'in_town', override: 50 })).toBe(50);
    expect(resolveFee({ rates, category: 'U18', location: 'in_town', override: 27.555 })).toBe(27.56);
  });

  it('never returns a negative override', () => {
    expect(resolveFee({ rates, category: 'U18', location: 'in_town', override: -5 })).toBe(0);
  });

  it('keeps the stored fee of a past game after rates change', () => {
    const newRates = { ...rates, U14: { inTown: 99, outOfTown: 99 } };
    const previous = { category: 'U14', location: 'in_town' as const, fee: 30 };
    expect(resolveFee({ rates: newRates, category: 'U14', location: 'in_town', previous })).toBe(30);
  });

  it('recalculates with current rates when category or location is changed on edit', () => {
    const previous = { category: 'U14', location: 'in_town' as const, fee: 30 };
    expect(resolveFee({ rates, category: 'U18', location: 'in_town', previous })).toBe(35);
    expect(resolveFee({ rates, category: 'U14', location: 'out_of_town', previous })).toBe(40);
  });

  it('recalculates when a previously overridden game has its override removed', () => {
    const previous = { category: 'U14', location: 'in_town' as const, fee: 55, feeOverridden: true };
    expect(resolveFee({ rates, category: 'U14', location: 'in_town', previous })).toBe(30);
  });
});

