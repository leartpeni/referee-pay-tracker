interface SwitchProps {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/** Accessible toggle: a native checkbox with role="switch" inside a <label>. */
export function Switch({ id, label, description, checked, onChange }: SwitchProps) {
  return (
    <label htmlFor={id} className="flex min-h-11 cursor-pointer items-center justify-between gap-4">
      <span>
        <span className="block font-semibold text-navy">{label}</span>
        {description && <span className="block text-sm text-muted">{description}</span>}
      </span>
      <span className="relative inline-flex shrink-0">
        <input
          id={id}
          type="checkbox"
          role="switch"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className="h-8 w-14 rounded-full bg-stone-300 transition-colors peer-checked:bg-emerald-600 peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent"
        />
        <span
          aria-hidden="true"
          className="absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition-transform peer-checked:translate-x-6"
        />
      </span>
    </label>
  );
}

