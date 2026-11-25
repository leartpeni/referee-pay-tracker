import { useId } from 'react';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Visually hide the group label (still read by screen readers). */
  hideLabel?: boolean;
}

/** Radio group styled as segmented buttons. Uses real radio inputs inside <label>s for accessibility. */
export function SegmentedControl<T extends string>({ label, options, value, onChange, hideLabel }: SegmentedControlProps<T>) {
  const name = useId();
  // Many options (e.g. 10 categories) wrap into a grid; few options stay in one row.
  const layout = options.length > 4 ? 'grid grid-cols-2 sm:grid-cols-3' : 'flex flex-wrap';
  return (
    <fieldset>
      <legend className={hideLabel ? 'sr-only' : 'mb-2 text-sm font-semibold text-navy'}>{label}</legend>
      <div className={`${layout} gap-1 rounded-2xl bg-stone-200/70 p-1`}>
        {options.map((o) => {
          const checked = o.value === value;
          return (
            <label
              key={o.value}
              className={`relative flex min-h-11 min-w-14 flex-1 cursor-pointer items-center justify-center rounded-xl px-3 py-1 text-center leading-tight font-semibold transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-accent ${
                checked ? 'bg-navy text-white shadow-sm' : 'text-navy hover:bg-white/70'
              }`}
            >
              <input
                type="radio"
                name={name}
                value={o.value}
                checked={checked}
                onChange={() => onChange(o.value)}
                className="sr-only"
              />
              {o.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

