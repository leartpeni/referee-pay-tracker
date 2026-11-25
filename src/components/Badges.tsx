export function CategoryBadge({ category }: { category: string }) {
  const long = category.length > 4;
  return (
    <span
      className={`inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl bg-navy px-2 text-center font-bold text-white ${
        long ? 'w-24 py-1 text-xs leading-tight break-words' : 'text-sm'
      }`}
    >
      {category}
    </span>
  );
}

export function PaidTag({ paid }: { paid: boolean }) {
  return paid ? (
    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
      Paid
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-800">
      Unpaid
    </span>
  );
}

