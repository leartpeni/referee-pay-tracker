export function formatMoney(amount: number, currency: string): string {
  const hasCents = Math.round(amount * 100) % 100 !== 0;
  const n = amount.toLocaleString(undefined, {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  });
  return `${currency}${n}`;
}

export function locationLabel(location: 'in_town' | 'out_of_town'): string {
  return location === 'in_town' ? 'In town' : 'Out of town';
}

